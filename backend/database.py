from pymongo import MongoClient

MONGO_URL = "mongodb+srv://joshmallena_db_user:2tEmwvdmRLo2sOxx@quiz-cluster.kk8gxef.mongodb.net/?appName=quiz-cluster"

client = MongoClient(MONGO_URL)

db = client["ai_quiz_platform"]

rooms_collection = db["rooms"]
users_collection = db["users"]
history_collection = db["quiz_history"]