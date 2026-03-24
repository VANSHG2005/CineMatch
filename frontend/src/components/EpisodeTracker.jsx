import { useState, useEffect } from 'react';
import { continueWatchingApi } from '../services/api';

const EpisodeTracker = ({ show, user }) => {
  const [tracking, setTracking] = useState(null);
  const [saving, setSaving] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  const seasons = show?.seasons?.filter(s => s.season_number > 0) || [];
  const currentSeason = seasons.find(s => s.season_number === season);
  const maxEpisodes = currentSeason?.episode_count || 24;

  useEffect(() => {
    if (!user) return;
    continueWatchingApi.getAll().then(r => {
      const found = (r.data || []).find(i => i.show_id === show.id);
      if (found) {
        setTracking(found);
        setSeason(found.season_number);
        setEpisode(found.episode_number);
        setProgress(found.progress);
      }
    }).catch(() => {});
  }, [user, show.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await continueWatchingApi.update({
        show_id: show.id,
        show_name: show.name,
        poster_path: show.poster_path,
        season_number: season,
        episode_number: episode,
        episode_name: `Episode ${episode}`,
        progress: progress
      });
      setTracking(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  const handleRemove = async () => {
    await continueWatchingApi.remove(show.id);
    setTracking(null);
    setProgress(0);
  };

  if (!user) return null;

  return (
    <div style={{ marginBottom: '20px' }}>
      {tracking ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Progress indicator */}
          <div style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
            <i className="fas fa-play-circle" style={{ color: '#e50914', fontSize: '1.2rem' }}></i>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                Watching S{tracking.season_number}E{tracking.episode_number}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{Math.round(tracking.progress)}% through episode</div>
            </div>
            {/* Mini progress bar */}
            <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px', minWidth: '60px' }}>
              <div style={{ height: '100%', width: `${tracking.progress}%`, background: '#e50914', borderRadius: '2px' }} />
            </div>
          </div>
          <button onClick={() => setOpen(o => !o)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 14px', color: 'var(--text-color)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            <i className="fas fa-pen" style={{ marginRight: '6px' }}></i>Update
          </button>
          <button onClick={handleRemove} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(o => !o)} className="btn-watchlist not-in-watchlist" style={{ fontSize: '0.88rem' }}>
          <i className="fas fa-play"></i>
          <span>Track Progress</span>
        </button>
      )}

      {/* Expanded tracker panel */}
      {open && (
        <div style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: 'var(--text-color)' }}>
            <i className="fas fa-bookmark" style={{ color: '#e50914', marginRight: '8px' }}></i>
            Update Watch Progress
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Season</label>
              <select value={season} onChange={e => { setSeason(Number(e.target.value)); setEpisode(1); }}
                className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }}>
                {seasons.length > 0
                  ? seasons.map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)
                  : Array.from({ length: show.number_of_seasons || 5 }, (_, i) => (
                    <option key={i+1} value={i+1}>Season {i+1}</option>
                  ))
                }
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Episode</label>
              <select value={episode} onChange={e => setEpisode(Number(e.target.value))}
                className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }}>
                {Array.from({ length: maxEpisodes }, (_, i) => (
                  <option key={i+1} value={i+1}>Episode {i+1}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Progress {Math.round(progress)}%</label>
              <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))}
                style={{ width: '100%', marginTop: '8px', accentColor: '#e50914' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave} disabled={saving} className="btn-auth" style={{ width: 'auto', padding: '8px 20px' }}>
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 16px', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeTracker;