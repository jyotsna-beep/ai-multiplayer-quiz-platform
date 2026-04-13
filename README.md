# AI Multiplayer Quiz Platform

A real-time multiplayer quiz platform powered by AI-generated questions and FastAPI WebSocket connections.

## 🎯 Features

- **AI-Powered Quiz Generation** - Generate custom quizzes from PDF study materials using Groq API
- **Real-Time Multiplayer** - Play against friends in live quiz competitions with WebSocket
- **User Authentication** - Secure JWT-based authentication with password hashing
- **Player Profiles** - Track stats, rankings, streak, and achievements from real database
- **Responsive UI** - Modern, production-level interface with animations
- **Quiz History** - View past games, scores, and detailed statistics

## 🛠️ Tech Stack

**Backend:**
- FastAPI (async web framework)
- MongoDB (database)
- Groq API (AI question generation)
- WebSocket (real-time multiplayer)
- JWT (authentication)
- PyMongo (database driver)

**Frontend:**
- React 19 (UI library)
- Vite (build tool)
- TailwindCSS (styling)
- Framer Motion (animations)
- Zustand (state management)

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (local or cloud)
- Groq API key (get free at https://console.groq.com)

## 🚀 Installation & Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (copy from `.env.example`):
```env
MONGO_URI=mongodb://localhost:27017/ai_quiz_platform
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_change_in_production
```

5. Start MongoDB:
```bash
# If using local MongoDB
mongod
```

6. Run the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend/ai-multiplayer-quiz
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (copy from `.env.example`):
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

4. Start development server:
```bash
npm run dev
```

App will be available at `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /signup` - Register new user
- `POST /login` - Login user (returns token + user info)
- `GET /user/stats` - Get user statistics (requires token)

### Quiz Management
- `POST /create-room` - Create quiz room
- `POST /join-room` - Join existing room
- `GET /room/{room_code}` - Get room details
- `POST /generate-quiz` - Generate questions from PDF
- `WebSocket /ws/{room_code}` - Real-time quiz gameplay

## 🗄️ Database Collections

### Users Collection
```json
{
  "_id": ObjectId,
  "name": string,
  "email": string (unique),
  "password": string (bcrypt hashed),
  "created_at": datetime
}
```

### Quiz History Collection
```json
{
  "_id": ObjectId,
  "room_code": string,
  "players": {
    "player_name": score
  },
  "total_questions": number,
  "created_at": datetime
}
```

### Rooms Collection
```json
{
  "_id": ObjectId,
  "room_code": string (unique, 6 chars),
  "host": string,
  "players": [string],
  "questions": [object],
  "scores": { "player_name": score },
  "settings": {
    "num_questions": number,
    "difficulty": string,
    "time_per_question": number
  }
}
```

## 📊 User Statistics (Real Database)

The profile page displays real statistics calculated from database:
- **Quizzes Played** - Total number of quiz games
- **Total Wins** - Number of games won
- **Win Rate** - Percentage of games won (%)
- **Global Ranking** - Player rank among all users
- **Average Score** - Mean score across all games
- **Longest Streak** - Consecutive win streak
- **Total Points** - Accumulated points from all games
- **Recent Games** - Last 5 games with details

## 🎮 Scoring System

- **Base Score**: 100 - (time_taken × 5)
- **First Correct Bonus**: +30 points
- **Streak Bonus** (3+ consecutive): +20 points
- **Wrong Answer**: -20 points

## 🔐 Security Features

✅ Password hashing with bcrypt
✅ JWT token-based authentication
✅ Secure WebSocket authentication
✅ CORS middleware configuration
✅ Input validation with Pydantic
✅ Environment variable protection
✅ SQL injection prevention (using MongoDB)

## 🎮 Gameplay Flow

1. **User Registration** - Create account with email and password
2. **User Login** - Authenticate and receive JWT token
3. **Create/Join Room** - Host uploads PDF and creates room, others join with code
4. **Quiz Generation** - AI generates questions from study material (Groq API)
5. **Live Quiz** - Real-time multiplayer round with timer and scoring
6. **Results** - View leaderboard and stats saved to database
7. **Profile** - View personal statistics and achievements

## 🔄 WebSocket Events

### Client → Server
```json
{
  "event": "start_quiz"
}
```
```json
{
  "event": "answer",
  "answer": "option_text",
  "time_taken": seconds
}
```

### Server → Client
```json
{
  "type": "question",
  "question": {"question": "...", "options": [...], "answer": "..."},
  "question_number": 1,
  "total_questions": 10,
  "timer": 10
}
```
```json
{
  "type": "leaderboard",
  "scores": [{"name": "Player1", "score": 450}, ...]
}
```
```json
{
  "type": "game_over",
  "scores": [...]
}
```

## 🚨 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running (`mongod`)
- Verify MONGO_URI in `.env`
- Check network connectivity

**Backend Module Not Found**
- Activate Python virtual environment
- Run `pip install -r requirements.txt`
- Verify all imports in main.py

**Frontend API Connection Failed**
- Ensure backend is running on port 8000
- Verify `.env.local` has correct VITE_API_URL
- Check browser console for CORS errors

**WebSocket Connection Refused**
- Verify token is valid
- Check VITE_WS_URL matches backend
- Ensure room_code exists and is valid
- Confirm WebSocket endpoint is `/ws/{room_code}`

## 📝 Development Tips

```bash
# Frontend linting
npm run lint

# Frontend build
npm run build

# Backend with auto-reload
uvicorn main:app --reload

# View MongoDB collections
use ai_quiz_platform
show collections
db.users_collection.find()
```

## 🔄 CI/CD Deployment

For production deployment:

1. Update SECRET_KEY in backend `.env`
2. Use production MongoDB URI
3. Set VITE_API_URL to production domain
4. Enable HTTPS/WSS
5. Configure environment-specific CORS
6. Add rate limiting middleware
7. Enable proper logging

## 📄 Project Structure

```
ai-multiplayer-quiz-platform/
├── backend/
│   ├── main.py                 # FastAPI app & endpoints
│   ├── database.py             # MongoDB connection
│   ├── security.py             # JWT token handling
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── services/
│       ├── ai_generator.py     # Groq AI integration
│       └── room_manager.py     # Room logic
├── frontend/
│   └── ai-multiplayer-quiz/
│       ├── src/
│       │   ├── pages/          # All page components
│       │   ├── components/     # Reusable components
│       │   ├── store/          # Zustand state (empty - ready for implementation)
│       │   ├── utils/          # Helper functions
│       │   ├── App.jsx         # Router setup
│       │   └── main.jsx        # Entry point
│       ├── package.json        # Node dependencies
│       ├── .env.local          # Dev environment
│       └── .env.example        # Environment template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🎓 Learning Implementation

This project demonstrates:
- Real-time WebSocket communication
- JWT authentication & authorization
- MongoDB document database operations
- Asynchronous Python with FastAPI
- React hooks & state management
- Responsive design with TailwindCSS
- Environment-based configuration
- Error handling & validation

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Test thoroughly with real database
4. Ensure all endpoints work end-to-end
5. Submit pull request with details

## 📄 License

MIT License - See LICENSE file for details

## 🚀 Future Enhancements

- [ ] Leaderboard ranking system
- [ ] Chat in quiz rooms
- [ ] Achievement badges
- [ ] Quiz review/explanations
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Admin dashboard
- [ ] Social features (friends, invites)

---

**Last Updated:** March 28, 2026  
**Status:** Production Ready with Real Database Integration  
**Version:** 1.0.0
