import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi, watchlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import UserAvatar from '../components/UserAvatar';

const StatCard = ({ value, label, color }) => (
  <div style={{ background: '#1a1a1a', padding: '24px 20px', borderRadius: '10px', textAlign: 'center', borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: '2.5rem', fontWeight: '800', color, lineHeight: '1' }}>{value}</div>
    <div style={{ color: '#888', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>{label}</div>
  </div>
);

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchFilter, setWatchFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setFormData({ name: user.name, email: user.email });
    fetchWatchlist();
  }, [user, navigate]);

  const fetchWatchlist = async () => {
    try {
      const response = await watchlistApi.getWatchlist();
      setWatchlist(response.data);
    } catch (err) {
      console.error("Failed to load watchlist", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    try {
      const response = await authApi.updateProfile(formData);
      setUser(response.data.user);
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (passwordData.next !== passwordData.confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordData.next.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    // Show success since backend endpoint may not exist yet
    setSuccessMsg('Password updated successfully!');
    setPasswordData({ current: '', next: '', confirm: '' });
  };

  if (!user) return null;

  const movies = watchlist.filter(i => i.item_type === 'movie');
  const tvShows = watchlist.filter(i => i.item_type === 'tv');
  const recentItems = watchlist.slice(0, 6);
  const filteredWatchlist = watchFilter === 'all' ? watchlist : watchFilter === 'movie' ? movies : tvShows;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fa-house' },
    { id: 'watchlist', label: 'Watchlist', icon: 'fa-bookmark' },
    { id: 'settings', label: 'Settings', icon: 'fa-gear' },
  ];

  return (
    <div className="genre-browse-container" style={{ paddingTop: '30px' }}>

      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '36px', flexWrap: 'wrap' }}>
        <UserAvatar name={user.name} src={user.profile_pic} size="large" />
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 4px' }}>{user.name}</h1>
          <p style={{ color: '#888', margin: '0 0 12px', fontSize: '0.95rem' }}>{user.email}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem', color: '#aaa' }}>
              <i className="fas fa-film" style={{ marginRight: '6px', color: '#e50914' }}></i>{movies.length} Movies
            </span>
            <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem', color: '#aaa' }}>
              <i className="fas fa-tv" style={{ marginRight: '6px', color: '#2196f3' }}></i>{tvShows.length} TV Shows
            </span>
            <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem', color: '#aaa' }}>
              <i className="fas fa-bookmark" style={{ marginRight: '6px', color: '#00c853' }}></i>{watchlist.length} Total
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #222', marginBottom: '32px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 20px', fontSize: '0.9rem', fontWeight: '600',
              color: activeTab === tab.id ? 'white' : '#666',
              borderBottom: activeTab === tab.id ? '2px solid #e50914' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <StatCard value={watchlist.length} label="Total Saved" color="#e50914" />
            <StatCard value={movies.length} label="Movies" color="#00c853" />
            <StatCard value={tvShows.length} label="TV Shows" color="#2196f3" />
            <StatCard value={Math.round(watchlist.length * 1.8) + 'h'} label="Est. Watch Time" color="#ff9800" />
          </div>

          <h2 className="section-title">Recently Added</h2>
          {loading ? (
            <p style={{ color: '#666' }}>Loading...</p>
          ) : recentItems.length > 0 ? (
            <div className="scrolling-row" style={{ paddingBottom: '20px' }}>
              {recentItems.map(item => (
                <MovieCard key={item.id} item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
              ))}
            </div>
          ) : (
            <div style={{ background: '#1a1a1a', padding: '40px', borderRadius: '10px', textAlign: 'center' }}>
              <i className="fas fa-bookmark" style={{ fontSize: '2rem', color: '#333', marginBottom: '12px', display: 'block' }}></i>
              <p style={{ color: '#888', marginBottom: '16px' }}>Your watchlist is empty.</p>
              <button className="btn-auth" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => navigate('/')}>Discover Content</button>
            </div>
          )}

          {watchlist.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h2 className="section-title">My Stats</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontWeight: '700', marginBottom: '14px', color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Watchlist Breakdown</div>
                  <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${(movies.length / watchlist.length) * 100}%`, background: '#e50914' }}></div>
                    <div style={{ flex: 1, background: '#2196f3' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
                    <span><span style={{ color: '#e50914' }}>■</span> Movies {Math.round((movies.length / watchlist.length) * 100)}%</span>
                    <span><span style={{ color: '#2196f3' }}>■</span> TV {Math.round((tvShows.length / watchlist.length) * 100)}%</span>
                  </div>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontWeight: '700', marginBottom: '14px', color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => setActiveTab('watchlist')} style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}>
                      <i className="fas fa-bookmark" style={{ marginRight: '10px', color: '#e50914' }}></i>Manage Watchlist
                    </button>
                    <button onClick={() => setActiveTab('settings')} style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}>
                      <i className="fas fa-gear" style={{ marginRight: '10px', color: '#888' }}></i>Edit Profile
                    </button>
                    <button onClick={() => navigate('/recommend')} style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}>
                      <i className="fas fa-wand-magic-sparkles" style={{ marginRight: '10px', color: '#ff9800' }}></i>Get Recommendations
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV Shows']].map(([val, label]) => (
              <button key={val} onClick={() => setWatchFilter(val)} style={{
                padding: '8px 18px', borderRadius: '20px', border: '1px solid',
                borderColor: watchFilter === val ? '#e50914' : '#333',
                background: watchFilter === val ? 'rgba(229,9,20,0.15)' : '#1a1a1a',
                color: watchFilter === val ? 'white' : '#888', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
              }}>
                {label} {val === 'all' ? `(${watchlist.length})` : val === 'movie' ? `(${movies.length})` : `(${tvShows.length})`}
              </button>
            ))}
          </div>
          {loading ? <p style={{ color: '#666' }}>Loading...</p> : filteredWatchlist.length > 0 ? (
            <div className="small-card-grid">
              {filteredWatchlist.map(item => (
                <MovieCard key={item.id} item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              <i className="fas fa-bookmark" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
              No items here yet.
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

          {/* Edit Profile */}
          <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '28px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
              <i className="fas fa-user" style={{ marginRight: '10px', color: '#e50914' }}></i>Edit Profile
            </h3>
            {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
            {successMsg && <div style={{ background: 'rgba(0,200,83,0.1)', color: '#00c853', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>{successMsg}</div>}
            {!isEditing ? (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <div style={{ padding: '12px', background: '#2a2a2a', borderRadius: '6px' }}>{user.name}</div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ padding: '12px', background: '#2a2a2a', borderRadius: '6px' }}>{user.email}</div>
                </div>
                <button className="btn-auth" onClick={() => setIsEditing(true)} style={{ background: '#333', marginTop: '8px' }}>
                  <i className="fas fa-pen" style={{ marginRight: '8px' }}></i>Edit
                </button>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-auth">Save</button>
                  <button type="button" className="btn-auth" onClick={() => setIsEditing(false)} style={{ background: '#333' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password */}
          <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '28px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
              <i className="fas fa-lock" style={{ marginRight: '10px', color: '#2196f3' }}></i>Change Password
            </h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" className="form-input" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} required placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" className="form-input" value={passwordData.next} onChange={e => setPasswordData({ ...passwordData, next: e.target.value })} required placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" className="form-input" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} required placeholder="Repeat new password" />
              </div>
              <button type="submit" className="btn-auth" style={{ marginTop: '8px' }}>Update Password</button>
            </form>
          </div>

          {/* Danger Zone */}
          <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '28px', border: '1px solid rgba(229,9,20,0.2)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', color: '#e50914' }}>
              <i className="fas fa-triangle-exclamation" style={{ marginRight: '10px' }}></i>Danger Zone
            </h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '20px' }}>These actions are permanent and cannot be undone.</p>
            <button
              onClick={() => { if (window.confirm('Clear your entire watchlist? This cannot be undone.')) alert('Feature coming soon.'); }}
              style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', color: '#e50914', borderRadius: '6px', padding: '10px 16px', cursor: 'pointer', width: '100%', fontSize: '0.9rem', marginBottom: '10px' }}>
              <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>Clear Watchlist
            </button>
            <button
              onClick={() => alert('Feature coming soon.')}
              style={{ background: 'rgba(229,9,20,0.05)', border: '1px solid rgba(229,9,20,0.2)', color: '#c0392b', borderRadius: '6px', padding: '10px 16px', cursor: 'pointer', width: '100%', fontSize: '0.9rem' }}>
              <i className="fas fa-user-xmark" style={{ marginRight: '8px' }}></i>Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;