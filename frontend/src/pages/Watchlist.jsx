import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { watchlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const Watchlist = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchWatchlist();
  }, [user, navigate]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const response = await watchlistApi.getWatchlist();
      // Normalize: treat null/undefined watched as false
      setItems((response.data || []).map(i => ({ ...i, watched: i.watched === true })));
    } catch {
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleRemove = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Remove this item?')) return;
    try {
      await watchlistApi.remove(id);
      setItems(prev => prev.filter(item => item.id !== id));
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
      const res = await watchlistApi.toggleWatched(item.id, newVal);
      // Sync with actual server value in case DB returned something different
      const serverWatched = res.data?.watched === true;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, watched: serverWatched } : i));
      showToast(serverWatched ? `✓ Marked as watched` : `Marked as unwatched`);
    } catch (err) {
      // Revert on failure and show why
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, watched: item.watched } : i));
      const msg = err.response?.data?.error || 'Failed to update. Please log in again.';
      showToast(`⚠ ${msg}`);
    }
  };

  if (loading) return <div className="loading-spinner">Loading Watchlist...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const watched = items.filter(i => i.watched);
  const unwatched = items.filter(i => !i.watched);
  const displayed = filter === 'watched' ? watched : filter === 'unwatched' ? unwatched : items;

  return (
    <div className="container" style={{ padding: '40px 4%' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#222', color: 'white', padding: '10px 22px', borderRadius: '30px',
          fontSize: '0.88rem', fontWeight: '600', zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', pointerEvents: 'none'
        }}>{toastMsg}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h1 className="section-title" style={{ margin: 0 }}>My Watchlist</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{items.length} titles</span>
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
              borderColor: filter === val ? '#e50914' : 'var(--border-color)',
              background: filter === val ? 'rgba(229,9,20,0.15)' : 'transparent',
              color: filter === val ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
            }}>{label}</button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <i className="fas fa-bookmark" style={{ fontSize: '4rem', color: 'var(--border-color)', marginBottom: '20px', display: 'block' }}></i>
          <h2>Your watchlist is empty</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Start adding movies and TV shows!</p>
          <Link to="/" className="btn-signup" style={{ display: 'inline-block', marginTop: '30px', padding: '12px 30px' }}>
            Explore Content
          </Link>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
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
                  }}>✓ Watched</div>
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
                    flex: 1,
                    background: item.watched ? 'rgba(0,200,83,0.15)' : 'var(--card-bg)',
                    border: `1px solid ${item.watched ? 'rgba(0,200,83,0.4)' : 'var(--border-color)'}`,
                    color: item.watched ? '#00c853' : 'var(--text-muted)',
                    padding: '7px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.8rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '5px', transition: 'all 0.2s'
                  }}>
                  <i className={`fas ${item.watched ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                  {item.watched ? 'Watched' : 'Unwatched'}
                </button>
                <button
                  onClick={(e) => handleRemove(e, item.id)}
                  style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                    color: '#ff4d4d', padding: '7px 10px', borderRadius: '4px',
                    cursor: 'pointer', transition: 'all 0.2s'
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