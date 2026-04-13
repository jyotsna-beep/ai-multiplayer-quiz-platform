import io
import asyncio
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, Form, Body, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import pdfplumber
import bcrypt

from services.ai_generator import generate_questions
from services.room_manager import create_room, join_room, get_room
from database import rooms_collection, users_collection, history_collection
from security import create_token, verify_token

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# GLOBAL STATE
# -------------------------
connections = {}
answered_players = {}

# -------------------------
# SAFE BROADCAST (FIXED)
# -------------------------
async def broadcast(room_code, message):
    if room_code not in connections:
        return

    dead = []

    for player, ws in connections[room_code].items():
        try:
            await ws.send_json(message)
        except:
            dead.append(player)

    for d in dead:
        connections[room_code].pop(d, None)


# -------------------------
# SCORING SYSTEM (FIXED)
# -------------------------
def calculate_score(correct, time_taken, is_fastest, streak):
    """Calculate score based on correctness, speed, and streak"""
    
    if not correct:
        return 0  # No negative scores, just 0
    
    # Time penalty: lose 2 points per second (max 80 points loss)
    time_penalty = min(80, int(time_taken * 2))
    base = max(10, 100 - time_penalty)
    
    bonus = 0
    if is_fastest:
        bonus += 50  # First correct answer bonus
    if streak >= 3:
        bonus += 30  # Streak bonus
    elif streak >= 1:
        bonus += 10  # Small bonus for consecutive
    
    total_score = base + bonus
    return max(10, total_score)  # Minimum 10 points for correct answer


# -------------------------
# MODELS
# -------------------------
class CreateRoomRequest(BaseModel):
    host_name: str


class JoinRoomRequest(BaseModel):
    room_code: str
    player_name: str


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# BASIC
# -------------------------
@app.get("/")
def home():
    return {"message": "AI Multiplayer Quiz Backend Running"}


# -------------------------
# ROOM APIs
# -------------------------
@app.post("/create-room")
def create_room_api(data: CreateRoomRequest):
    return {"room_code": create_room(data.host_name)}


@app.post("/join-room")
def join_room_api(data: JoinRoomRequest):
    room = join_room(data.room_code, data.player_name)
    if not room:
        return {"error": "Room not found"}
    room["_id"] = str(room["_id"])
    return room


@app.get("/room/{room_code}")
def get_room_api(room_code: str):
    room = get_room(room_code)
    if not room:
        return {"error": "Room not found"}
    room["_id"] = str(room["_id"])
    return room


# -------------------------
# QUIZ GENERATION
# -------------------------
@app.post("/generate-quiz")
async def generate_quiz(
    room_code: str = Form(...),
    file: bytes = File(...),
    questions: int = Form(...),
    difficulty: str = Form(...),
    time_per_question: int = Form(10)
):
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

        if not text.strip():
            raise ValueError("PDF file is empty or has no text")

        quiz = generate_questions(text, questions, difficulty)

        if not quiz or len(quiz) == 0:
            # Fallback - should not reach here but just in case
            quiz = [
                {
                    "question": f"Sample question {i+1}: What is learning?",
                    "options": ["Knowledge", "Skill", "Experience", "All of above"],
                    "answer": "All of above"
                } for i in range(questions)
            ]

        # Store in database
        rooms_collection.update_one(
            {"room_code": room_code},
            {"$set": {
                "questions": quiz,
                "current_question": 0,
                "settings": {
                    "num_questions": len(quiz),
                    "difficulty": difficulty,
                    "time_per_question": time_per_question
                }
            }}
        )

        print(f"✅ Generated {len(quiz)} questions for room {room_code}")

        return {
            "questions": quiz,
            "generated": len(quiz),
            "requested": questions
        }

    except Exception as e:
        print(f"❌ Quiz generation failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Quiz generation error: {str(e)}"}
        )


