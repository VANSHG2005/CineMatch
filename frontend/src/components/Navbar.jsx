import { Link, useNavigate } from 'react-router-dom';
import { authApi, tmdbApi } from '../services/api';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaSearch, FaUser, FaSignOutAlt, FaPlus, FaHome, FaFilm, FaTv, FaMagic } from 'react-icons/fa';
import UserAvatar from './UserAvatar';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState({ movies: {}, tv: {} });
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

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
      setIsMobileMenuOpen(false);
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
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown(null);
  };

  const toggleDropdown = (name) => {
    // Only toggle on mobile screens (where mobile menu is active)
    if (window.innerWidth <= 1100) {
      setActiveDropdown(activeDropdown === name ? null : name);
    }
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <nav className={`navbar ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>CineMatch</Link>
        
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
            
            {/* Mobile Auth Links */}
            <div className="mobile-auth">
              {user ? (
                <>
                  <Link to="/profile" className="nav-link" onClick={closeMenu}>
                    <FaUser className="nav-icon" /> Profile
                  </Link>
                  <button onClick={handleLogout} className="nav-link mobile-logout-btn">
                    <FaSignOutAlt className="nav-icon" /> Logout
                  </button>
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

        <form className="nav-search-form" onSubmit={handleNavSearch}>
          <div className="nav-search-container">
            <input 
              type="text" 
              className="nav-search-input" 
              placeholder="Search..." 
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
            />
            <button type="submit" className="nav-search-btn">
              <FaSearch />
            </button>
          </div>
        </form>

        <div className="nav-auth desktop-auth">
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
