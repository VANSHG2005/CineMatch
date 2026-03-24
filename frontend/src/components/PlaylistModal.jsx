import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playlistApi } from '../services/api';

const PlaylistModal = ({ isOpen, onClose, item, type }) => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      console.log("PlaylistModal opened for item:", item);
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await playlistApi.getAll();
      console.log("Playlists fetched:", response.data);
      if (Array.isArray(response.data)) {
        setPlaylists(response.data);
      } else {
        console.error("Unexpected playlists data format:", response.data);
        setPlaylists([]);
      }
    } catch (err) {
      console.error("Error fetching playlists:", err);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToPlaylist = async (playlistId) => {
    setAddingId(playlistId);
    setError(null);
    try {
      const payload = {
        item_id: item.id,
        item_type: type,
        title: item.title || item.name || 'Untitled',
        poster_path: item.poster_path || ''
      };
      console.log("Adding to playlist:", playlistId, payload);
      await playlistApi.addItem(playlistId, payload);
      setSuccess('Added to playlist!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error adding to playlist:", err);
      setError(err.response?.data?.error || 'Failed to add to playlist');
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: '80px' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '30px', margin: '0 auto' }}>
        <button className="modal-close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', textAlign: 'center', color: 'white' }}>Add to Playlist</h2>
        
        {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
        {success && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 200, 83, 0.95)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '8px',
            zIndex: 9999,
            minWidth: '240px',
            textAlign: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            fontWeight: 'bold'
          }}>
            {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '15px' }}></i>
            <p style={{ color: '#aaa' }}>Loading your playlists...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <i className="fas fa-list-ul" style={{ fontSize: '3rem', color: '#333', marginBottom: '20px' }}></i>
            <p style={{ color: '#aaa', marginBottom: '25px' }}>You haven't created any playlists yet.</p>
            <button className="btn-auth" onClick={() => { onClose(); alert('No playlists found. Use the top navigation Playlists page to create one.'); }} style={{ width: '100%' }}>
              Create a Playlist
            </button>
          </div>
        ) : (
          <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px' }}>Select a playlist:</p>
            {playlists.map(playlist => (
              <button 
                key={playlist.id} 
                onClick={() => addToPlaylist(playlist.id)}
                disabled={addingId !== null}
                style={{ 
                  width: '100%', 
                  padding: '12px 15px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid #333', 
                  borderRadius: '10px', 
                  color: 'white', 
                  textAlign: 'left', 
                  marginBottom: '10px', 
                  cursor: addingId !== null ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  transition: 'all 0.2s',
                  opacity: addingId === playlist.id ? 0.7 : 1
                }}
                className="playlist-item-btn"
              >
                <div style={{ width: '40px', height: '40px', background: 'rgba(229,9,20,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {addingId === playlist.id ? (
                    <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-color)' }}></i>
                  ) : (
                    <i className="fas fa-list-ul" style={{ color: 'var(--primary-color)' }}></i>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{playlist.item_count || 0} items</div>
                </div>
                <i className="fas fa-chevron-right" style={{ fontSize: '0.8rem', color: '#444' }}></i>
              </button>
            ))}
            
            <button 
              onClick={() => { onClose(); alert('Use the Playlists page from the top nav to create a playlist.'); }}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: 'transparent', 
                border: '1px dashed #444', 
                borderRadius: '10px', 
                color: '#aaa', 
                marginTop: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Create new playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
