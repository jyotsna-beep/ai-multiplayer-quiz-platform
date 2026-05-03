# AI Multiplayer Quiz Platform

A real-time multiplayer quiz game where players compete using AI-generated questions from PDF documents. Built for students and teams looking to make learning interactive and fun.

---

## Tech Stack

**Frontend:** React 19, Vite, TailwindCSS, Zustand, Framer Motion  
**Backend:** FastAPI, Python, WebSocket, JWT Authentication  
**Database:** MongoDB  
**AI:** Groq API for question generation

---

## Features

- Real-time multiplayer quiz competitions with WebSocket
- AI-powered question generation from PDF study materials
- User authentication with secure JWT tokens
- Player profiles with stats, win history, and rankings
- Leaderboards and achievement system
- Quiz history and performance analytics

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- Groq API key ([get free here](https://console.groq.com))

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ai-multiplayer-quiz.git
cd ai-multiplayer-quiz-platform
```

#### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/ai_quiz_platform
GROQ_API_KEY=YOUR_GROQ_API_KEY
SECRET_KEY=YOUR_SECRET_KEY
ALGORITHM=HS256
```

Start the backend:
```bash
uvicorn main:app --reload
```
Backend runs at `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd ../frontend/ai-multiplayer-quiz
npm install
```

Create `frontend/ai-multiplayer-quiz/.env.local`:
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Start the frontend:
```bash
npm run dev
```
Frontend runs at `http://localhost:5173`

#### 4. Start MongoDB

```bash
mongod  # Local MongoDB
```

Or use MongoDB Atlas (cloud) and update `MONGO_URI` in `.env`.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/ai_quiz_platform` |
| `GROQ_API_KEY` | Groq AI API key | `gsk_*****` |
| `SECRET_KEY` | JWT secret key for authentication | Any random string |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `VITE_API_URL` | Backend API URL (frontend) | `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket URL (frontend) | `ws://localhost:8000` |

---

## Deployment

This project is deployed on [Render](https://render.com).

**Live Demo:** [Open App](https://ai-multiplayer-quiz-platform-1.onrender.com)

To deploy your own version:
1. Push code to GitHub
2. Create a Render Web Service connected to your repo
3. Set environment variables in Render dashboard
4. Deploy

---

## Folder Structure

```
ai-multiplayer-quiz-platform/
├── backend/
│   ├── main.py              # FastAPI server & routes
│   ├── database.py          # MongoDB connection
│   ├── security.py          # JWT authentication
│   ├── requirements.txt     # Python dependencies
│   ├── services/            # Business logic
│   │   ├── ai_generator.py
│   │   └── room_manager.py
│   └── .env                 # Environment variables
│
├── frontend/
│   └── ai-multiplayer-quiz/
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── pages/       # Page components
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── package.json
│       ├── vite.config.js
│       └── .env.local       # Environment variables
│
└── README.md
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Ensure `mongod` is running or use MongoDB Atlas |
| Port 8000 in use | Use `uvicorn main:app --reload --port 8001` |
| Missing dependencies | Backend: `pip install -r requirements.txt` / Frontend: `npm install` |
| Groq API error | Verify API key in `.env` is correct |

---

