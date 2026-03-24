import { useState, useEffect } from 'react';
import { playlistApi } from '../services/api';

const PlaylistModal = ({ isOpen, onClose, item, type }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const response = await playlistApi.getAll();
      setPlaylists(response.data || []);
    } catch (err) {
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const addToPlaylist = async (playlistId) => {
    try {
      await playlistApi.addItem(playlistId, {
        item_id: item.id,
        item_type: type,
        title: item.title || item.name,
        poster_path: item.poster_path
      });
      setSuccess('Added to playlist!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to playlist');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <button className="modal-close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', textAlign: 'center' }}>Add to Playlist</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div style={{ background: 'rgba(0, 200, 83, 0.1)', color: '#00c853', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center' }}>{success}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading playlists...</div>
        ) : playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>You haven't created any playlists yet.</p>
            <button className="btn-auth" onClick={() => window.location.href = '/playlists'}>Go to Playlists</button>
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {playlists.map(playlist => (
              <button 
                key={playlist.id} 
                onClick={() => addToPlaylist(playlist.id)}
                style={{ 
                  width: '100%', 
                  padding: '12px 15px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid #333', 
                  borderRadius: '8px', 
                  color: 'white', 
                  textAlign: 'left', 
                  marginBottom: '10px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
                className="playlist-item-btn"
              >
                <i className="fas fa-list-ul" style={{ color: 'var(--primary-color)' }}></i>
                <div>
                  <div style={{ fontWeight: '600' }}>{playlist.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{playlist.item_count || 0} items</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
