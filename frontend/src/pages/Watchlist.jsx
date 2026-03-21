import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { watchlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const Watchlist = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unwatched' | 'watched'
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchWatchlist();
  }, [user, navigate]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const response = await watchlistApi.getWatchlist();
      // Support legacy items without `watched` field
      setItems((response.data || []).map(i => ({ ...i, watched: i.watched ?? false })));
    } catch {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Remove this item?')) return;
    try {
      await watchlistApi.remove(id);
      setItems(items.filter(item => item.id !== id));
    } catch {
      alert('Failed to remove item');
    }
  };

  const toggleWatched = async (e, item) => {
    e.preventDefault(); e.stopPropagation();
    const newVal = !item.watched;
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, watched: newVal } : i));
    try {
      await watchlistApi.toggleWatched(item.id, newVal);
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, watched: item.watched } : i));
    }
  };

  if (loading) return <div className="loading-spinner">Loading Watchlist...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const watched = items.filter(i => i.watched);
  const unwatched = items.filter(i => !i.watched);
  const displayed = filter === 'watched' ? watched : filter === 'unwatched' ? unwatched : items;

  return (
    <div className="container" style={{ padding: '40px 4%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h1 className="section-title" style={{ margin: 0 }}>My Watchlist</h1>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>{items.length} titles</span>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            ['all', `All (${items.length})`],
            ['unwatched', `To Watch (${unwatched.length})`],
            ['watched', `Watched (${watched.length})`],
          ].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '7px 18px', borderRadius: '20px', border: '1px solid',
              borderColor: filter === val ? '#e50914' : '#333',
              background: filter === val ? 'rgba(229,9,20,0.15)' : 'transparent',
              color: filter === val ? 'white' : '#888',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
            }}>{label}</button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a1a1a', borderRadius: '12px' }}>
          <i className="fas fa-bookmark" style={{ fontSize: '4rem', color: '#333', marginBottom: '20px', display: 'block' }}></i>
          <h2>Your watchlist is empty</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>Start adding movies and TV shows!</p>
          <Link to="/" className="btn-signup" style={{ display: 'inline-block', marginTop: '30px', padding: '12px 30px' }}>
            Explore Content
          </Link>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <p>No items in this category.</p>
        </div>
      ) : (
        <div className="small-card-grid">
          {displayed.map(item => (
            <div key={item.id} className="watchlist-item-wrapper">
              <div style={{ position: 'relative' }}>
                {item.watched && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px', zIndex: 3,
                    background: 'rgba(0,200,83,0.9)', borderRadius: '4px',
                    padding: '2px 7px', fontSize: '0.7rem', fontWeight: '700', color: 'white'
                  }}>
                    ✓ Watched
                  </div>
                )}
                <MovieCard
                  item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }}
                  type={item.item_type}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', padding: '8px 0' }}>
                <button
                  onClick={(e) => toggleWatched(e, item)}
                  title={item.watched ? 'Mark as unwatched' : 'Mark as watched'}
                  style={{
                    flex: 1, background: item.watched ? 'rgba(0,200,83,0.15)' : '#2a2a2a',
                    border: `1px solid ${item.watched ? 'rgba(0,200,83,0.4)' : '#333'}`,
                    color: item.watched ? '#00c853' : '#888',
                    padding: '7px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    transition: 'all 0.2s'
                  }}>
                  <i className={`fas ${item.watched ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                  {item.watched ? 'Watched' : 'Unwatched'}
                </button>
                <button
                  onClick={(e) => handleRemove(e, item.id)}
                  style={{
                    background: '#2a2a2a', border: '1px solid #333', color: '#ff4d4d',
                    padding: '7px 10px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  title="Remove">
                  <i className="fas fa-trash-can"></i>
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