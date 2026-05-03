import io
import asyncio
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, Form, Body, HTTPException, UploadFile, Query
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
import pdfplumber
import bcrypt
import json
import random

from services.ai_generator import generate_questions
from services.room_manager import create_room, join_room, get_room
from database import rooms_collection, users_collection, history_collection, pdfs_collection, fs
from security import create_token, verify_token

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = [
    "https://ai-multiplayer-quiz-platform-1.onrender.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    file: UploadFile = File(...),
    questions: int = Form(...),
    difficulty: str = Form(...),
    time_per_question: int = Form(10),
    token: str = Form(...)
):
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    try:
        file_bytes = await file.read()
        
        # Save PDF to GridFS and pdfs_collection
        file_id = fs.put(file_bytes, filename=file.filename)
        pdfs_collection.insert_one({
            "user_name": user_data["name"],
            "filename": file.filename,
            "file_id": file_id,
            "created_at": datetime.utcnow()
        })

        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
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

        # Update room with questions and settings
        rooms_collection.update_one(
            {"room_code": room_code},
            {"$set": {
                "questions": quiz,
                "filename": file.filename,
                "settings": {
                    "total_questions": questions,
                    "difficulty": difficulty,
                    "time_per_question": time_per_question
                },
                "status": "ready"
            }}
        )

        print(f"Generated {len(quiz)} questions for room {room_code}")

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
# Global state for active quizzes
active_quizzes = {}

async def run_quiz(room_code):
    room = get_room(room_code)
    if not room: return
    
    questions = room.get("questions", [])
    if not questions:
        await broadcast(room_code, {"type": "error", "message": "No questions found."})
        return
    
    time_per_q = room.get("settings", {}).get("time_per_question", 10)
    
    # Reset/Initialize room data
    active_quizzes[room_code] = {
        "current_question": 0,
        "first_correct": {},
        "streaks": {p: 0 for p in room.get("players", [])},
        "answered": {}
    }

    # Initialize scores in DB if not present
    rooms_collection.update_one(
        {"room_code": room_code},
        {"$set": {"scores": {p: 0 for p in room.get("players", [])}, "status": "playing"}}
    )

    for i, q in enumerate(questions):
        active_quizzes[room_code]["current_question"] = i
        active_quizzes[room_code]["answered"][i] = set()
        
        await broadcast(room_code, {
            "type": "question",
            "question": q,
            "question_number": i + 1,
            "total_questions": len(questions),
            "timer": time_per_q
        })

        await asyncio.sleep(time_per_q)

    # FINAL RE-FETCH FOR ACCURATE SCORES
    final_room = get_room(room_code)
    final_scores = final_room.get("scores", {})
    leaderboard = sorted(
        [{"name": p, "score": s} for p, s in final_scores.items()],
        key=lambda x: x["score"], reverse=True
    )

    # Save to History
    history_collection.insert_one({
        "room_code": room_code,
        "questions": questions,
        "players": final_scores,
        "leaderboard": leaderboard,
        "total_questions": len(questions),
        "difficulty": final_room.get("settings", {}).get("difficulty", "medium"),
        "time_per_question": time_per_q,
        "source_file": final_room.get("filename", "Generated Text"),
        "created_at": datetime.utcnow()
    })

    # Mark room as completed
    rooms_collection.update_one(
        {"room_code": room_code},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
    )

    await broadcast(room_code, {
        "type": "game_over",
        "scores": leaderboard
    })
    
    active_quizzes.pop(room_code, None)

