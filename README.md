# 🎬 CineMatch: AI-Powered Movie & TV Discovery

CineMatch is a modern, full-stack web application designed for movie and TV show enthusiasts. It leverages **The Movie Database (TMDB) API** and **Machine Learning similarity models** to provide personalized recommendations, intelligent discovery, and a social experience.

---

## 🚀 Key Features

- **🧠 AI Recommendations:** Find your next watch using pre-trained ML models that analyze content DNA.
- **✨ Discovery Hero:** A dedicated recommendation engine with a premium, cinematic search interface.
- **📱 Modern UI/UX:** A fast, responsive React SPA featuring glassmorphism, smooth transitions, and **Skeleton Screens** for instant layout loading.
- **🔐 User Ecosystem:** Secure authentication (Login/Signup) with personalized profiles.
- **🚩 Dynamic Watchlist:** Save your favorites and manage them directly from any movie/TV detail page.
- **💬 Community Discussion:** Share your thoughts and join the conversation with a built-in commenting system.
- **🎨 Personalized Avatars:** Unique, letter-based user initials with dynamic color coding for a personalized feel.
- **🎞️ Cinematic Details:** High-quality backdrops, official trailers (YouTube), cast/crew bios, and region-aware streaming providers (Netflix, Hotstar, Prime, etc.).
- **🔄 Fresh Content:** Home page randomizes and shuffles content on every load, focused on titles from the last 15 years.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite**
- **Axios** (Centralized API Layer)
- **React Router 7** (SPA Routing)
- **Framer Motion** (Animations)
- **CSS3** (Custom Modern Styling & Skeleton Animations)

### Backend
- **Flask** (REST API Architecture)
- **SQLAlchemy** (Database ORM)
- **Flask-Login** (Session Management)
- **Machine Learning**: pandas, joblib, scikit-learn (Cosine Similarity)
- **Fuzzy Matching**: RapidFuzz

---

## 📂 Project Structure

```text
CineMatch/
├── backend/                # Flask REST API
│   ├── routes/             # API Blueprints (Auth, Watchlist, Comments)
│   ├── models/             # Database Models (User, Watchlist, Comment)
│   ├── services/           # Business Logic (TMDB & ML Recommendations)
│   ├── utils/              # Helper functions (Genres, OTT links)
│   ├── model/              # .pkl Machine Learning models
│   ├── app.py              # Application Entry Point
│   └── config.py           # Configuration & Env handling
├── frontend/               # React + Vite UI
│   ├── src/
│   │   ├── components/     # Reusable UI (Navbar, MovieCard, Avatar, Comments)
│   │   ├── pages/          # Page Components (Home, Recommendation, Details)
│   │   ├── services/       # Axios API Layer (api.js)
│   │   └── index.css       # Global Premium Styling
│   └── index.html          # Entry HTML with FontAwesome
└── .gitignore              # Clean version control setup
```

---

## 📦 Getting Started

### 1️⃣ Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\Activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `backend/.env` file:
```env
TMDB_API_KEY=your_key_here
SECRET_KEY=your_random_secret_key
```

Run the API:
```bash
python app.py
```
*API runs on `http://localhost:5000`*

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install
```

Create a `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Run the App:
```bash
npm run dev
```
*UI runs on `http://localhost:5173`*

---

## 🧠 How Discovery Works

### ML Recommendations
- Uses preprocessed datasets of over 10,000 titles.
- Calculates **Cosine Similarity** between titles based on genres, keywords, and overviews.
- The Discovery engine finds the exact "DNA match" for your favorite movies.

### Hybrid Search
- Uses `RapidFuzz` to handle typos and partial matches in user input.
- Combines ML-based similarity with TMDB's real-time "Similar" API for the most accurate results.

---

## 📝 Requirements
- Python 3.9+
- Node.js 18+
- TMDB API Key (Free)

---

## 🎬 Credits
- Data provided by **TMDB API**.
- Streaming data by **JustWatch**.
- Icons by **FontAwesome**.
