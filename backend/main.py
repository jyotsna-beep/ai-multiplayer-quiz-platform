import traceback

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import pdfplumber

from services.ai_generator import generate_questions
from services.room_manager import create_room, join_room, get_room
from database import rooms_collection
from database import users_collection
from fastapi import HTTPException
import bcrypt
from security import create_token
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connections = {}

class CreateRoomRequest(BaseModel):
    host_name: str

class JoinRoomRequest(BaseModel):
    room_code: str
    player_name: str


@app.get("/")
def home():
    return {"message": "AI Multiplayer Quiz Backend Running"}


# -------------------------
# ROOM APIs
# -------------------------

@app.post("/create-room")
def create_room_api(data: CreateRoomRequest):

    room_code = create_room(data.host_name)

    return {"room_code": room_code}


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
# AI QUIZ GENERATION
# -------------------------

@app.post("/generate-quiz")
async def generate_quiz(
    room_code: str = Form(...),
    file: bytes = File(...),
    questions: int = Form(...),
    difficulty: str = Form(...)
):

    try:
        # Parse PDF from uploaded bytes
        import io

        text = ""
        with pdfplumber.open(io.BytesIO(file)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

        quiz = generate_questions(text, questions, difficulty)

        rooms_collection.update_one(
            {"room_code": room_code},
            {
                "$set": {
                    "questions": quiz,
                    "current_question": 0
                }
            }
        )

        return {"questions": quiz}

    except Exception as e:
        # Ensure we return JSON so browser can parse CORS headers correctly
        print("[ERROR] generate_quiz failed:", e, flush=True)
        return JSONResponse(status_code=500, content={"detail": str(e)})

# -------------------------
# WEBSOCKET
# -------------------------
@app.websocket("/ws/{room_code}/{player_name}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, player_name: str):

    print(f"[WS] connection attempt: room={room_code} player={player_name}")

    await websocket.accept()

    room = get_room(room_code)

    if not room:
        print(f"[WS] room not found: {room_code}")
        await websocket.close()
        return

    if room_code not in connections:
        connections[room_code] = []

    connections[room_code].append(websocket)

    # Send current players to all connections
    for connection in connections[room_code]:
        await connection.send_json({
            "type": "players",
            "players": room["players"]
        })

    try:

        while True:

            data = await websocket.receive_json()

            event = data.get("event")


            # START QUIZ
            if event == "start_quiz":

                question = room["questions"][0]

                room["current_question"] = 0

                room["scores"] = {}

                for player in room["players"]:
                    room["scores"][player] = 0

                for connection in connections[room_code]:
                    await connection.send_json({
                        "type":"start_quiz",
                        "question":question
                    })


            # PLAYER ANSWER
            if event == "answer":

                answer = data.get("answer")

                question = room["questions"][room["current_question"]]

                correct = question["answer"]

                if answer == correct:
                    room["scores"][player_name] += 100


                # UPDATE LEADERBOARD

                leaderboard = []

                for player,score in room["scores"].items():

                    leaderboard.append({
                        "name":player,
                        "score":score
                    })


                leaderboard.sort(key=lambda x:x["score"], reverse=True)


                for connection in connections[room_code]:
                    await connection.send_json({
                        "type":"leaderboard",
                        "scores":leaderboard
                    })


                # MOVE TO NEXT QUESTION

                room["current_question"] += 1


                if room["current_question"] < len(room["questions"]):

                    next_question = room["questions"][room["current_question"]]

                    for connection in connections[room_code]:
                        await connection.send_json({
                            "type":"question",
                            "question":next_question
                        })

                else:

                    for connection in connections[room_code]:
                        await connection.send_json({
                            "type":"game_over",
                            "scores":leaderboard
                        })


    except WebSocketDisconnect:

        connections[room_code].remove(websocket)

        if room and player_name in room["players"]:
            room["players"].remove(player_name)

            # Send updated players to remaining connections
            for connection in connections[room_code]:
                await connection.send_json({
                    "type": "players",
                    "players": room["players"]
                })


from fastapi import Body

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.post("/signup")
def signup(data: SignupRequest = Body(...)):

    existing = users_collection.find_one({"email": data.email})

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

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