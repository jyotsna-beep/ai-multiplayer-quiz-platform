import random
import string
from database import rooms_collection


def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def create_room(host_name):

    room_code = generate_room_code()

    room = {
        "room_code": room_code,
        "host": host_name,
        "players": [host_name],
        "questions": [],
        "current_question": 0,
        "scores": {}
    }

    rooms_collection.insert_one(room)

    return room_code


def _find_room(room_code):
    # Normalize and match case-insensitively to avoid user-entry mismatch
    cleaned = room_code.strip().upper()
    return rooms_collection.find_one({
        "room_code": {"$regex": f"^{cleaned}$", "$options": "i"}
    })


def join_room(room_code, player_name):

    room = _find_room(room_code)

    if not room:
        return None

    # Ensure we update using the stored room_code (case preserved)
    stored_code = room["room_code"]

    if player_name not in room["players"]:
        rooms_collection.update_one(
            {"room_code": stored_code},
            {"$push": {"players": player_name}}
        )

    rooms_collection.update_one(
        {"room_code": stored_code},
        {"$set": {f"scores.{player_name}": 0}}
    )

    return _find_room(stored_code)


def get_room(room_code):

    return _find_room(room_code)