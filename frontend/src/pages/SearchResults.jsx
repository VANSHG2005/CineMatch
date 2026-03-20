import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const SearchResults = () => {
  const [results, setResults] = useState({ movies: [], tv_shows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');
  const fetchQuery = useRef(null);

  useEffect(() => {
    if (!query || fetchQuery.current === query) return;
    fetchQuery.current = query;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await tmdbApi.search(query);
        setResults(response.data);
      } catch (err) {
        setError('Failed to fetch search results');
        console.error(err);
        fetchQuery.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  if (loading) return <div className="loading-spinner">Searching...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const hasResults = results.movies?.length > 0 || results.tv_shows?.length > 0;

  return (
    <div className="genre-browse-container">
      <h1 className="search-results-title">
        Search Results for <span className="search-query-text">"{query}"</span>
      </h1>

      {hasResults ? (
        <>
          {results.movies?.length > 0 && (
            <section style={{ marginBottom: '50px' }}>
              <h2 className="section-title">Movies</h2>
              <div className="content-grid">
                {results.movies.map(movie => (
                  <div key={movie.id} style={{ width: '100%' }}>
                    <MovieCard item={movie} type="movie" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.tv_shows?.length > 0 && (
            <section style={{ marginBottom: '50px' }}>
              <h2 className="section-title">TV Shows</h2>
              <div className="content-grid">
                {results.tv_shows.map(tv => (
                  <div key={tv.id} style={{ width: '100%' }}>
                    <MovieCard item={tv} type="tv" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>No Results Found</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>
            Sorry, we couldn't find any movies or TV shows matching "{query}".
          </p>
          <Link to="/" className="btn-signup" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 25px' }}>
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
