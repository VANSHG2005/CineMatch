# 🎬 CineMatch: Finding Your Next Watch with AI

CineMatch is a project I built to help movie fans (like myself) find something new to watch without spending hours scrolling. It’s a full-stack web app that uses a mix of real-time data from the **TMDB API** and some **Machine Learning models** I trained to handle personalized recommendations.

The main goal was to create something that feels cinematic but also actually works well. I used React for the frontend to keep everything snappy and Flask on the backend to handle the data and the ML logic.

---

## 🚀 What I Built (Key Features)

- **🧠 AI-Driven Recommendations:** Instead of just showing "popular" movies, I implemented a recommendation engine using pre-trained ML models. It looks at the "DNA" of a movie (genres, keywords, etc.) to find titles that are actually similar.
- **✨ Discovery Hero:** This is probably my favorite part. It’s a dedicated search interface that feels a bit more premium. I wanted it to feel like a high-end streaming service.
- **📱 Smooth UI/UX:** I used **Skeleton Screens** so the app doesn't feel "broken" while data is fetching. It’s got a glassmorphism look with smooth transitions thanks to Framer Motion.
- **🔐 User Accounts:** You can sign up and log in to save your own profile. It handles authentication securely through Flask-Login.
- **🚩 The Watchlist:** While working on this, I realized I needed a way to save movies for later, so I built a dynamic watchlist that updates instantly across the app.
- **💬 Comments & Discussion:** I added a simple community system where users can leave thoughts on movies.
- **🎞️ Full Movie Details:** I pulled in everything from high-res backdrops and YouTube trailers to bios for the cast. It even shows where you can stream the movie (Netflix, Prime, etc.) based on your region.
- **🔄 Random Discovery:** To keep the home page from getting stale, I set it up to shuffle content every time you load it, mostly focusing on movies from the last 15 years.

---

## 🛠️ The Tech Stack

### Frontend
- **React 19 & Vite:** I went with Vite because it's so much faster than Create React App.
- **Axios:** Handles all the API calls in a centralized way.
- **React Router 7:** Manages the SPA routing without page refreshes.
- **Framer Motion:** Used this for the animations to make the UI feel "alive."
- **CSS3:** All the styling is custom—I wanted to practice my CSS skills instead of just relying on a framework like Bootstrap.

### Backend
- **Flask:** I used Flask because it's lightweight and perfect for connecting Python-based ML models to a web app.
- **SQLAlchemy:** This made managing the database much easier through an ORM.
- **ML Logic:** I used `pandas`, `joblib`, and `scikit-learn`. The core is a **Cosine Similarity** model.
- **Fuzzy Matching:** Initially, I had issues with typos in search, so I added `RapidFuzz` to handle user errors better.

---

## 📂 How I Organized the Code

```text
CineMatch/
├── backend/                # The Flask API
│   ├── routes/             # All the API endpoints (Auth, Watchlist, etc.)
│   ├── models/             # Database schemas
│   ├── services/           # The "brains" - where TMDB and ML logic live
│   ├── model/              # Where I store the .pkl files for the ML models
│   └── app.py              # The main entry point
├── frontend/               # The React app
│   ├── src/
│   │   ├── components/     # Reusable bits like the Navbar and MovieCards
│   │   ├── pages/          # The different views (Home, Profile, etc.)
│   │   └── services/       # Where I keep the API configuration
└── .gitignore              # Keeping the repo clean
```

---

## 📦 Setting It Up Locally

### 1️⃣ Getting the Backend Ready
```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\Activate
# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

You'll need a `.env` file in the `backend` folder:
```env
TMDB_API_KEY=your_key_here
SECRET_KEY=your_random_secret_key
```

Then just run:
```bash
python app.py
```
*It should start on `http://localhost:5000`*

### 2️⃣ Getting the Frontend Ready
```bash
cd frontend
npm install
```

Create a `.env` in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

Run it with:
```bash
npm run dev
```
*The UI will be at `http://localhost:5173`*

---

## 🧠 A Bit About the Recommendation Engine

### How it works
I used a dataset of over 10,000 titles to train the model. It calculates **Cosine Similarity** by looking at things like genres, keywords, and the movie overview. One challenge I faced was making sure the search felt "smart," so I combined this ML logic with TMDB’s "Similar" API to get a hybrid result that feels more accurate than just using one method.

---

## 🎬 Acknowledgments
- Data is from the **TMDB API**.
- Streaming links are powered by **JustWatch**.
- Icons from **FontAwesome**.
