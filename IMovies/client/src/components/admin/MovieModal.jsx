import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const MovieModal = ({ isOpen, onClose, onSave, movie }) => {
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    genres: 'Action, Sci-Fi',
    languages: 'English, Hindi',
    duration: 120,
    releaseDate: new Date().toISOString().split('T')[0],
    certification: 'UA',
    director: '',
    rating: 8.5,
    status: 'now_showing'
  });

  useEffect(() => {
    if (movie) {
      setFormData({
        title: movie.title || '',
        synopsis: movie.synopsis || '',
        posterUrl: movie.posterUrl || '',
        backdropUrl: movie.backdropUrl || '',
        trailerUrl: movie.trailerUrl || '',
        genres: Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || '',
        languages: Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages || '',
        duration: movie.duration || 120,
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
        certification: movie.certification || 'UA',
        director: movie.director || '',
        rating: movie.rating || 8.5,
        status: movie.status || 'now_showing'
      });
    } else {
      setFormData({
        title: '',
        synopsis: '',
        posterUrl: '',
        backdropUrl: '',
        trailerUrl: '',
        genres: 'Action, Sci-Fi',
        languages: 'English, Hindi',
        duration: 120,
        releaseDate: new Date().toISOString().split('T')[0],
        certification: 'UA',
        director: '',
        rating: 8.5,
        status: 'now_showing'
      });
    }
  }, [movie]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      genres: formData.genres.split(',').map((g) => g.trim()).filter(Boolean),
      languages: formData.languages.split(',').map((l) => l.trim()).filter(Boolean),
      duration: Number(formData.duration),
      rating: Number(formData.rating)
    };
    onSave(payload);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content bg-dark border-secondary border-opacity-50 text-light shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-secondary border-opacity-25 py-3">
            <h5 className="modal-title fw-bold">{movie ? 'Edit Movie' : 'Add New Movie'}</h5>
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 row g-3">
              <div className="col-md-8">
                <label className="form-label small text-muted">Movie Title *</label>
                <input
                  type="text"
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-muted">Status</label>
                <select
                  className="form-select bg-black border-secondary text-light"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="now_showing">Now Showing</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small text-muted">Synopsis / Overview *</label>
                <textarea
                  required
                  rows={3}
                  className="form-control bg-black border-secondary text-light"
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Poster URL *</label>
                <input
                  type="url"
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.posterUrl}
                  onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Backdrop URL</label>
                <input
                  type="url"
                  className="form-control bg-black border-secondary text-light"
                  value={formData.backdropUrl}
                  onChange={(e) => setFormData({ ...formData, backdropUrl: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Trailer URL (YouTube)</label>
                <input
                  type="url"
                  className="form-control bg-black border-secondary text-light"
                  value={formData.trailerUrl}
                  onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Director</label>
                <input
                  type="text"
                  className="form-control bg-black border-secondary text-light"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Genres (comma separated)</label>
                <input
                  type="text"
                  className="form-control bg-black border-secondary text-light"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Languages (comma separated)</label>
                <input
                  type="text"
                  className="form-control bg-black border-secondary text-light"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Duration (mins) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="form-control bg-black border-secondary text-light"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Certification</label>
                <select
                  className="form-select bg-black border-secondary text-light"
                  value={formData.certification}
                  onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                >
                  <option value="U">U</option>
                  <option value="UA">UA</option>
                  <option value="A">A</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Release Date *</label>
                <input
                  type="date"
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small text-muted">Rating (0 - 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="form-control bg-black border-secondary text-light"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer border-secondary border-opacity-25 p-3">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-cinema btn-sm px-4">
                Save Movie
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