# -------------------------
# QUIZ ENGINE (FIXED)
# -------------------------
async def run_quiz(room_code):

    room = get_room(room_code)
    if not room:
        print(f"❌ Room {room_code} not found")
        return

    questions = room.get("questions", [])
    
    if not questions or len(questions) == 0:
        print(f"❌ No questions found for room {room_code}. Cannot start quiz.")
        await broadcast(room_code, {
            "type": "error",
            "message": "No questions were generated. Please try again."
        })
        return
    
    time_per_q = room.get("settings", {}).get("time_per_question", 10)

    print(f"🎮 Starting quiz in room {room_code} with {len(questions)} questions")

    answered_players[room_code] = {}
    room["streak"] = {}
    room["first_correct"] = {}

    for i, q in enumerate(questions):

        room["current_question"] = i
        answered_players[room_code][i] = set()

        print(f"📝 Question {i+1}/{len(questions)}: {q.get('question', 'Unknown')[:50]}...")

        await broadcast(room_code, {
            "type": "question",
            "question": q,
            "question_number": i + 1,
            "total_questions": len(questions),
            "timer": time_per_q
        })

        await asyncio.sleep(time_per_q)

    # GAME OVER
    leaderboard = sorted(
        [{"name": p, "score": s} for p, s in room.get("scores", {}).items()],
        key=lambda x: x["score"], reverse=True
    )

    print(f"🏆 Quiz completed in room {room_code}. Leaderboard: {leaderboard}")

    # Save to database with complete info
    history_collection.insert_one({
        "room_code": room_code,
        "players": room.get("scores", {}),
        "leaderboard": leaderboard,
        "total_questions": len(questions),
        "difficulty": room.get("settings", {}).get("difficulty", "medium"),
        "time_per_question": room.get("settings", {}).get("time_per_question", 10),
        "created_at": datetime.utcnow()
    })

    # Update room with final scores
    rooms_collection.update_one(
        {"room_code": room_code},
        {"$set": {
            "scores": room.get("scores", {}),
            "completed_at": datetime.utcnow(),
            "status": "completed"
        }}
    )

    # Notify all players game is over
    await broadcast(room_code, {
        "type": "game_over",
        "scores": leaderboard
    })
    
    # Cleanup
    answered_players.pop(room_code, None)


# -------------------------
# WEBSOCKET
# -------------------------
@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):

    await websocket.accept()   # MUST be first

    token = websocket.query_params.get("token")
    user = verify_token(token)

    if not user:
        await websocket.close()
        return
    player_name = user["name"]


    room = get_room(room_code)
    if not room:
        await websocket.close()
        return

    connections.setdefault(room_code, {})
    connections[room_code][player_name] = websocket

    await broadcast(room_code, {
        "type": "players",
        "players": list(connections[room_code].keys()),
        "host": room["host"]
    })

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            # -------------------------
            # START QUIZ
            # -------------------------
            if event == "start_quiz":

                if player_name != room["host"]:
                    continue

                room["scores"] = {p: 0 for p in room["players"]}
                room["streak"] = {}
                room["first_correct"] = {}

                asyncio.create_task(run_quiz(room_code))

            # -------------------------
            # ANSWER
            # -------------------------

            elif event == "answer":
                room = get_room(room_code)

                q_index = room.get("current_question", 0)

                if room_code not in answered_players:
                    continue

                if player_name in answered_players[room_code].get(q_index, set()):
                    continue

                answered_players[room_code][q_index].add(player_name)

                answer = data.get("answer")
                time_taken = data.get("time_taken", 0)

                question = room["questions"][q_index]
                correct_answer = question["answer"]

                # ✅ SAFE INIT (IMPORTANT)
                room.setdefault("first_correct", {})
                room.setdefault("streak", {})
                room.setdefault("scores", {})

                is_first = False
                if q_index not in room["first_correct"]:
                    if answer == correct_answer:
                        room["first_correct"][q_index] = player_name
                        is_first = True

    # streak logic
                if answer == correct_answer:
                    room["streak"][player_name] = room["streak"].get(player_name, 0) + 1
                else:
                    room["streak"][player_name] = 0

                score = calculate_score(
        correct=(answer == correct_answer),
        time_taken=time_taken,
        is_fastest=is_first,
        streak=room["streak"].get(player_name, 0)
    )

                # ensure scores exist
                room.setdefault("scores", {})

