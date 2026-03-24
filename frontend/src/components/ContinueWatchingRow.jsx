import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { continueWatchingApi } from '../services/api';

const ContinueWatchingRow = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (!user) return;
    continueWatchingApi.getAll()
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };
  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    return () => el.removeEventListener('scroll', checkScroll);
  }, [items]);

  const handleRemove = async (e, showId) => {
    e.preventDefault(); e.stopPropagation();
    await continueWatchingApi.remove(showId);
    setItems(prev => prev.filter(i => i.show_id !== showId));
  };

  if (!user || loading || items.length === 0) return null;

  return (
    <section className="movies-section" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Continue Watching</h2>
        <span style={{ background: '#e50914', color: 'white', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {items.length} shows
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        {canScrollLeft && (
          <button className="scroll-arrow scroll-arrow-left" onClick={() => scroll('left')}>
            <i className="fas fa-chevron-left"></i>
          </button>
        )}

        <div className="scrolling-row" ref={rowRef}>
          {items.map(item => (
            <Link key={item.show_id} to={`/tv/${item.show_id}`} className="content-card continue-watching-card" style={{ width: '160px', textDecoration: 'none' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', borderRadius: '6px', overflow: 'hidden', background: '#1a1a1a' }}>
                {item.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.show_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-tv" style={{ fontSize: '2rem', color: '#444' }}></i>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(0,0,0,0.5)' }}>
                  <div style={{ height: '100%', width: `${item.progress}%`, background: '#e50914', transition: 'width 0.3s' }} />
                </div>

                {/* Episode badge */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.85)', color: 'white', fontSize: '0.68rem', fontWeight: '700', padding: '3px 7px', borderRadius: '4px' }}>
                  S{item.season_number}E{item.episode_number}
                </div>

                {/* Remove button */}
                <button onClick={(e) => handleRemove(e, item.show_id)}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#aaa', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Remove">
                  <i className="fas fa-xmark"></i>
                </button>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div className="content-title" style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '2px' }}>{item.show_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.episode_name || `Season ${item.season_number}, Ep ${item.episode_number}`}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#e50914', fontWeight: '600', marginTop: '2px' }}>
                  ▶ Continue · {Math.round(item.progress)}% watched
                </div>
              </div>
            </Link>
          ))}
        </div>

        {canScrollRight && (
          <button className="scroll-arrow scroll-arrow-right" onClick={() => scroll('right')}>
            <i className="fas fa-chevron-right"></i>
          </button>
        )}
      </div>
    </section>
  );
};

export default ContinueWatchingRow;
