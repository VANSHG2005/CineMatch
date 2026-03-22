import { Link, useNavigate } from 'react-router-dom';
import { authApi, tmdbApi } from '../services/api';
import { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaSearch, FaUser, FaSignOutAlt, FaPlus, FaHome, FaFilm, FaTv, FaMagic } from 'react-icons/fa';
import UserAvatar from './UserAvatar';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

const MAX_HISTORY = 8;

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [genres, setGenres] = useState({ movies: {}, tv: {} });
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cinematch-search-history') || '[]'); }
    catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef(null);

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

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searchHistory.filter(h => h !== trimmed)].slice(0, MAX_HISTORY);
    setSearchHistory(updated);
    localStorage.setItem('cinematch-search-history', JSON.stringify(updated));
  };

  const removeHistory = (item, e) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    localStorage.setItem('cinematch-search-history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('cinematch-search-history');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavSearch = (e) => {
    e.preventDefault();
    const q = navSearchQuery.trim();
    if (!q) return;
    saveSearch(q);
    navigate(`/search?query=${encodeURIComponent(q)}`);
    setNavSearchQuery('');
    setShowHistory(false);
    setIsMobileMenuOpen(false);
  };

  const handleHistoryClick = (item) => {
    saveSearch(item);
    navigate(`/search?query=${encodeURIComponent(item)}`);
    setNavSearchQuery('');
    setShowHistory(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown(null);
  };

  const toggleDropdown = (name) => {
    if (window.innerWidth <= 1100) {
      setActiveDropdown(activeDropdown === name ? null : name);
    }
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const filteredHistory = navSearchQuery.trim()
    ? searchHistory.filter(h => h.toLowerCase().includes(navSearchQuery.toLowerCase()))
    : searchHistory;

  return (
    <nav className={`navbar ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}><img src={theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'} alt="CineMatch" style={{ height: '38px', display: 'block' }} /></Link>

        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={closeMenu}><FaHome className="nav-icon" /> Home</Link>

            <div className={`nav-item-dropdown ${activeDropdown === 'movies' ? 'open' : ''}`} onClick={() => toggleDropdown('movies')}>
              <span className="nav-link"><FaFilm className="nav-icon" /> Movies</span>
              <div className="dropdown-menu">
                <Link to="/category/movie/popular" className="dropdown-item" onClick={closeMenu}>Popular</Link>
                <Link to="/category/movie/now_playing" className="dropdown-item" onClick={closeMenu}>Now Playing</Link>
                <Link to="/category/movie/top_rated" className="dropdown-item" onClick={closeMenu}>Top Rated</Link>
              </div>
            </div>

            <div className={`nav-item-dropdown ${activeDropdown === 'tv' ? 'open' : ''}`} onClick={() => toggleDropdown('tv')}>
              <span className="nav-link"><FaTv className="nav-icon" /> TV Shows</span>
              <div className="dropdown-menu">
                <Link to="/category/tv/popular" className="dropdown-item" onClick={closeMenu}>Popular</Link>
                <Link to="/category/tv/on_the_air" className="dropdown-item" onClick={closeMenu}>On The Air</Link>
                <Link to="/category/tv/top_rated" className="dropdown-item" onClick={closeMenu}>Top Rated</Link>
                <Link to="/category/tv/upcoming" className="dropdown-item" onClick={closeMenu}>Airing Tomorrow</Link>
              </div>
            </div>

            <div className={`nav-item-dropdown ${activeDropdown === 'genres' ? 'open' : ''}`} onClick={() => toggleDropdown('genres')}>
              <span className="nav-link">Genre</span>
              <div className="dropdown-menu">
                <div className="dropdown-header">Movie Genres</div>
                {Object.entries(genres.movies).map(([id, info]) => (
                  <Link key={`movie-${id}`} to={`/genre/movie/${id}`} className="dropdown-item" onClick={closeMenu}>{info.name}</Link>
                ))}
                <div className="dropdown-divider"></div>
                <div className="dropdown-header">TV Genres</div>
                {Object.entries(genres.tv).map(([id, info]) => (
                  <Link key={`tv-${id}`} to={`/genre/tv/${id}`} className="dropdown-item" onClick={closeMenu}>{info.name}</Link>
                ))}
              </div>
            </div>

            <Link to="/recommend" className="nav-link" onClick={closeMenu}><FaMagic className="nav-icon" /> Recommend</Link>
            {user && <Link to="/watchlist" className="nav-link" onClick={closeMenu}><FaPlus className="nav-icon" /> Watchlist</Link>}
            {user && <Link to="/friends" className="nav-link" onClick={closeMenu}><i className="fas fa-user-group" style={{marginRight:'4px'}}></i> Friends</Link>}

            <div className="mobile-auth">
              {user ? (
                <>
                  <Link to="/profile" className="nav-link" onClick={closeMenu}><FaUser className="nav-icon" /> Profile</Link>
                  <button onClick={handleLogout} className="nav-link mobile-logout-btn"><FaSignOutAlt className="nav-icon" /> Logout</button>
                </>
              ) : (
                <div className="mobile-auth-btns">
                  <Link to="/login" className="btn-login" onClick={closeMenu}>Login</Link>
                  <Link to="/signup" className="btn-signup" onClick={closeMenu}>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search with history */}
        <form className="nav-search-form" onSubmit={handleNavSearch} ref={searchRef}>
          <div className="nav-search-container" style={{ position: 'relative' }}>
            <input
              type="text"
              className="nav-search-input"
              placeholder="Search..."
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              onFocus={() => setShowHistory(true)}
              autoComplete="off"
            />
            <button type="submit" className="nav-search-btn"><FaSearch /></button>

            {/* Search history dropdown */}
            {showHistory && filteredHistory.length > 0 && (
              <div className="search-history-dropdown">
                <div className="search-history-header">
                  <span>Recent Searches</span>
                  <button type="button" onClick={clearHistory} className="search-history-clear">Clear all</button>
                </div>
                {filteredHistory.map((item, i) => (
                  <div key={i} className="search-history-item" onClick={() => handleHistoryClick(item)}>
                    <i className="fas fa-clock-rotate-left"></i>
                    <span>{item}</span>
                    <button type="button" onClick={(e) => removeHistory(item, e)} className="search-history-remove">
                      <i className="fas fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="nav-auth desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notifications */}
          <NotificationBell user={user} />
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="theme-toggle-btn" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          {user ? (
            <div className="user-nav-actions">
              <Link to="/profile" className="profile-link">
                <UserAvatar name={user.name} src={user.profile_pic} size="small" />
                <span className="nav-link desktop-only">Profile</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout" title="Logout"><FaSignOutAlt /></button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </>
          )}
        </div>

        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;