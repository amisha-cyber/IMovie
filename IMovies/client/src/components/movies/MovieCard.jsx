import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket } from 'lucide-react';

const NEUTRAL_POSTER_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22450%22%20viewBox%3D%220%200%20300%20450%22%20fill%3D%22%2313151b%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%2313151b%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22280%22%20height%3D%22430%22%20fill%3D%22none%22%20stroke%3D%22%232a2e3d%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22200%22%20r%3D%2236%22%20fill%3D%22%231d1f26%22%20stroke%3D%22%232a2e3d%22%20stroke-width%3D%222%22%2F%3E%3Cpolygon%20points%3D%22143%2C185%20165%2C200%20143%2C215%22%20fill%3D%22%23e50914%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22265%22%20text-anchor%3D%22middle%22%20fill%3D%22%23a1a7b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%20font-weight%3D%22600%22%20letter-spacing%3D%221%22%3EIMOVIES%20CINEMA%3C%2Ftext%3E%3C%2Fsvg%3E";

export const MovieCard = ({ movie }) => {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || NEUTRAL_POSTER_FALLBACK);

  const handleImgError = () => {
    setImgSrc(NEUTRAL_POSTER_FALLBACK);
  };

  const isComingSoon = movie.status === 'coming_soon';
  const hasRating = typeof movie.rating === 'number' && movie.rating > 0;

  return (
    <div className="movie-card h-100">
      {/* 2:3 Aspect Ratio Poster Wrap matching Stitch */}
      <div className="movie-poster-wrap">
        <img
          src={imgSrc}
          alt={movie.title}
          onError={handleImgError}
          loading="lazy"
        />
        {/* Scrim overlay */}
        <div className="movie-poster-scrim" />

        {/* Top Badges */}
        <div className="position-absolute top-0 start-0 m-2 d-flex align-items-center gap-1 z-2">
          {movie.certification && (
            <span
              className="px-2 py-0.5 rounded text-white font-display fw-bold"
              style={{
                background: 'rgba(11, 12, 16, 0.85)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                letterSpacing: '0.04em'
              }}
            >
              {movie.certification}
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded text-white label-caps"
            style={{
              background: isComingSoon ? 'var(--imv-gold)' : 'var(--imv-primary)',
              color: isComingSoon ? '#0B0C10' : '#FFFFFF',
              boxShadow: isComingSoon ? '0 0 10px rgba(212, 175, 55, 0.4)' : '0 0 10px rgba(229, 9, 20, 0.4)'
            }}
          >
            {isComingSoon ? 'COMING SOON' : 'IMAX'}
          </span>
        </div>

        {/* Top Right: True Rating from Database Only (No default 8.5 fallback) */}
        {hasRating && (
          <div
            className="position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1 px-2 py-0.5 rounded z-2"
            style={{
              background: 'rgba(11, 12, 16, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: 'var(--imv-gold)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <Star size={13} className="fill-warning text-warning" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom Format Bar Pinned to Poster (Stitch specification) */}
        <div
          className="position-absolute bottom-0 start-0 end-0 px-3 py-2 d-flex align-items-center justify-content-between z-2 label-caps"
          style={{ color: 'var(--imv-text-muted)' }}
        >
          <span>DOLBY ATMOS</span>
          <span>{movie.duration ? `${movie.duration}m` : '2h'}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          <h5
            className="font-display fw-bold mb-1 text-light text-truncate"
            title={movie.title}
            style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}
          >
            {movie.title}
          </h5>

          <p
            className="text-truncate small mb-3"
            style={{ color: 'var(--imv-text-muted)', fontSize: '0.85rem' }}
          >
            {(movie.genres || []).length > 0
              ? movie.genres.join(' / ')
              : 'Action / Cinema'}
          </p>
        </div>

        <div>
          <Link
            to={`/movies/${movie.slug || movie._id}`}
            className="stitch-btn-primary w-100 py-2 text-decoration-none"
            style={{ fontSize: '0.9rem' }}
          >
            <Ticket size={16} />
            <span>{isComingSoon ? 'View Details' : 'Book Tickets'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
