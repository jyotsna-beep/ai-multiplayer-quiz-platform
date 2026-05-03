import gridfs
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
db = client["ai_quiz_platform"]
fs = gridfs.GridFS(db)

rooms_collection = db["rooms"]
users_collection = db["users"]
history_collection = db["quiz_history"]
pdfs_collection = db["pdfs"]