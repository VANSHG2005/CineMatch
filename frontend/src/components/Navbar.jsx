import { Link, useNavigate } from 'react-router-dom';
import { authApi, tmdbApi } from '../services/api';
import { useState, useEffect } from 'react';
import UserAvatar from './UserAvatar';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState({ movies: {}, tv: {} });
  const [navSearchQuery, setNavSearchQuery] = useState('');

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await tmdbApi.getGenres();
        setGenres(response.data);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(navSearchQuery.trim())}`);
      setNavSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Link to="/" className="nav-logo" style={{ marginRight: '30px' }}>CineMatch</Link>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          
          <div className="nav-item-dropdown">
            <span className="nav-link">Movies</span>
            <div className="dropdown-menu">
              <Link to="/category/movie/popular" className="dropdown-item">Popular</Link>
              <Link to="/category/movie/now_playing" className="dropdown-item">Now Playing</Link>
              <Link to="/category/movie/top_rated" className="dropdown-item">Top Rated</Link>
            </div>
          </div>

          <div className="nav-item-dropdown">
            <span className="nav-link">TV Shows</span>
            <div className="dropdown-menu">
              <Link to="/category/tv/popular" className="dropdown-item">Popular</Link>
              <Link to="/category/tv/on_the_air" className="dropdown-item">On The Air</Link>
              <Link to="/category/tv/top_rated" className="dropdown-item">Top Rated</Link>
              <Link to="/category/tv/upcoming" className="dropdown-item">Airing Tomorrow</Link>
            </div>
          </div>

          <div className="nav-item-dropdown">
            <span className="nav-link">Genre</span>
            <div className="dropdown-menu">
              <div className="dropdown-header">Movie Genres</div>
              {Object.entries(genres.movies).map(([id, info]) => (
                <Link key={`movie-${id}`} to={`/genre/movie/${id}`} className="dropdown-item">{info.name}</Link>
              ))}
              <div className="dropdown-divider"></div>
              <div className="dropdown-header">TV Genres</div>
              {Object.entries(genres.tv).map(([id, info]) => (
                <Link key={`tv-${id}`} to={`/genre/tv/${id}`} className="dropdown-item">{info.name}</Link>
              ))}
            </div>
          </div>

          <Link to="/recommend" className="nav-link">Recommend</Link>
          {user && <Link to="/watchlist" className="nav-link">Watchlist</Link>}
        </div>
      </div>

      <form className="nav-search-form" onSubmit={handleNavSearch}>
        <div className="nav-search-container">
          <input 
            type="text" 
            className="nav-search-input" 
            placeholder="Search movies, TV shows..." 
            value={navSearchQuery}
            onChange={(e) => setNavSearchQuery(e.target.value)}
          />
          <button type="submit" className="nav-search-btn">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </form>

      <div className="nav-auth">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
              <UserAvatar name={user.name} src={user.profile_pic} size="small" />
              <span className="nav-link">Profile</span>
            </Link>
            <button onClick={handleLogout} className="btn-login" style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit'}}>Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/signup" className="btn-signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
