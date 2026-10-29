import React from 'react';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

const GENRE_LIST = ['Action', 'Sci-Fi', 'Thriller', 'Drama', 'Adventure', 'Horror', 'Crime', 'Comedy', 'Animation'];
const LANGUAGE_LIST = ['English', 'Hindi', 'Tamil', 'Japanese'];
const FORMAT_LIST = ['IMAX Laser', 'Dolby Atmos', '4DX 3D', 'VIP Recliner'];

export const MovieFilter = ({ filters, onFilterChange, onResetFilters, selectedFormats = [], onToggleFormat }) => {
  return (
    <aside
      className="p-4 rounded-4 shadow-xl"
      style={{
        background: 'var(--imv-surface-1)',
        border: '1px solid var(--imv-border)',
        position: 'sticky',
        top: '100px'
      }}
    >
      {/* Filter Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <SlidersHorizontal size={18} style={{ color: 'var(--imv-primary)' }} />
          <h5 className="font-display fw-bold text-white mb-0" style={{ fontSize: '1.1rem' }}>
            Filters
          </h5>
        </div>
        <button
          onClick={onResetFilters}
          className="btn btn-link text-decoration-none p-0 label-caps"
          style={{ color: 'var(--imv-gold)', fontSize: '11px' }}
          type="button"
        >
          Reset All
        </button>
      </div>

      {/* Release Status */}
      <div className="mb-4">
        <span className="label-caps d-block mb-2" style={{ color: 'var(--imv-text-muted)' }}>
          RELEASE STATUS
        </span>
        <div className="d-flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'now_showing', label: 'Now Showing' },
            { id: 'coming_soon', label: 'Coming Soon' }
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onFilterChange('status', s.id)}
              className={`filter-chip ${filters.status === s.id ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="mb-4">
        <span className="label-caps d-block mb-2" style={{ color: 'var(--imv-text-muted)' }}>
          LANGUAGES
        </span>
        <div className="d-flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange('language', 'all')}
            className={`filter-chip ${filters.language === 'all' ? 'active' : ''}`}
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            All
          </button>
          {LANGUAGE_LIST.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onFilterChange('language', lang)}
              className={`filter-chip ${filters.language === lang ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div className="mb-4">
        <span className="label-caps d-block mb-2" style={{ color: 'var(--imv-text-muted)' }}>
          GENRES
        </span>
        <div className="d-flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange('genre', 'all')}
            className={`filter-chip ${filters.genre === 'all' ? 'active' : ''}`}
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            All
          </button>
          {GENRE_LIST.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => onFilterChange('genre', genre)}
              className={`filter-chip ${filters.genre === genre ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Formats & Experiences (Stitch Specification) */}
      <div>
        <span className="label-caps d-block mb-2" style={{ color: 'var(--imv-text-muted)' }}>
          FORMATS & AUDITORIUMS
        </span>
        <div className="d-flex flex-column gap-2">
          {FORMAT_LIST.map((fmt) => {
            const isChecked = selectedFormats.includes(fmt);
            return (
              <label
                key={fmt}
                className="d-flex align-items-center justify-content-between p-2 rounded-3 cursor-pointer transition-all"
                style={{
                  background: isChecked ? 'rgba(229, 9, 20, 0.12)' : 'var(--imv-surface-container)',
                  border: isChecked ? '1px solid var(--imv-primary)' : '1px solid var(--imv-border)'
                }}
                onClick={() => onToggleFormat && onToggleFormat(fmt)}
              >
                <span className="small text-white fw-semibold">{fmt}</span>
                <div
                  className="rounded d-flex align-items-center justify-content-center"
                  style={{
                    width: '18px',
                    height: '18px',
                    background: isChecked ? 'var(--imv-primary)' : 'var(--imv-surface-0)',
                    border: isChecked ? 'none' : '1.5px solid var(--imv-border)'
                  }}
                >
                  {isChecked && <Check size={12} className="text-white" />}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