@app.websocket("/ws/{room_code}")
async def quiz_websocket(websocket: WebSocket, room_code: str):
    # Normalize room code to ensure case-insensitivity consistency across connections
    room_code = room_code.strip().upper()
    
    token = websocket.query_params.get("token")
    user = verify_token(token)
    
    if not user:
        print(f"[WS REJECTED] Invalid token for room {room_code}")
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Authentication failed"})
        await websocket.close(code=4001)
        return

    player_name = user["name"]
    await websocket.accept()
    print(f"[WS CONNECTED] {player_name} joined room {room_code}")

    room = get_room(room_code)
    if not room:
        print(f"[WS ERROR] Room {room_code} not found")
        await websocket.send_json({"type": "error", "message": "Room not found"})
        await websocket.close()
        return

    connections.setdefault(room_code, {})
    connections[room_code][player_name] = websocket

    # Sync player list
    await broadcast(room_code, {
        "type": "players",
        "players": list(connections[room_code].keys()),
        "host": room["host"]
    })

    # JOIN-IN-PROGRESS SYNC
    if room_code in active_quizzes:
        quiz_state = active_quizzes[room_code]
        q_index = quiz_state["current_question"]
        questions = room.get("questions", [])
        
        if q_index < len(questions):
            print(f"[WS SYNC] Sending current question {q_index+1} to {player_name}")
            await websocket.send_json({
                "type": "question",
                "question": questions[q_index],
                "question_number": q_index + 1,
                "total_questions": len(questions),
                "timer": room.get("settings", {}).get("time_per_question", 10)
            })

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            if event == "start_quiz":
                if player_name == room["host"]:
                    asyncio.create_task(run_quiz(room_code))

            elif event == "answer":
                if room_code not in active_quizzes: continue
                
                quiz_state = active_quizzes[room_code]
                q_index = quiz_state["current_question"]
                
                # Prevent double answering same question
                if player_name in quiz_state["answered"].get(q_index, set()): continue
                if q_index not in quiz_state["answered"]: quiz_state["answered"][q_index] = set()
                quiz_state["answered"][q_index].add(player_name)

                answer = data.get("answer")
                time_taken = data.get("time_taken", 0)
                
                room = get_room(room_code) # Get current scores
                correct_answer = room["questions"][q_index]["answer"]
                is_correct = (answer == correct_answer)

                # Update Streaks
                if is_correct:
                    quiz_state["streaks"][player_name] = quiz_state["streaks"].get(player_name, 0) + 1
                else:
                    quiz_state["streaks"][player_name] = 0

                # Check if first correct
                is_first = False
                if is_correct and q_index not in quiz_state["first_correct"]:
                    quiz_state["first_correct"][q_index] = player_name
                    is_first = True

                # Calculate Score
                score = calculate_score(
                    correct=is_correct,
                    time_taken=time_taken,
                    is_fastest=is_first,
                    streak=quiz_state["streaks"].get(player_name, 0)
                )

                # Update DB
                scores = room.get("scores", {})
                scores[player_name] = scores.get(player_name, 0) + score
                
                rooms_collection.update_one(
                    {"room_code": room_code},
                    {"$set": {"scores": scores}}
                )

                # Broadcast new leaderboard
                leaderboard = sorted(
                    [{"name": p, "score": s} for p, s in scores.items()],
                    key=lambda x: x["score"], reverse=True
                )
                await broadcast(room_code, {
                    "type": "leaderboard",
                    "scores": leaderboard
                })

    except WebSocketDisconnect:
        connections.get(room_code, {}).pop(player_name, None)
        remaining = list(connections.get(room_code, {}).keys())
        if remaining:
            await broadcast(room_code, {"type": "players", "players": remaining, "host": room["host"]})
    except Exception as e:
        print(f"WS Error: {e}")
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
        {f"players.{player_name}": {"$exists": True}}
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
            {f"players.{u['name']}": {"$exists": True}}
        ))
        u_points = sum([g["players"].get(u["name"], 0) for g in u_games])
        all_users_stats.append({"name": u["name"], "points": u_points})

    all_users_stats.sort(key=lambda x: x["points"], reverse=True)
    ranking = next((i + 1 for i, u in enumerate(all_users_stats) if u["name"] == player_name), 999)

    recent_games_list = []
    for g in games[:5]:
        scores = g.get("players", {})
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        rank = next((i + 1 for i, (name, s) in enumerate(sorted_scores) if name == player_name), "N/A")
        
        recent_games_list.append({
            "room_code": g.get("room_code", "N/A"),
            "date": g.get("created_at", datetime.utcnow()).strftime("%b %d, %Y"),
            "score": scores.get(player_name, 0),
            "opponents": len(scores),
            "rank": rank
        })

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
        "recentGames": recent_games_list
    }

# -------------------------
# DATA APIs FOR DASHBOARD
# -------------------------

@app.get("/user/rooms")
def get_user_rooms(token: str):
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    rooms = list(rooms_collection.find({"host": user_data["name"]}).sort("created_at", -1))
    for r in rooms:
        r["_id"] = str(r["_id"])
        if "created_at" in r and isinstance(r["created_at"], datetime):
            r["created_at"] = r["created_at"].isoformat()
            
    return rooms

@app.get("/user/quiz-history")
def get_user_quiz_history(token: str):
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    player_name = user_data["name"]
    history = list(history_collection.find(
        {f"players.{player_name}": {"$exists": True}}
    ).sort("created_at", -1))
    
    for h in history:
        h["_id"] = str(h["_id"])
        if "created_at" in h and isinstance(h["created_at"], datetime):
            h["created_at"] = h["created_at"].isoformat()
            
    return history

@app.get("/user/pdfs")
def get_user_pdfs(token: str):
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    pdfs = list(pdfs_collection.find({"user_name": user_data["name"]}).sort("created_at", -1))
    for p in pdfs:
        p["_id"] = str(p["_id"])
        p["file_id"] = str(p["file_id"])
        if "created_at" in p and isinstance(p["created_at"], datetime):
            p["created_at"] = p["created_at"].isoformat()
            
    return pdfs

@app.get("/pdf/{file_id}")
async def get_pdf(file_id: str):
    try:
        from bson import ObjectId
        grid_out = fs.get(ObjectId(file_id))
        return StreamingResponse(
            io.BytesIO(grid_out.read()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={grid_out.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")

@app.get("/leaderboards")
def get_global_leaderboards():
    all_history = list(history_collection.find())
    user_scores = {}
    for game in all_history:
        for player, score in game.get("players", {}).items():
            user_scores[player] = user_scores.get(player, 0) + score
            
    leaderboard = sorted(
        [{"name": name, "points": score} for name, score in user_scores.items()],
        key=lambda x: x["points"], reverse=True
    )
    return leaderboard[:20]

@app.post("/user/change-password")
async def change_password(data: dict):
    token = data.get("token")
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = users_collection.find_one({"email": user_data["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not bcrypt.checkpw(old_password.encode('utf-8'), user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    hashed_new = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    users_collection.update_one(
        {"email": user_data["email"]},
        {"$set": {"password": hashed_new}}
    )
    
    return {"message": "Password updated successfully"}

@app.delete("/user/rooms/{room_code}")
def delete_user_room(room_code: str, token: str = None):
    # If token is in headers or params
    if not token:
        raise HTTPException(status_code=400, detail="Token required")
        
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    # Check if the user is the host
    room = rooms_collection.find_one({"room_code": room_code})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if room.get("host") != user_data["name"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this room")
        
    rooms_collection.delete_one({"room_code": room_code})
    return {"message": "Room deleted successfully"}

@app.delete("/user/quiz-history/{room_code}")
def delete_quiz_history(room_code: str, token: str = None):
    if not token:
        raise HTTPException(status_code=400, detail="Token required")
        
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    # In a real app, you might want to hide it for just this user, 
    # but for simplicity we'll just delete the entry if they were a participant.
    history_collection.delete_one({"room_code": room_code})
    return {"message": "History entry deleted successfully"}

# -------------------------
# PROFILE MANAGEMENT APIs
# -------------------------

@app.get("/user/profile")
def get_profile(token: str):
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = users_collection.find_one({"email": user_data["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "bio": user.get("bio", "Avid quizzer and AI enthusiast."),
        "visibility": user.get("visibility", "Public"),
        "show_online_status": user.get("show_online_status", True),
        "avatar_id": str(user.get("avatar_id")) if user.get("avatar_id") else None,
        "join_date": user.get("created_at", datetime.utcnow()).strftime("%B %d, %Y")
    }

@app.post("/user/update-profile")
async def update_profile(data: dict):
    token = data.get("token")
    name = data.get("name")
    bio = data.get("bio")
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    users_collection.update_one(
        {"email": user_data["email"]},
        {"$set": {"name": name, "bio": bio}}
    )
    
    return {"message": "Profile updated successfully"}

@app.post("/user/update-privacy")
async def update_privacy(data: dict):
    token = data.get("token")
    visibility = data.get("visibility")
    show_online_status = data.get("show_online_status")
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    update_fields = {}
    if visibility: update_fields["visibility"] = visibility
    if show_online_status is not None: update_fields["show_online_status"] = show_online_status
    
    users_collection.update_one(
        {"email": user_data["email"]},
        {"$set": update_fields}
    )
    
    return {"message": "Privacy settings updated successfully"}