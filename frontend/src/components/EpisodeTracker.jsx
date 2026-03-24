import { useState, useEffect } from 'react';
import { api } from '../services/api';

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="progress-container" style={{ margin: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
        <span>Progress</span>
        <span>{current} / {total} Episodes ({percentage}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            background: 'var(--primary-color)', 
            borderRadius: '4px',
            transition: 'width 0.4s ease'
          }} 
        />
      </div>
    </div>
  );
};

const EpisodeItem = ({ episode, isWatched, onToggle }) => {
  return (
    <div 
      className="episode-item"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '12px 16px', 
        background: isWatched ? 'rgba(229,9,20,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isWatched ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '8px',
        marginBottom: '8px',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ marginRight: '16px', color: 'var(--primary-color)', fontWeight: 'bold', width: '30px' }}>
        {episode.episode_number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{episode.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>{episode.air_date}</div>
      </div>
      <button 
        onClick={() => onToggle(episode.episode_number, !isWatched)}
        style={{ 
          background: isWatched ? 'var(--primary-color)' : 'transparent',
          border: `2px solid ${isWatched ? 'var(--primary-color)' : '#444'}`,
          color: isWatched ? 'white' : '#888',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        {isWatched ? <i className="fas fa-check"></i> : <i className="fas fa-plus"></i>}
      </button>
    </div>
  );
};

const SeasonAccordion = ({ season, showId, watchedEpisodes, onToggleEpisode, onMarkSeason }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const seasonWatchedCount = watchedEpisodes.filter(e => e.season_number === season.season_number).length;
  const isFullyWatched = seasonDetails && seasonWatchedCount >= seasonDetails.episodes.length;

  useEffect(() => {
    if (isOpen && !seasonDetails) {
      fetchSeasonDetails();
    }
  }, [isOpen]);

  const fetchSeasonDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tv/season/${showId}/${season.season_number}`);
      setSeasonDetails(response.data);
    } catch (err) {
      console.error("Error fetching season details:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '16px 20px', 
          background: 'var(--card-bg)', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{season.name}</div>
          <div style={{ fontSize: '0.85rem', color: '#888' }}>
            {seasonWatchedCount} / {season.episode_count} watched
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (seasonDetails) onMarkSeason(season.season_number, seasonDetails.episodes.map(ep => ep.episode_number));
            }}
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--primary-color)', 
              color: 'var(--primary-color)',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: isFullyWatched ? 0.5 : 1
            }}
          >
            Mark Season
          </button>
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: '#666' }}></i>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-color)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: 'var(--primary-color)' }}></i>
            </div>
          ) : seasonDetails ? (
            <div className="episodes-list">
              {seasonDetails.episodes.map(ep => (
                <EpisodeItem 
                  key={ep.id} 
                  episode={ep} 
                  isWatched={watchedEpisodes.some(we => we.season_number === season.season_number && we.episode_number === ep.episode_number)}
                  onToggle={(epNum, watched) => onToggleEpisode(season.season_number, epNum, watched)}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: '#888', textAlign: 'center' }}>Failed to load episodes.</p>
          )}
        </div>
      )}
    </div>
  );
};

const EpisodeTracker = ({ show, user }) => {
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && show) {
      fetchProgress();
    }
  }, [show.id, user]);

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/shows/${show.id}/progress`);
      setWatchedEpisodes(response.data);
    } catch (err) {
      console.error("Error fetching progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEpisode = async (seasonNum, epNum, watched) => {
    if (!user) return alert('Please log in to track episodes');
    
    // Optimistic UI
    const original = [...watchedEpisodes];
    if (watched) {
      setWatchedEpisodes([...watchedEpisodes, { season_number: seasonNum, episode_number: epNum }]);
    } else {
      setWatchedEpisodes(watchedEpisodes.filter(e => !(e.season_number === seasonNum && e.episode_number === epNum)));
    }

    try {
      if (watched) {
        await api.post('/episodes/mark-watched', { 
          show_id: show.id, 
          season_number: seasonNum, 
          episode_number: epNum 
        });
      } else {
        await api.post('/episodes/mark-unwatched', { 
          show_id: show.id, 
          season_number: seasonNum, 
          episode_number: epNum 
        });
      }
    } catch (err) {
      setWatchedEpisodes(original);
      alert('Failed to update progress');
    }
  };

  const handleMarkSeason = async (seasonNum, epNums) => {
    if (!user) return alert('Please log in to track episodes');
    
    const newWatched = epNums.map(epNum => ({ season_number: seasonNum, episode_number: epNum }));
    const filtered = watchedEpisodes.filter(e => e.season_number !== seasonNum);
    setWatchedEpisodes([...filtered, ...newWatched]);

    try {
      await api.post('/season/mark-all', {
        show_id: show.id,
        season_number: seasonNum,
        episodes: epNums
      });
    } catch (err) {
      fetchProgress();
      alert('Failed to update progress');
    }
  };

  const handleMarkAll = async () => {
    if (!user) return alert('Please log in to track episodes');
    if (!window.confirm('Mark all episodes as watched?')) return;

    try {
      const seasonsData = show.seasons.map(s => ({
        season_number: s.season_number,
        episodes: Array.from({ length: s.episode_count }, (_, i) => i + 1)
      }));

      await api.post('/show/mark-all', {
        show_id: show.id,
        seasons: seasonsData
      });
      fetchProgress();
    } catch (err) {
      alert('Failed to update progress');
    }
  };

  if (!show || !show.seasons) return null;

  const totalEpisodes = show.seasons.reduce((acc, s) => acc + (s.season_number > 0 ? s.episode_count : 0), 0);
  const watchedCount = watchedEpisodes.length;

  return (
    <div className="episode-tracker" style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Episode Tracking</h2>
        {user && (
          <button 
            onClick={handleMarkAll}
            className="btn-auth"
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Mark All as Watched
          </button>
        )}
      </div>

      <ProgressBar current={watchedCount} total={totalEpisodes} />

      <div className="seasons-container" style={{ marginTop: '25px' }}>
        {show.seasons
          .filter(s => s.season_number > 0)
          .map(season => (
            <SeasonAccordion 
              key={season.id} 
              season={season} 
              showId={show.id}
              watchedEpisodes={watchedEpisodes}
              onToggleEpisode={handleToggleEpisode}
              onMarkSeason={handleMarkSeason}
            />
          ))}
      </div>
    </div>
  );
};

export default EpisodeTracker;
