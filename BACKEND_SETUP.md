# 🚀 Backend Setup & Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Syntax Error in main.py** 
**Problem:** Duplicate/leftover lines in `run_quiz()` function
```python
# BEFORE (BROKEN):
    await broadcast(room_code, {
        "type": "game_over",
        "scores": leaderboard
    })
    
    answered_players.pop(room_code, None)
        "scores": leaderboard  # ❌ DUPLICATE & INCOMPLETE
    })
```

**Fix Applied:** ✅ Removed duplicate lines

---

## 🔧 Backend Setup Instructions

### Step 1: Create Virtual Environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Create `.env` File
```bash
# Create file: backend/.env
MONGO_URI=mongodb://localhost:27017/ai_quiz_platform
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_change_in_production
```

### Step 4: Ensure MongoDB is Running
```bash
# Windows - If MongoDB installed as service
# It should auto-start
# Or manually:
mongod

# Or use MongoDB Atlas (cloud):
# Just update MONGO_URI in .env
```

### Step 5: Start Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

---

## 🐛 Common Issues & Solutions

### Issue 1: `ModuleNotFoundError: No module named 'fastapi'`
**Solution:** Install requirements
```bash
pip install -r requirements.txt
```

### Issue 2: `ModuleNotFoundError: No module named 'pymongo'`
**Solution:** Install MongoDB driver
```bash
pip install pymongo
```

### Issue 3: `Connection refused - Can't connect to MongoDB`
**Solution:** 
- Check MongoDB is running: `mongod`
- Or use MongoDB Atlas (cloud version)
- Update MONGO_URI in `.env` if needed

### Issue 4: `connection refused - Groq API Key`
**Solution:**
- Go to https://console.groq.com
- Create API key
- Add to `.env`: `GROQ_API_KEY=your_key`
- Restart server

### Issue 5: Port 8000 already in use
**Solution:** Use different port
```bash
uvicorn main:app --reload --port 8001
```

### Issue 6: CORS errors from frontend
**Solution:** Already fixed in main.py - CORS is enabled for all origins

### Issue 7: WebSocket connection refused
**Solution:**
- Make sure backend is running
- Check VITE_WS_URL in frontend `.env.local`
- Should be `ws://localhost:8000` (not https)

---

## 📊 Database Setup

### Create Indexes (Optional but Recommended)
```bash
# Open MongoDB shell
mongosh

# Select database
use ai_quiz_platform

# Create indexes for better performance
db.users_collection.createIndex({ "email": 1 }, { unique: true })
db.rooms_collection.createIndex({ "room_code": 1 }, { unique: true })
db.quiz_history.createIndex({ "created_at": 1 })
```

### Check Database Collections
```bash
# In MongoDB shell
show collections
db.users_collection.countDocuments()
db.quiz_history.find().pretty()
```

---

## 🧪 Test API Endpoints

### 1. Health Check
```bash
curl http://localhost:8000/
# Expected: {"message": "AI Multiplayer Quiz Backend Running"}
```

### 2. Sign Up
```bash
curl -X POST http://localhost:8000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
# Expected: token, name, email
```

### 4. Get User Stats
```bash
curl "http://localhost:8000/user/stats?token=YOUR_TOKEN_HERE"
# Expected: user stats from database
```

---

## 📝 API Documentation

### Auto-Generated Docs
Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints Available
```
POST   /signup              - Register user
POST   /login               - Login user
GET    /user/stats          - Get user statistics
POST   /create-room         - Create quiz room
POST   /join-room           - Join quiz room
GET    /room/{room_code}    - Get room info
POST   /generate-quiz       - Generate questions (PDF upload)
WS     /ws/{room_code}      - WebSocket for live quiz
```

---

## 🔍 Enable Debug Logging

### Add to main.py (optional):
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Then use:
logger.debug("Message")
logger.warning("Warning")
logger.error("Error")
```

---

## 📦 Requirements.txt Contents

All required packages:
- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **pymongo** - MongoDB driver
- **python-jose** - JWT tokens
- **pydantic** - Data validation
- **pdfplumber** - PDF parsing
- **groq** - AI API
- **bcrypt** - Password hashing
- **python-dotenv** - Environment variables

---

## ✅ Verification Checklist

- [ ] Virtual environment activated (`venv\Scripts\activate`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with valid keys
- [ ] MongoDB running (`mongod` or cloud version)
- [ ] Backend server started (`uvicorn main:app --reload`)
- [ ] Can access http://localhost:8000
- [ ] Swagger docs work: http://localhost:8000/docs
- [ ] Frontend connected to backend (check Network tab)

---

## 🚀 Advanced Troubleshooting

### Clear Database (DESTRUCTIVE!)
```bash
# In MongoDB shell
use ai_quiz_platform
db.dropDatabase()
```

### Check All Services Running
```bash
# Backend
netstat -an | findstr 8000

# MongoDB
netstat -an | findstr 27017
```

### View Live Logs
```bash
# Uvicorn logs with colors:
uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
```

---

## 📞 Support

**Issue:** Still having problems?

1. Check error message in terminal
2. Look for `[ERROR]` or `[DISCONNECT]` logs
3. Verify all services running (MongoDB, Backend)
4. Check `.env` variables are set
5. Try clearing browser cache + cookies
6. Restart backend with `--reload` flag

---

**Last Updated:** March 28, 2026  
**Status:** ✅ All syntax errors resolved  
**Backend Ready for Testing:** YES
