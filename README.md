# SpeakAce - AI-Powered Public Speaking Training Platform

SpeakAce is a gamified AI-driven platform designed to help individuals improve public speaking skills through interactive games, real-time speech analysis, and personalized AI feedback.

---

## 🚀 Features
- 🎮 **3 Interactive Games**: Rapid Fire Analogies, The Conductor, Triple Step Integration
- 🧠 **AI-Powered Feedback**: Clarity, energy modulation, coherence
- 📊 **Progress Tracking**: Track stats, achievements, and improvement trends
- 🔒 **Secure Authentication**: JWT-based sessions, bcrypt password hashing
- ⚡ **Modern Tech Stack**: React + Vite frontend, Node.js + Express backend, MongoDB database

---

## 🛠️ Tech Stack

### **Frontend**
- React 18 + TypeScript
- Vite (build tool)
- Shadcn UI + Tailwind CSS
- React Query + Context API (state management)
- React Router v6 (routing)
- Custom Speech Recognition Hook (`useSpeechRecognition`)

### **Backend**
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT Authentication + bcryptjs
- AI Integration: Google Gemini API
- Socket.IO (real-time, planned)
- Winston Logger
- Helmet + CORS + Rate Limiting (security)

### **Database**
- **Collections**:
  - `Users` → Profile, achievements, stats
  - `GameSessions` → Performance data, timestamps
  - `Analytics` → Aggregated performance metrics

---

## 📂 Project Structure
```
frontend → React UI, games, dashboard
backend → Express API, AI integration, database
```

---

## ⚙️ Installation & Running Locally

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/speakace.git
cd speakace
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Configure Environment Variables
Create `.env` in backend folder:
```env
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-secret
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run Development Servers
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

### 5. Access the App
- Frontend → http://localhost:5173
- Backend API → http://localhost:5000

---

## 🎮 Game Design

### 1. Rapid Fire Analogies
**Objective**: Train quick thinking & creativity.
**Gameplay**: User is given a word → must generate analogy within 10 sec.

**Scoring**:
- Creativity = 50%
- Relevance = 30%
- Delivery speed = 20%

**AI Feedback**: Coherence, vocabulary range, fluency.

### 2. The Conductor
**Objective**: Improve energy modulation & vocal tone.
**Gameplay**: User must speak with varying intonation guided by AI.

**Scoring**:
- Energy variation = 40%
- Vocal clarity = 40%
- Confidence = 20%

**AI Feedback**: Monotony detection, enthusiasm scoring.

### 3. Triple Step Integration
**Objective**: Build structured communication.

**Gameplay**:
- Step 1 → Intro (30 sec)
- Step 2 → Body (60 sec)
- Step 3 → Conclusion (30 sec)

**Scoring**:
- Structure = 50%
- Coherence = 30%
- Timing = 20%

**AI Feedback**: Logical flow, clarity of transitions.

---

## 📊 Example User Flow
1. **Register/Login** → Secure session with JWT
2. **Choose Game** → Session created
3. **Play Game** → Speech recorded & analyzed
4. **AI Feedback** → Real-time performance insights
5. **Results Stored** → Stats updated in MongoDB
6. **Dashboard** → Track progress & achievements

---

## 🏗️ Architecture Overview

### High-Level System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Express)     │◄──►│   (MongoDB)     │
│ • Game UI       │    │ • API Routes    │    │ • Users         │
│ • Speech Rec    │    │ • AI Services   │    │ • Sessions      │
│ • State Mgmt    │    │ • Auth          │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 Deployment Guide

### Backend Deployment (Node.js + MongoDB)
1. Provision a server (e.g., AWS EC2, DigitalOcean, Render)
2. Install Node.js and MongoDB (or use MongoDB Atlas)
3. Configure `.env`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run with:
   ```bash
   npm run start
   ```
6. (Optional) Use PM2 for process management

### Frontend Deployment (React + Vite)
1. Build static assets:
   ```bash
   npm run build
   ```
2. Serve with:
   - Vercel (recommended)
   - Netlify
   - Static hosting (Nginx/Apache)

### Docker Deployment
1. Build images:
   ```bash
   docker-compose build
   ```
2. Run containers:
   ```bash
   docker-compose up -d
   ```

---

## 🔐 Security
- JWT tokens for session management
- Bcrypt password hashing
- Helmet + CORS + Rate limiting
- Environment variables for sensitive keys

---

## ⚡ Performance & Scalability
- Client-side caching with React Query
- Indexed queries in MongoDB
- Compression middleware
```

This formatted version includes proper markdown syntax with code blocks, consistent spacing, and clear section divisions. You can copy and paste this directly into your README.md or documentation file.
