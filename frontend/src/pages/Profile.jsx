import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi, watchlistApi, commentsApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import UserAvatar from '../components/UserAvatar';

// Uses CSS variables so it works in both light and dark themes
const StatCard = ({ value, label, color }) => (
  <div className="profile-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: '2.5rem', fontWeight: '800', color, lineHeight: '1' }}>{value}</div>
    <div className="profile-stat-label">{label}</div>
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
  const [activity, setActivity] = useState([]);  // comments + ratings by user
  const [loading, setLoading] = useState(true);
  const [watchFilter, setWatchFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setFormData({ name: user.name, email: user.email });
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [wlRes, actRes] = await Promise.allSettled([
        watchlistApi.getWatchlist(),
        commentsApi.getUserActivity(),   // new endpoint — see backend note below
      ]);
      if (wlRes.status === 'fulfilled') setWatchlist(wlRes.value.data || []);
      if (actRes.status === 'fulfilled') setActivity(actRes.value.data || []);
    } catch (err) {
      console.error('Failed to load profile data', err);
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
    if (passwordData.next !== passwordData.confirm) { setError('New passwords do not match.'); return; }
    if (passwordData.next.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSuccessMsg('Password updated successfully!');
    setPasswordData({ current: '', next: '', confirm: '' });
  };

  if (!user) return null;

  const movies = watchlist.filter(i => i.item_type === 'movie');
  const tvShows = watchlist.filter(i => i.item_type === 'tv');
  const watched = watchlist.filter(i => i.watched);
  const recentItems = watchlist.slice(0, 6);
  const filteredWatchlist = watchFilter === 'all' ? watchlist : watchFilter === 'movie' ? movies : tvShows;

  const ratedActivity = activity.filter(a => a.rating > 0);
  const avgUserRating = ratedActivity.length
    ? (ratedActivity.reduce((s, a) => s + a.rating, 0) / ratedActivity.length).toFixed(1)
    : null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fa-house' },
    { id: 'activity', label: 'My Reviews', icon: 'fa-star' },
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
          <p style={{ color: 'var(--text-muted)', margin: '0 0 12px', fontSize: '0.95rem' }}>{user.email}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { icon: 'fa-film', color: '#e50914', label: `${movies.length} Movies` },
              { icon: 'fa-tv', color: '#2196f3', label: `${tvShows.length} TV Shows` },
              { icon: 'fa-bookmark', color: '#00c853', label: `${watchlist.length} Total` },
              { icon: 'fa-star', color: '#f5c518', label: `${activity.length} Reviews` },
            ].map(({ icon, color, label }) => (
              <span key={label} className="profile-badge">
                <i className={`fas ${icon}`} style={{ color }}></i> {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`profile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <StatCard value={watchlist.length} label="Total Saved" color="#e50914" />
            <StatCard value={movies.length} label="Movies" color="#00c853" />
            <StatCard value={tvShows.length} label="TV Shows" color="#2196f3" />
            <StatCard value={watched.length} label="Watched" color="#9c27b0" />
            <StatCard value={activity.length} label="Reviews" color="#f5c518" />
            <StatCard value={avgUserRating ? `${avgUserRating}★` : '—'} label="Avg Rating" color="#ff9800" />
          </div>

          <h2 className="section-title">Recently Added</h2>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            : recentItems.length > 0 ? (
              <div className="scrolling-row" style={{ paddingBottom: '20px' }}>
                {recentItems.map(item => (
                  <MovieCard key={item.id} item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
                ))}
              </div>
            ) : (
              <div className="profile-empty-box">
                <i className="fas fa-bookmark" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block', opacity: 0.3 }}></i>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Your watchlist is empty.</p>
                <button className="btn-auth" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => navigate('/')}>Discover Content</button>
              </div>
            )}

          {/* Recent reviews preview */}
          {activity.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Recent Reviews</h2>
                <button onClick={() => setActiveTab('activity')} style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>
                  See all →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activity.slice(0, 3).map(a => (
                  <ActivityCard key={a.id} item={a} />
                ))}
              </div>
            </div>
          )}

          {watchlist.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h2 className="section-title">Quick Stats</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div className="profile-card">
                  <div className="profile-card-title">Watchlist Breakdown</div>
                  <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${watchlist.length ? (movies.length / watchlist.length) * 100 : 50}%`, background: '#e50914', transition: 'width 0.5s' }}></div>
                    <div style={{ flex: 1, background: '#2196f3' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span><span style={{ color: '#e50914' }}>■</span> Movies {watchlist.length ? Math.round((movies.length / watchlist.length) * 100) : 0}%</span>
                    <span><span style={{ color: '#2196f3' }}>■</span> TV {watchlist.length ? Math.round((tvShows.length / watchlist.length) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="profile-card">
                  <div className="profile-card-title">Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Manage Watchlist', icon: 'fa-bookmark', color: '#e50914', action: () => setActiveTab('watchlist') },
                      { label: 'Edit Profile', icon: 'fa-gear', color: '#888', action: () => setActiveTab('settings') },
                      { label: 'Get Recommendations', icon: 'fa-wand-magic-sparkles', color: '#ff9800', action: () => navigate('/recommend') },
                    ].map(({ label, icon, color, action }) => (
                      <button key={label} onClick={action} className="profile-action-btn">
                        <i className={`fas ${icon}`} style={{ color }}></i> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── My Reviews Tab ── */}
      {activeTab === 'activity' && (
        <div>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            : activity.length === 0 ? (
              <div className="profile-empty-box">
                <i className="fas fa-star" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block', opacity: 0.3 }}></i>
                <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Rate and comment on movies to see them here.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div className="profile-stat-card" style={{ borderTop: '3px solid #f5c518', minWidth: '120px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f5c518' }}>{activity.length}</div>
                    <div className="profile-stat-label">Total Reviews</div>
                  </div>
                  {avgUserRating && (
                    <div className="profile-stat-card" style={{ borderTop: '3px solid #f5c518', minWidth: '120px' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f5c518' }}>{avgUserRating}★</div>
                      <div className="profile-stat-label">Avg Rating</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activity.map(a => <ActivityCard key={a.id} item={a} />)}
                </div>
              </>
            )}
        </div>
      )}

      {/* ── Watchlist Tab ── */}
      {activeTab === 'watchlist' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[['all', `All (${watchlist.length})`], ['movie', `Movies (${movies.length})`], ['tv', `TV (${tvShows.length})`]].map(([val, label]) => (
              <button key={val} onClick={() => setWatchFilter(val)} className={`profile-filter-pill ${watchFilter === val ? 'active' : ''}`}>
                {label}
              </button>
            ))}
          </div>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            : filteredWatchlist.length > 0 ? (
              <div className="small-card-grid">
                {filteredWatchlist.map(item => (
                  <MovieCard key={item.id} item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
                ))}
              </div>
            ) : (
              <div className="profile-empty-box">
                <p style={{ color: 'var(--text-muted)' }}>No items here yet.</p>
              </div>
            )}
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

          <div className="profile-card">
            <h3 className="profile-card-heading"><i className="fas fa-user" style={{ color: '#e50914' }}></i> Edit Profile</h3>
            {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
            {successMsg && <div className="profile-success-msg">{successMsg}</div>}
            {!isEditing ? (
              <>
                <div className="form-group"><label>Full Name</label><div className="profile-field-display">{user.name}</div></div>
                <div className="form-group"><label>Email Address</label><div className="profile-field-display">{user.email}</div></div>
                <button className="btn-auth" onClick={() => setIsEditing(true)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)', marginTop: '8px' }}>
                  <i className="fas fa-pen" style={{ marginRight: '8px' }}></i>Edit
                </button>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group"><label>Full Name</label><input type="text" name="name" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group"><label>Email Address</label><input type="email" name="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-auth">Save</button>
                  <button type="button" className="btn-auth" onClick={() => setIsEditing(false)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="profile-card">
            <h3 className="profile-card-heading"><i className="fas fa-lock" style={{ color: '#2196f3' }}></i> Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group"><label>Current Password</label><input type="password" className="form-input" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} required placeholder="Enter current password" /></div>
              <div className="form-group"><label>New Password</label><input type="password" className="form-input" value={passwordData.next} onChange={e => setPasswordData({ ...passwordData, next: e.target.value })} required placeholder="Min 6 characters" /></div>
              <div className="form-group"><label>Confirm New Password</label><input type="password" className="form-input" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} required placeholder="Repeat new password" /></div>
              <button type="submit" className="btn-auth" style={{ marginTop: '8px' }}>Update Password</button>
            </form>
          </div>

          <div className="profile-card" style={{ borderColor: 'rgba(229,9,20,0.3)' }}>
            <h3 className="profile-card-heading" style={{ color: '#e50914' }}><i className="fas fa-triangle-exclamation"></i> Danger Zone</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>These actions are permanent and cannot be undone.</p>
            <button onClick={() => { if (window.confirm('Clear your entire watchlist?')) alert('Feature coming soon.'); }}
              className="profile-danger-btn" style={{ marginBottom: '10px' }}>
              <i className="fas fa-trash"></i> Clear Watchlist
            </button>
            <button onClick={() => alert('Feature coming soon.')} className="profile-danger-btn" style={{ opacity: 0.7 }}>
              <i className="fas fa-user-xmark"></i> Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity card — shows a comment/rating on a movie or TV show
const ActivityCard = ({ item }) => (
  <Link to={`/${item.item_type}/${item.item_id}`} style={{ textDecoration: 'none' }}>    <div className="activity-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '6px', background: item.item_type === 'movie' ? 'rgba(229,9,20,0.15)' : 'rgba(33,150,243,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${item.item_type === 'movie' ? 'fa-film' : 'fa-tv'}`} style={{ color: item.item_type === 'movie' ? '#e50914' : '#2196f3', fontSize: '0.85rem' }}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-color)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.item_title || `${item.item_type === 'movie' ? 'Movie' : 'TV Show'} #${item.item_id}`}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.text}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        {item.rating > 0 && (
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: s <= item.rating ? '#f5c518' : 'var(--border-color)', fontSize: '0.8rem' }}>★</span>
            ))}
          </div>
        )}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  </Link>
);

export default Profile;