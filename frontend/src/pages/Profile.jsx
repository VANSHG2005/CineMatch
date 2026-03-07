import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi, watchlistApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import UserAvatar from '../components/UserAvatar';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setFormData({ name: user.name, email: user.email });
      fetchWatchlist();
    }
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const response = await authApi.updateProfile(formData);
      setUser(response.data.user);
      setSuccessMsg(response.data.message || 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while updating profile.');
    }
  };

  if (!user) return null;

  const recentWatchlist = watchlist.slice(0, 5); // Get top 5 recent

  return (
    <div className="genre-browse-container">
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginTop: '30px' }}>
        
        {/* Left Column: Profile Card */}
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
          <div className="auth-card" style={{ maxWidth: '100%', margin: '0' }}>
            <h1 className="auth-title">My Profile</h1>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <UserAvatar name={user.name} src={user.profile_pic} size="large" />
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMsg && <div style={{ background: 'rgba(0, 200, 83, 0.1)', color: '#00c853', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center' }}>{successMsg}</div>}

            {!isEditing ? (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <div style={{ padding: '12px', background: '#2a2a2a', borderRadius: '4px', fontSize: '1rem' }}>{user.name}</div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ padding: '12px', background: '#2a2a2a', borderRadius: '4px', fontSize: '1rem' }}>{user.email}</div>
                </div>
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                  <button className="btn-auth" onClick={() => setIsEditing(true)} style={{ background: '#333' }}>
                    Edit Profile
                  </button>
                  <button className="btn-auth" onClick={() => navigate('/watchlist')}>
                    View Watchlist
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
                </div>
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                  <button type="submit" className="btn-auth">Save Changes</button>
                  <button type="button" className="btn-auth" onClick={() => setIsEditing(false)} style={{ background: '#333' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Dashboard Stats & Recent */}
        <div style={{ flex: '2', minWidth: '300px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1' }}>{watchlist.length}</div>
              <div style={{ color: '#888', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Items in Watchlist</div>
            </div>
            <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#00c853', lineHeight: '1' }}>
                {watchlist.filter(i => i.item_type === 'movie').length}
              </div>
              <div style={{ color: '#888', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Movies Saved</div>
            </div>
            <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: '#2196f3', lineHeight: '1' }}>
                {watchlist.filter(i => i.item_type === 'tv').length}
              </div>
              <div style={{ color: '#888', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>TV Shows Saved</div>
            </div>
          </div>

          <h2 className="section-title">Recently Added to Watchlist</h2>
          {loading ? (
            <p>Loading...</p>
          ) : recentWatchlist.length > 0 ? (
            <div className="scrolling-row" style={{ paddingBottom: '20px' }}>
              {recentWatchlist.map(item => (
                <MovieCard 
                  key={item.id} 
                  item={{
                    id: item.item_id,
                    title: item.title,
                    poster_path: item.poster_path
                  }} 
                  type={item.item_type} 
                />
              ))}
            </div>
          ) : (
            <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#888', marginBottom: '20px' }}>Your watchlist is looking a little empty.</p>
              <button className="btn-auth" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => navigate('/')}>Discover Content</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
