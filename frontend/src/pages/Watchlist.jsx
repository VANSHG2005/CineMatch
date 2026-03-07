import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { watchlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const Watchlist = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const response = await watchlistApi.getWatchlist();
        setItems(response.data || []);
      } catch (err) {
        setError('Failed to load watchlist');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [user, navigate]);

  const handleRemove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        await watchlistApi.remove(id);
        setItems(items.filter(item => item.id !== id));
      } catch (err) {
        alert('Failed to remove item');
      }
    }
  };

  if (loading) return <div className="loading-spinner">Loading Watchlist...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container" style={{ padding: '40px 4%' }}>
      <h1 className="section-title" style={{ marginBottom: '30px' }}>My Watchlist</h1>
      
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a1a1a', borderRadius: '12px' }}>
          <i className="fas fa-bookmark" style={{ fontSize: '4rem', color: '#333', marginBottom: '20px' }}></i>
          <h2>Your watchlist is empty</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>Start adding movies and TV shows to keep track of what you want to watch!</p>
          <Link to="/" className="btn-signup" style={{ display: 'inline-block', marginTop: '30px', padding: '12px 30px' }}>
            Explore Content
          </Link>
        </div>
      ) : (
        <div className="content-grid">
          {items.map(item => (
            <div key={item.id} className="watchlist-item-wrapper">
              <MovieCard 
                item={{
                  id: item.item_id,
                  title: item.title,
                  poster_path: item.poster_path
                }} 
                type={item.item_type} 
              />
              <div style={{ padding: '10px 0' }}>
                <button 
                  onClick={(e) => handleRemove(e, item.id)}
                  style={{ 
                    width: '100%',
                    background: '#2a2a2a', 
                    color: '#ff4d4d', 
                    border: '1px solid #333', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#333'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#2a2a2a'}
                >
                  <i className="fas fa-trash-can"></i>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
