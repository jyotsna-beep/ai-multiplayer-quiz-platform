from pymongo import MongoClient

from dotenv import load_dotenv
import os
load_dotenv()
MONGO_URL =os.getenv("MONGO_URI")

client = MongoClient(MONGO_URL)

db = client["ai_quiz_platform"]

rooms_collection = db["rooms"]
users_collection = db["users"]
history_collection = db["quiz_history"]