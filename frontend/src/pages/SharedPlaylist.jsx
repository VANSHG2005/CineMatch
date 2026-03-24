import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const SharedPlaylist = () => {
  const { shareId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    playlistApi.getShared(shareId)
      .then(r => setPlaylist(r.data))
      .catch(e => setError(e.response?.data?.error || 'Playlist not found'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="loading-spinner">Loading playlist...</div>;
  if (error) return (
    <div className="genre-browse-container" style={{ paddingTop: '60px', textAlign: 'center' }}>
      <i className="fas fa-list" style={{ fontSize: '3rem', opacity: 0.3, display: 'block', marginBottom: '16px' }}></i>
      <h2>{error}</h2>
      <Link to="/" className="btn-auth" style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', marginTop: '20px' }}>Go Home</Link>
    </div>
  );

  return (
    <div className="genre-browse-container" style={{ paddingTop: '30px' }}>
      {/* Header */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ background: '#e50914', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-list" style={{ color: 'white', fontSize: '1rem' }}></i>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-color)' }}>{playlist.name}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Shared by <strong style={{ color: 'var(--text-color)' }}>{playlist.owner_name}</strong> · {playlist.items?.length || 0} titles
            </p>
          </div>
        </div>
        {playlist.description && (
          <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>{playlist.description}</p>
        )}
        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.78rem', color: '#00c853', fontWeight: '700' }}>
            <i className="fas fa-globe" style={{ marginRight: '6px' }}></i>Public Playlist
          </span>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}
            style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.78rem', color: '#e50914', fontWeight: '700', cursor: 'pointer' }}>
            <i className="fas fa-share-nodes" style={{ marginRight: '6px' }}></i>Share
          </button>
        </div>
      </div>

      {/* Items */}
      {!playlist.items || playlist.items.length === 0 ? (
        <div className="profile-empty-box">
          <p style={{ color: 'var(--text-muted)' }}>This playlist is empty.</p>
        </div>
      ) : (
        <div className="small-card-grid">
          {playlist.items.map(item => (
            <MovieCard key={item.id} item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedPlaylist;