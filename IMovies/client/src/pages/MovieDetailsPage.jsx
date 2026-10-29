import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieService } from '../services/movieService.js';
import { showService } from '../services/showService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { TrailerModal } from '../components/movies/TrailerModal.jsx';
import {
  Star,
  Clock,
  Calendar,
  Play,
  MapPin,
  Ticket,
  Clapperboard,
  Tv,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Generate next 4 dates for date selector tabs
  const availableDates = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dateStr, dayLabel, formatted };
  });

  useEffect(() => {
    const fetchMovieAndShows = async () => {
      try {
        setLoading(true);
        const movieRes = await movieService.getMovieById(id);
        const movieData = movieRes.data;
        setMovie(movieData);

        // Fetch shows for this movie on the selected date
        const showsRes = await showService.getShows({
          movieId: movieData._id,
          date: selectedDate
        });
        setShows(showsRes.data || []);
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieAndShows();
  }, [id, selectedDate]);

  if (loading && !movie) {
    return <LoadingSpinner message="Loading movie details and showtimes..." />;
  }

  if (!movie) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
        <h2 className="font-display fw-bold text-white">Movie not found</h2>
        <p className="text-muted small">The requested title could not be retrieved from the catalog.</p>
        <Link to="/movies" className="stitch-btn-primary mt-3 px-4 py-2 text-decoration-none">
          Back to Movies
        </Link>
      </div>
    );
  }

  // Group shows by Theatre
  const showsByTheatre = {};
  for (const show of shows) {
    const theatreName = show.theatre?.name || 'Multiplex Cinema';
    if (!showsByTheatre[theatreName]) {
      showsByTheatre[theatreName] = {
        theatre: show.theatre || null,
        shows: []
      };
    }
    showsByTheatre[theatreName].shows.push(show);
  }

  const hasRating = typeof movie.rating === 'number' && movie.rating > 0;

  return (
    <div style={{ background: 'var(--imv-canvas)', minHeight: '100vh' }}>
      {/* 1. Backdrop Hero Banner with Scrim (Stitch Screen 3 Spec) */}
      <div
        className="position-relative w-100 overflow-hidden py-5"
        style={{
          backgroundColor: 'var(--imv-surface-0)',
          borderBottom: '1px solid var(--imv-border)'
        }}
      >
        {/* Backdrop Image */}
        <div
          className="position-absolute inset-0 w-100 h-100"
          style={{
            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.38,
            filter: 'blur(3px)'
          }}
        />

        {/* Multi-layered Scrim Overlays */}
        <div
          className="position-absolute inset-0 w-100 h-100"
          style={{
            background: 'linear-gradient(to top, #0B0C10 0%, rgba(11, 12, 16, 0.85) 60%, rgba(11, 12, 16, 0.95) 100%)'
          }}
        />
        <div
          className="position-absolute inset-0 w-100 h-100"
          style={{
            background: 'linear-gradient(to right, #0B0C10 0%, rgba(11, 12, 16, 0.7) 50%, transparent 100%)'
          }}
        />

        {/* Content Container */}
        <div className="container-xl position-relative z-1 py-4">
          <div className="row g-4 align-items-start">
            {/* Left: Poster Column with Badges */}
            <div className="col-lg-4 col-xl-3 text-center text-lg-start">
              <div
                className="position-relative rounded-4 overflow-hidden shadow-2xl mx-auto"
                style={{
                  maxWidth: '300px',
                  aspectRatio: '2 / 3',
                  border: '1px solid var(--imv-border)',
                  backgroundColor: 'var(--imv-surface-1)'
                }}
              >
                {/* Floating format badges */}
                <div className="position-absolute top-0 start-0 m-3 d-flex align-items-center gap-1 z-2">
                  <span
                    className="px-2.5 py-1 rounded label-caps fw-bold"
                    style={{
                      background: 'rgba(11, 12, 16, 0.85)',
                      color: 'var(--imv-gold)',
                      border: '1px solid rgba(212, 175, 55, 0.4)'
                    }}
                  >
                    IMAX Laser
                  </span>
                </div>
                <div className="position-absolute top-0 end-0 m-3 z-2">
                  <span
                    className="px-2 py-0.5 rounded label-caps fw-bold"
                    style={{
                      background: 'var(--imv-primary)',
                      color: '#fff',
                      boxShadow: '0 0 12px rgba(229, 9, 20, 0.5)'
                    }}
                  >
                    4K HDR
                  </span>
                </div>

                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22450%22%20fill%3D%22%2313151b%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23545b6e%22%20text-anchor%3D%22middle%22%20font-size%3D%2214%22%3EIMOVIES%20PREMIERE%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />

                {/* Poster Footbar Micro-metric */}
                <div
                  className="position-absolute bottom-0 start-0 end-0 px-3 py-2 d-flex align-items-center justify-content-between label-caps z-2"
                  style={{
                    background: 'rgba(19, 21, 27, 0.95)',
                    borderTop: '1px solid var(--imv-border)',
                    color: 'var(--imv-text-muted)',
                    fontSize: '10px'
                  }}
                >
                  <span style={{ color: 'var(--imv-gold)' }}>Ultra AVX & 3D</span>
                  <span>Hall 01 Premiere</span>
                </div>
              </div>
            </div>

            {/* Right: Primary Metadata & Details */}
            <div className="col-lg-8 col-xl-9">
              {/* Breadcrumb */}
              <div className="d-flex align-items-center gap-2 label-caps mb-2 text-muted" style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--imv-primary)' }}>Now Showing</span>
                <span>/</span>
                <span>Exclusive Theatrical Run</span>
                <span>/</span>
                <span style={{ color: 'var(--imv-gold)' }}>Dual Laser Experience</span>
              </div>

              {/* Title */}
              <h1
                className="font-display display-4 fw-extrabold text-white text-uppercase mb-2"
                style={{ letterSpacing: '-0.02em', lineHeight: '1.05' }}
              >
                {movie.title}
              </h1>

              {movie.director && (
                <p className="lead mb-3" style={{ color: 'var(--imv-gold)', fontSize: '1.05rem', fontStyle: 'italic' }}>
                  Directed by {movie.director}
                </p>
              )}

              {/* Metadata Chips Row */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
                {movie.certification && (
                  <span
                    className="px-2.5 py-1 rounded label-caps fw-bold"
                    style={{ background: 'var(--imv-surface-container-high)', color: '#fff' }}
                  >
                    {movie.certification}
                  </span>
                )}
                {movie.duration && (
                  <span
                    className="d-flex align-items-center gap-1 px-2.5 py-1 rounded label-caps"
                    style={{ background: 'var(--imv-surface-container)', color: 'var(--imv-text-med)' }}
                  >
                    <Clock size={13} style={{ color: 'var(--imv-primary)' }} />
                    <span>{movie.duration} MIN</span>
                  </span>
                )}
                <span
                  className="px-2.5 py-1 rounded label-caps"
                  style={{ background: 'var(--imv-surface-container)', color: 'var(--imv-text-muted)' }}
                >
                  {(movie.genres || []).join(' / ')}
                </span>
                {movie.releaseDate && (
                  <span
                    className="px-2.5 py-1 rounded label-caps"
                    style={{ background: 'var(--imv-surface-container)', color: 'var(--imv-text-muted)' }}
                  >
                    Released {new Date(movie.releaseDate).toLocaleDateString()}
                  </span>
                )}
                <span
                  className="px-2.5 py-1 rounded label-caps fw-bold"
                  style={{
                    background: 'rgba(212, 175, 55, 0.15)',
                    color: 'var(--imv-gold)',
                    border: '1px solid rgba(212, 175, 55, 0.3)'
                  }}
                >
                  Dolby Atmos & IMAX
                </span>
              </div>

              {/* Score Cards Mosaic (Stitch Spec) */}
              {hasRating && (
                <div className="row g-3 mb-4" style={{ maxWidth: '520px' }}>
                  <div className="col-6">
                    <div
                      className="p-3 rounded-3 d-flex align-items-center gap-3"
                      style={{
                        background: 'var(--imv-surface-container)',
                        border: '1px solid var(--imv-border)'
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center p-2"
                        style={{ background: 'rgba(229, 9, 20, 0.15)', color: 'var(--imv-primary)' }}
                      >
                        <Flame size={24} />
                      </div>
                      <div>
                        <div className="font-display fs-4 fw-bold text-white leading-none">
                          {Math.round(movie.rating * 10)}%
                        </div>
                        <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                          CRITIC CONSENSUS
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div
                      className="p-3 rounded-3 d-flex align-items-center gap-3"
                      style={{
                        background: 'var(--imv-surface-container)',
                        border: '1px solid var(--imv-border)'
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center p-2"
                        style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--imv-gold)' }}
                      >
                        <Star size={24} className="fill-warning text-warning" />
                      </div>
                      <div>
                        <div className="font-display fs-4 fw-bold text-white leading-none">
                          {movie.rating.toFixed(1)} <span className="small text-muted" style={{ fontSize: '12px' }}>/ 10</span>
                        </div>
                        <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                          AUDIENCE SCORE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Synopsis */}
              <p
                className="lead mb-4"
                style={{ color: 'var(--imv-text-med)', maxWidth: '820px', fontSize: '1.05rem', lineHeight: '1.7' }}
              >
                {movie.synopsis}
              </p>

              {/* Starring / Cast Section */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="mb-4">
                  <span className="label-caps d-block mb-2" style={{ color: 'var(--imv-text-muted)' }}>
                    FEATURED CAST
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {movie.cast.map((actor, idx) => (
                      <div
                        key={idx}
                        className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3"
                        style={{
                          background: 'var(--imv-surface-container)',
                          border: '1px solid var(--imv-border)'
                        }}
                      >
                        {actor.avatar && (
                          <img
                            src={actor.avatar}
                            alt={actor.name}
                            className="rounded-circle"
                            style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <span className="small fw-bold text-white d-block leading-tight">
                            {actor.name}
                          </span>
                          {actor.role && (
                            <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '9px' }}>
                              {actor.role}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="d-flex align-items-center gap-3">
                {movie.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setIsTrailerOpen(true)}
                    className="stitch-btn-secondary px-4 py-2.5"
                    style={{ fontSize: '0.95rem' }}
                  >
                    <Play size={18} style={{ color: 'var(--imv-primary)' }} />
                    <span>Watch Official Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Showtimes & Auditoriums Section */}
      <div className="container-xl py-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="label-caps fw-bold" style={{ color: 'var(--imv-primary)' }}>
                SCHEDULED SESSIONS
              </span>
            </div>
            <h2 className="font-display fw-bold text-white mb-0" style={{ fontSize: '1.85rem' }}>
              Select Auditorium & Showtime
            </h2>
          </div>

          {/* Date Selector Tabs */}
          <div className="d-flex align-items-center gap-2 overflow-auto pb-2">
            {availableDates.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`d-flex flex-column align-items-center justify-content-center px-3 py-2 rounded-3 border-0 transition-all ${
                    isSelected ? 'stitch-btn-primary' : 'stitch-btn-secondary'
                  }`}
                  style={{ minWidth: '95px' }}
                >
                  <span className="label-caps" style={{ opacity: 0.85, fontSize: '10px' }}>
                    {item.dayLabel}
                  </span>
                  <span className="font-display fw-bold" style={{ fontSize: '13px' }}>
                    {item.formatted}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theatres & Shows List */}
        {shows.length === 0 ? (
          <div
            className="p-5 rounded-4 text-center"
            style={{
              background: 'var(--imv-surface-1)',
              border: '1px solid var(--imv-border)'
            }}
          >
            <Clapperboard size={48} className="text-muted mb-3 opacity-50" />
            <h4 className="font-display fw-bold text-white mb-1">
              No shows scheduled for {new Date(selectedDate).toDateString()}
            </h4>
            <p className="small mb-0" style={{ color: 'var(--imv-text-muted)' }}>
              Please select another date above to view upcoming showtimes across our auditoriums.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {Object.entries(showsByTheatre).map(([theatreName, group]) => (
              <div
                key={theatreName}
                className="p-4 rounded-4 shadow-sm"
                style={{
                  background: 'var(--imv-surface-1)',
                  border: '1px solid var(--imv-border)'
                }}
              >
                {/* Theatre Header */}
                <div
                  className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 pb-3 border-bottom"
                  style={{ borderColor: 'var(--imv-border)' }}
                >
                  <div>
                    <h5 className="font-display fw-bold text-white mb-1">
                      {theatreName}
                    </h5>
                    {group.theatre?.address && (
                      <div className="d-flex align-items-center gap-1 small" style={{ color: 'var(--imv-text-muted)' }}>
                        <MapPin size={14} style={{ color: 'var(--imv-primary)' }} />
                        <span>{group.theatre.address}{group.theatre.city ? `, ${group.theatre.city}` : ''}</span>
                      </div>
                    )}
                  </div>

                  {group.theatre?.amenities && (
                    <div className="d-flex flex-wrap gap-1">
                      {group.theatre.amenities.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded label-caps"
                          style={{
                            background: 'var(--imv-surface-container)',
                            color: 'var(--imv-text-muted)',
                            fontSize: '10px'
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Showtimes Pill Buttons */}
                <div className="d-flex flex-wrap gap-3">
                  {group.shows.map((show) => {
                    const timeStr = new Date(show.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    const screenName = show.screen?.name || 'Main Hall';
                    const screenType = show.screen?.screenType || 'Dolby Atmos';

                    return (
                      <Link
                        key={show._id}
                        to={`/book/${show._id}`}
                        className="p-3 text-decoration-none rounded-3 text-center d-flex flex-column align-items-center transition-all"
                        style={{
                          minWidth: '130px',
                          background: 'var(--imv-surface-container)',
                          border: '1px solid var(--imv-border)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--imv-primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--imv-border)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <span className="font-display fw-bold text-white fs-6">
                          {timeStr}
                        </span>
                        <span
                          className="label-caps my-1 px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(229, 9, 20, 0.15)',
                            color: 'var(--imv-primary)',
                            fontSize: '9px'
                          }}
                        >
                          {screenType}
                        </span>
                        <span className="small text-muted" style={{ fontSize: '11px' }}>
                          ₹{show.basePrice}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {movie && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          trailerUrl={movie.trailerUrl}
          movieTitle={movie.title}
        />
      )}
    </div>
  );
};
