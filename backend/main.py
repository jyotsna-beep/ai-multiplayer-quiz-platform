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
# HELPERS
# -------------------------
async def broadcast(room_code, message):
    if room_code in connections:
        for ws in connections[room_code].values():
            await ws.send_json(message)


def calculate_score(correct, time_taken, is_fastest, streak):
    if not correct:
        return -20

    base = max(0, int(100 - time_taken * 5))

    bonus = 0
    if is_fastest:
        bonus += 20
    if streak >= 3:
        bonus += 10

    return base + bonus


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

        quiz = generate_questions(text, questions, difficulty)

        rooms_collection.update_one(
            {"room_code": room_code},
            {"$set": {
                "questions": quiz,
                "current_question": 0,
                "settings": {
                    "num_questions": questions,
                    "difficulty": difficulty,
                    "time_per_question": time_per_question
                }
            }}
        )

        return {"questions": quiz}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


# -------------------------
# QUIZ TIMER ENGINE
# -------------------------
async def run_quiz(room_code):

    room = get_room(room_code)
    if not room:
        return

    questions = room["questions"]
    time_per_q = room.get("settings", {}).get("time_per_question", 10)

    answered_players[room_code] = {}
    room["streak"] = {}
    room["first_correct"] = {}

    for i, q in enumerate(questions):

        room["current_question"] = i
        answered_players[room_code][i] = set()

        await broadcast(room_code, {
            "type": "question",
            "question": q,
            "question_number": i + 1,
            "total_questions": len(questions),
            "timer": time_per_q
        })

        await asyncio.sleep(time_per_q)

        # handle no answer
        for player in room["players"]:
            if player not in answered_players[room_code][i]:
                room["scores"][player] += 0

    leaderboard = sorted(
        [{"name": p, "score": s} for p, s in room["scores"].items()],
        key=lambda x: x["score"], reverse=True
    )

    # save history
    history_collection.insert_one({
        "room_code": room_code,
        "players": room["scores"],
        "total_questions": len(questions),
        "created_at": datetime.utcnow()
    })

    await broadcast(room_code, {
        "type": "game_over",
        "scores": leaderboard
    })


# -------------------------
# WEBSOCKET (SECURED)
# -------------------------
@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):

    token = websocket.query_params.get("token")
    user = verify_token(token)

    if not user:
        await websocket.close()
        return

    player_name = user["name"]

    await websocket.accept()

    room = get_room(room_code)
    if not room:
        await websocket.close()
        return

    connections.setdefault(room_code, {})
    connections[room_code][player_name] = websocket

    await broadcast(room_code, {
        "type": "players",
        "players": list(connections[room_code].keys())
    })

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            if event == "start_quiz":

                if player_name != room["host"]:
                    continue

                room["scores"] = {p: 0 for p in room["players"]}
                asyncio.create_task(run_quiz(room_code))

            elif event == "answer":

                q_index = room["current_question"]

                if player_name in answered_players[room_code].get(q_index, set()):
                    continue

                answered_players[room_code][q_index].add(player_name)

                answer = data.get("answer")
                time_taken = data.get("time_taken", 0)

                question = room["questions"][q_index]
                correct_answer = question["answer"]

                is_first = False
                if q_index not in room["first_correct"]:
                    if answer == correct_answer:
                        room["first_correct"][q_index] = player_name
                        is_first = True

                # streak update
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

                room["scores"][player_name] += score

                leaderboard = sorted(
                    [{"name": p, "score": s} for p, s in room["scores"].items()],
                    key=lambda x: x["score"], reverse=True
                )

                await broadcast(room_code, {
                    "type": "leaderboard",
                    "scores": leaderboard
                })

            elif event == "end_quiz":

                if player_name != room["host"]:
                    continue

                leaderboard = sorted(
                    [{"name": p, "score": s} for p, s in room["scores"].items()],
                    key=lambda x: x["score"], reverse=True
                )

                await broadcast(room_code, {
                    "type": "game_over",
                    "scores": leaderboard
                })

    except WebSocketDisconnect:
        connections[room_code].pop(player_name, None)

        await broadcast(room_code, {
            "type": "players",
            "players": list(connections.get(room_code, {}).keys())
        })


# -------------------------
# HISTORY API
# -------------------------
@app.get("/history/{user_name}")
def get_history(user_name: str):

    history = list(history_collection.find())

    result = []
    for h in history:
        if user_name in h["players"]:
            result.append({
                "room_code": h["room_code"],
                "score": h["players"][user_name],
                "date": h["created_at"]
            })

    return result


# -------------------------
# AUTH
# -------------------------
@app.post("/signup")
def signup(data: SignupRequest = Body(...)):

    if users_collection.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="User exists")

    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt())

    users_collection.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hashed.decode()
    })

    return {"message": "User created"}


@app.post("/login")
def login(data: LoginRequest = Body(...)):

    user = users_collection.find_one({"email": data.email})

    if not user or not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_token({
        "email": user["email"],
        "name": user["name"]
    })

    return {
        "token": token,
        "name": user["name"]
    }