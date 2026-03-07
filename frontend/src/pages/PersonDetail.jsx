import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tmdbApi } from '../services/api';

const PersonDetail = () => {
  const { id } = useParams();
  const [personData, setPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const imgUrl = 'https://image.tmdb.org/t/p/w500';
  const fetchId = useRef(null);

  useEffect(() => {
    if (fetchId.current === id) return;
    fetchId.current = id;
    
    const fetchPersonDetail = async () => {
      setLoading(true);
      try {
        const response = await tmdbApi.getPersonDetail(id);
        setPersonData(response.data);
      } catch (err) {
        setError('Failed to load person details');
        console.error(err);
        fetchId.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchPersonDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const handleImageLoad = (imgId) => {
    setLoadedImages(prev => ({ ...prev, [imgId]: true }));
  };

  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div className="loading-spinner">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!personData) return null;

  const { details, credits, known_for } = personData;

  return (
    <div className="container" style={{ padding: '40px 4%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="person-header" style={{ display: 'flex', gap: '40px', marginBottom: '50px', flexWrap: 'wrap' }}>
        <div className="person-photo" style={{ flex: '0 0 300px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
            {!loadedImages['profile'] && <div className="skeleton skeleton-rect" style={{ position: 'absolute', top: 0, left: 0 }}></div>}
            <img 
              src={`${imgUrl}${details.profile_path}`} 
              alt={details.name} 
              className={`poster-image ${loadedImages['profile'] ? 'loaded' : ''}`}
              style={{ width: '100%' }}
              onLoad={() => handleImageLoad('profile')}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; }}
            />
          </div>
        </div>
        <div className="person-info" style={{ flex: '1', minWidth: '300px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{details.name}</h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Biography</h2>
          <p style={{ lineHeight: '1.6', fontSize: '1.05rem', color: '#ccc', marginBottom: '30px' }}>
            {details.biography || 'Biography not available'}
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Known For</h3>
          <div className="scrolling-row">
            {known_for?.map(item => (
              <Link 
                to={item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`} 
                key={item.id} 
                className="content-card" 
                style={{ width: '130px' }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
                  {!loadedImages[`known-${item.id}`] && <div className="skeleton skeleton-rect" style={{ position: 'absolute', top: 0, left: 0 }}></div>}
                  <img 
                    src={`${imgUrl}${item.poster_path}`} 
                    alt={item.title || item.name} 
                    className={`poster-image ${loadedImages[`known-${item.id}`] ? 'loaded' : ''}`}
                    onLoad={() => handleImageLoad(`known-${item.id}`)}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/130x195?text=No+Poster'; }}
                  />
                </div>
                <div className="content-title" style={{ fontSize: '0.8rem' }}>{item.title || item.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '50px' }}>
        <div className="personal-info">
          <h2 className="section-title">Personal Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Known For</div>
              <div style={{ color: '#aaa' }}>{details.known_for_department || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Gender</div>
              <div style={{ color: '#aaa' }}>{details.gender === 1 ? 'Female' : details.gender === 2 ? 'Male' : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Birthday</div>
              <div style={{ color: '#aaa' }}>
                {details.birthday || 'N/A'} 
                {details.birthday && ` (${calculateAge(details.birthday)} years old)`}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Place of Birth</div>
              <div style={{ color: '#aaa' }}>{details.place_of_birth || 'N/A'}</div>
            </div>
          </div>
          
          {details.also_known_as && details.also_known_as.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>Also Known As</div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{details.also_known_as.join(', ')}</div>
            </div>
          )}
        </div>

        <div className="acting-credits">
          <h2 className="section-title">Acting Credits</h2>
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
            {credits?.cast?.sort((a, b) => {
              const dateA = a.release_date || a.first_air_date || '0';
              const dateB = b.release_date || b.first_air_date || '0';
              return dateB.localeCompare(dateA);
            }).map((credit, index) => (
              <div 
                key={`${credit.id}-${index}`} 
                style={{ display: 'flex', gap: '15px', padding: '10px 0', borderBottom: '1px solid #222' }}
              >
                <div style={{ minWidth: '50px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  {(credit.release_date || credit.first_air_date)?.substring(0, 4) || '—'}
                </div>
                <div>
                  <Link 
                    to={credit.media_type === 'movie' ? `/movie/${credit.id}` : `/tv/${credit.id}`}
                    style={{ textDecoration: 'none', color: 'white', fontWeight: '500' }}
                  >
                    {credit.title || credit.name}
                  </Link>
                  {credit.character && (
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>as {credit.character}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;
