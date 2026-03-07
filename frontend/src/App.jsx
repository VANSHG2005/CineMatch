import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MovieDetail from './pages/MovieDetail';
import TvDetail from './pages/TvDetail';
import PersonDetail from './pages/PersonDetail';
import SearchResults from './pages/SearchResults';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import CategoryPage from './pages/CategoryPage';
import GenrePage from './pages/GenrePage';
import RecommendationPage from './pages/RecommendationPage';
import { authApi } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getMe();
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} setUser={setUser} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="/movie/:id" element={<MovieDetail user={user} />} />
            <Route path="/tv/:id" element={<TvDetail user={user} />} />
            <Route path="/person/:id" element={<PersonDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/watchlist" element={<Watchlist user={user} />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/category/:type/:category" element={<CategoryPage />} />
            <Route path="/genre/:type/:id" element={<GenrePage />} />
            <Route path="/recommend" element={<RecommendationPage />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; 2026 CineMatch. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
