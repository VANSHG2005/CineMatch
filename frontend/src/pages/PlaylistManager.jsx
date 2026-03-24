import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { playlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const PlaylistManager = ({ user }) => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);  // selected playlist with items
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPublic, setNewPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPlaylists();
  }, [user, navigate]);

  const fetchPlaylists = async () => {
    try {
      const r = await playlistApi.getAll();
      setPlaylists(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openPlaylist = async (p) => {
    try {
      const r = await playlistApi.get(p.id);
      setSelected(r.data);
    } catch (e) { console.error(e); }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const r = await playlistApi.create({ name: newName.trim(), description: newDesc, is_public: newPublic });
      setPlaylists(prev => [r.data, ...prev]);
      setNewName(''); setNewDesc(''); setNewPublic(false); setCreating(false);
    } catch (e) { alert(e.response?.data?.error || 'Failed to create'); }
  };

  const deletePlaylist = async (id) => {
    if (!window.confirm('Delete this playlist?')) return;
    await playlistApi.delete(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const removeItem = async (itemId) => {
    if (!selected) return;
    await playlistApi.removeItem(selected.id, itemId);
    setSelected(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  };

  const togglePublic = async () => {
    const r = await playlistApi.update(selected.id, { is_public: !selected.is_public });
    setSelected(prev => ({ ...prev, is_public: r.data.is_public }));
    setPlaylists(prev => prev.map(p => p.id === selected.id ? { ...p, is_public: r.data.is_public } : p));
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/playlist/${selected.share_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="genre-browse-container" style={{ paddingTop: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>My Playlists</h1>
        <button onClick={() => setCreating(o => !o)} className="btn-auth" style={{ width: 'auto', padding: '10px 20px' }}>
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>New Playlist
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={createPlaylist} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--text-color)' }}>Create New Playlist</h3>
          <div className="form-group">
            <label>Name</label>
            <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Weekend Watchlist" required />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input className="form-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What's this playlist about?" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <input type="checkbox" id="public-check" checked={newPublic} onChange={e => setNewPublic(e.target.checked)} style={{ accentColor: '#e50914' }} />
            <label htmlFor="public-check" style={{ color: 'var(--text-color)', fontSize: '0.9rem', cursor: 'pointer' }}>
              Make public (shareable link)
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn-auth" style={{ width: 'auto', padding: '8px 20px' }}>Create</button>
            <button type="button" onClick={() => setCreating(false)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 16px', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '280px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Playlist list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            : playlists.length === 0 ? (
              <div className="profile-empty-box">
                <i className="fas fa-list" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: '12px' }}></i>
                <p style={{ color: 'var(--text-muted)' }}>No playlists yet. Create one above!</p>
              </div>
            ) : playlists.map(p => (
              <div key={p.id} onClick={() => openPlaylist(p)}
                style={{ background: selected?.id === p.id ? 'rgba(229,9,20,0.08)' : 'var(--card-bg)', border: `1px solid ${selected?.id === p.id ? 'rgba(229,9,20,0.4)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-color)', marginBottom: '4px', fontSize: '0.95rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.item_count} items · {p.is_public ? <span style={{ color: '#00c853' }}>Public</span> : 'Private'}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 6px', flexShrink: 0 }}>
                    <i className="fas fa-trash-can" style={{ fontSize: '0.8rem' }}></i>
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Selected playlist detail */}
        {selected && (
          <div>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', color: 'var(--text-color)' }}>{selected.name}</h2>
                  {selected.description && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>{selected.description}</p>}
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    by {selected.owner_name} · {selected.items?.length || 0} items
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Public toggle */}
                  <button onClick={togglePublic} style={{ background: selected.is_public ? 'rgba(0,200,83,0.1)' : 'var(--bg-color)', border: `1px solid ${selected.is_public ? 'rgba(0,200,83,0.4)' : 'var(--border-color)'}`, borderRadius: '6px', padding: '7px 14px', color: selected.is_public ? '#00c853' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                    <i className={`fas ${selected.is_public ? 'fa-globe' : 'fa-lock'}`} style={{ marginRight: '6px' }}></i>
                    {selected.is_public ? 'Public' : 'Private'}
                  </button>
                  {/* Share button — only if public */}
                  {selected.is_public && (
                    <button onClick={copyShareLink} style={{ background: copied ? 'rgba(0,200,83,0.1)' : 'rgba(229,9,20,0.1)', border: `1px solid ${copied ? 'rgba(0,200,83,0.4)' : 'rgba(229,9,20,0.3)'}`, borderRadius: '6px', padding: '7px 14px', color: copied ? '#00c853' : '#e50914', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                      <i className={`fas ${copied ? 'fa-check' : 'fa-share-nodes'}`} style={{ marginRight: '6px' }}></i>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  )}
                </div>
              </div>
              {selected.is_public && (
                <div style={{ background: 'var(--bg-color)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {window.location.origin}/playlist/{selected.share_id}
                </div>
              )}
            </div>

            {/* Items grid */}
            {!selected.items || selected.items.length === 0 ? (
              <div className="profile-empty-box">
                <p style={{ color: 'var(--text-muted)' }}>No items yet. Add movies or TV shows from their detail pages.</p>
              </div>
            ) : (
              <div className="small-card-grid">
                {selected.items.map(item => (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <MovieCard item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
                    <button onClick={() => removeItem(item.id)}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.8)', border: 'none', color: '#ff4d4d', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                      <i className="fas fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistManager;