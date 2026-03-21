import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/api';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch { /* silent fail */ }
  };

  useEffect(() => {
    if (!user) return;
    const load = () => { fetchNotifications(); };
    load();
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      await notificationsApi.markRead(notif.id);
      setNotifications(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x));
      setUnread(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const iconMap = {
    new_season: 'fa-tv',
    new_follower: 'fa-user-plus',
    friend_watchlist: 'fa-bookmark',
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="notification-bell-btn"
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unread > 0 && (
          <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="notif-mark-all">Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              <i className="fas fa-bell-slash"></i>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-icon">
                    <i className={`fas ${iconMap[n.type] || 'fa-bell'}`}></i>
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-text">{n.body}</div>
                    <div className="notif-time">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {!n.read && <div className="notif-dot"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;