# ensure player exists
                if player_name not in room["scores"]:
                    room["scores"][player_name] = 0

                room["scores"][player_name] += score
                rooms_collection.update_one(
                {"room_code": room_code},
                {"$set": {"scores": room["scores"]}}
)

                leaderboard = sorted(
        [{"name": p, "score": s} for p, s in room["scores"].items()],
        key=lambda x: x["score"], reverse=True
    )

                await broadcast(room_code, {
        "type": "leaderboard",
        "scores": leaderboard
    })

    except WebSocketDisconnect:
        print(f"[DISCONNECT] {player_name} left room {room_code}")
        connections.get(room_code, {}).pop(player_name, None)

        # Notify remaining players
        remaining_players = list(connections.get(room_code, {}).keys())
        if remaining_players:
            await broadcast(room_code, {
                "type": "players",
                "players": remaining_players,
                "host": room["host"]
            })

    except Exception as e:
        print(f"[ERROR] WebSocket error: {e}")
        connections.get(room_code, {}).pop(player_name, None)


# -------------------------
# AUTH APIs (RESTORED)
# -------------------------

@app.post("/signup")
def signup(data: SignupRequest = Body(...)):

    existing = users_collection.find_one({"email": data.email})

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt())

    users_collection.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hashed.decode(),
        "created_at": datetime.utcnow()
    })

    return {"message": "User created successfully"}


@app.post("/login")
def login(data: LoginRequest = Body(...)):

    user = users_collection.find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_token({
        "email": user["email"],
        "name": user["name"]
    })

    return {
        "token": token,
        "name": user["name"],
        "email": user["email"]
    }


# -------------------------
# USER STATS API
# -------------------------
@app.get("/user/stats")
def get_user_stats(token: str = None):
    """Get comprehensive user statistics from database"""

    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    user_data = verify_token(token)

    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    player_name = user_data.get("name")
    email = user_data.get("email")

    # Get user info from users collection
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all quiz history for this player
    games = list(history_collection.find(
        {"players": {player_name: {"$exists": True}}}
    ).sort("created_at", -1))

    # Calculate statistics
    quizzesPlayed = len(games)
    totalWins = 0
    totalPoints = 0
    allScores = []
    longestStreak = 0
    currentStreak = 0

    for game in games:
        players_scores = game.get("players", {})

        if player_name not in players_scores:
            continue

        score = players_scores[player_name]
        allScores.append(score)
        totalPoints += score

        # Find if this player is the winner
        if players_scores:
            max_score = max(players_scores.values())
            if score == max_score:
                totalWins += 1
                currentStreak += 1
            else:
                longestStreak = max(longestStreak, currentStreak)
                currentStreak = 0

    longestStreak = max(longestStreak, currentStreak)

    # Calculate derived stats
    winRate = int((totalWins / quizzesPlayed * 100) if quizzesPlayed > 0 else 0)
    averageScore = int(sum(allScores) / len(allScores) if allScores else 0)

    # Get user ranking (mock for now, should be calculated from all users)
    all_users_stats = []
    for u in users_collection.find():
        u_games = list(history_collection.find(
            {"players": {u["name"]: {"$exists": True}}}
        ))
        u_points = sum([g["players"].get(u["name"], 0) for g in u_games])
        all_users_stats.append({"name": u["name"], "points": u_points})

    all_users_stats.sort(key=lambda x: x["points"], reverse=True)
    ranking = next((i + 1 for i, u in enumerate(all_users_stats) if u["name"] == player_name), 999)

    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "quizzesPlayed": quizzesPlayed,
        "totalWins": totalWins,
        "winRate": winRate,
        "averageScore": averageScore,
        "longestStreak": longestStreak,
        "totalPoints": totalPoints,
        "ranking": ranking,
        "joinDate": user.get("created_at", datetime.utcnow()).strftime("%B %d, %Y") if "created_at" in user else "Recently",
        "recentGames": [
            {
                "date": g.get("created_at", datetime.utcnow()).strftime("%b %d, %Y"),
                "score": g["players"].get(player_name, 0),
                "opponents": len(g.get("players", {}))
            }
            for g in games[:5]
        ]
    }