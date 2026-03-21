import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { friendsApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import UserAvatar from '../components/UserAvatar';

const FriendsPage = ({ user }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('following');
  const [friends, setFriends] = useState({ following: [], followers: [] });
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendWatchlist, setFriendWatchlist] = useState([]);
  const [watchlistFilter, setWatchlistFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchFriends();
  }, [user, navigate]);

  const fetchFriends = async () => {
    try {
      const res = await friendsApi.getFriends();
      setFriends(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (q) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await friendsApi.searchUsers(q);
        setSearchResults(res.data);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const follow = async (userId) => {
    await friendsApi.follow(userId);
    setSearchResults(r => r.map(u => u.id === userId ? { ...u, is_following: true } : u));
    fetchFriends();
  };

  const unfollow = async (userId) => {
    await friendsApi.unfollow(userId);
    setFriends(f => ({ ...f, following: f.following.filter(u => u.id !== userId) }));
    setSearchResults(r => r.map(u => u.id === userId ? { ...u, is_following: false } : u));
    if (selectedFriend?.id === userId) { setSelectedFriend(null); setFriendWatchlist([]); }
  };

  const viewWatchlist = async (friend) => {
    setSelectedFriend(friend);
    setWatchlistFilter('all');
    try {
      const res = await friendsApi.getFriendWatchlist(friend.id);
      setFriendWatchlist(res.data.watchlist || []);
    } catch (e) {
      alert(e.response?.data?.error || 'Could not load watchlist.');
      setFriendWatchlist([]);
    }
  };

  if (!user) return null;

  const isMutual = (friendId) =>
    friends.following.some(f => f.id === friendId) &&
    friends.followers.some(f => f.id === friendId);

  const filteredWL = watchlistFilter === 'all' ? friendWatchlist
    : friendWatchlist.filter(i => i.item_type === watchlistFilter);

  return (
    <div className="genre-browse-container" style={{ paddingTop: '30px' }}>
      <h1 className="section-title">Friends</h1>

      {/* Search bar */}
      <div className="friends-search-box">
        <i className="fas fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQ}
          onChange={e => handleSearch(e.target.value)}
          className="friends-search-input"
        />
        {searching && <i className="fas fa-spinner fa-spin" style={{ color: 'var(--text-muted)' }}></i>}
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="friends-search-results">
          {searchResults.map(u => (
            <div key={u.id} className="friend-result-row">
              <UserAvatar name={u.name} src={u.profile_pic} size="small" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: 'var(--text-color)' }}>{u.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
              {u.is_following ? (
                <button onClick={() => unfollow(u.id)} className="friend-btn unfollow-btn">Unfollow</button>
              ) : (
                <button onClick={() => follow(u.id)} className="friend-btn follow-btn">Follow</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs" style={{ marginTop: '24px' }}>
        {[
          ['following', `Following (${friends.following.length})`],
          ['followers', `Followers (${friends.followers.length})`],
          ...(selectedFriend ? [['watchlist', `${selectedFriend.name}'s Watchlist`]] : []),
        ].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`profile-tab-btn ${tab === val ? 'active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <>
          {/* Following list */}
          {tab === 'following' && (
            friends.following.length === 0 ? (
              <div className="profile-empty-box">
                <i className="fas fa-user-group" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: '12px' }}></i>
                <p style={{ color: 'var(--text-muted)' }}>You're not following anyone yet. Search above to find friends!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {friends.following.map(f => (
                  <div key={f.id} className="friend-card">
                    <UserAvatar name={f.name} src={f.profile_pic} size="small" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-color)' }}>{f.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {isMutual(f.id) ? '🤝 Mutual friend' : 'Following'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isMutual(f.id) && (
                        <button onClick={() => { viewWatchlist(f); setTab('watchlist'); }} className="friend-btn follow-btn">
                          <i className="fas fa-bookmark"></i> Watchlist
                        </button>
                      )}
                      <button onClick={() => unfollow(f.id)} className="friend-btn unfollow-btn">Unfollow</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Followers list */}
          {tab === 'followers' && (
            friends.followers.length === 0 ? (
              <div className="profile-empty-box">
                <p style={{ color: 'var(--text-muted)' }}>No followers yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {friends.followers.map(f => (
                  <div key={f.id} className="friend-card">
                    <UserAvatar name={f.name} src={f.profile_pic} size="small" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-color)' }}>{f.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {isMutual(f.id) ? '🤝 Mutual friend' : 'Follows you'}
                      </div>
                    </div>
                    {!friends.following.some(u => u.id === f.id) && (
                      <button onClick={() => follow(f.id)} className="friend-btn follow-btn">Follow back</button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Friend's watchlist */}
          {tab === 'watchlist' && selectedFriend && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV Shows']].map(([val, label]) => (
                  <button key={val} onClick={() => setWatchlistFilter(val)}
                    className={`profile-filter-pill ${watchlistFilter === val ? 'active' : ''}`}>
                    {label} ({val === 'all' ? friendWatchlist.length : friendWatchlist.filter(i => i.item_type === val).length})
                  </button>
                ))}
              </div>
              {filteredWL.length === 0 ? (
                <div className="profile-empty-box">
                  <p style={{ color: 'var(--text-muted)' }}>Nothing here yet.</p>
                </div>
              ) : (
                <div className="small-card-grid">
                  {filteredWL.map(item => (
                    <MovieCard key={item.id} item={{ id: item.item_id, title: item.title, poster_path: item.poster_path }} type={item.item_type} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FriendsPage;