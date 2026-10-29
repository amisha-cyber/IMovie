import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService.js';
import { MovieModal } from '../../components/admin/MovieModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Plus, Edit, Trash2, Search, Star, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export const AdminMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await movieService.getMovies(params);
      setMovies(res.data || []);
    } catch (err) {
      toast.error('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  const handleSaveMovie = async (movieData) => {
    try {
      if (editingMovie) {
        await movieService.updateMovie(editingMovie._id, movieData);
        toast.success('Movie updated successfully.');
      } else {
        await movieService.createMovie(movieData);
        toast.success('Movie added to catalogue successfully.');
      }
      setIsModalOpen(false);
      setEditingMovie(null);
      fetchMovies();
    } catch (err) {
      toast.error(err.message || 'Failed to save movie.');
    }
  };

  const handleDeleteMovie = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await movieService.deleteMovie(id);
      toast.success('Movie deleted successfully.');
      fetchMovies();
    } catch (err) {
      toast.error(err.message || 'Failed to delete movie.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-light mb-1">Movie Management</h2>
          <p className="text-muted small mb-0">Create, edit, and organize movies shown across auditoriums</p>
        </div>
        <button
          type="button"
          className="btn btn-cinema d-flex align-items-center gap-2"
          onClick={() => {
            setEditingMovie(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} /> Add New Movie
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 mb-4 row g-2 align-items-center">
        <div className="col-md-6">
          <form onSubmit={handleSearchSubmit} className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm bg-black border-secondary text-light ps-5 py-2"
              placeholder="Search by title, director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} className="position-absolute text-muted" style={{ top: '10px', left: '16px' }} />
          </form>
        </div>

        <div className="col-md-6 d-flex justify-content-md-end gap-2">
          <select
            className="form-select form-select-sm bg-black border-secondary text-light w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Movies Table */}
      {loading ? (
        <LoadingSpinner message="Loading movies..." />
      ) : (
        <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Poster</th>
                  <th>Title & Info</th>
                  <th>Genres</th>
                  <th>Runtime</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m._id}>
                    <td style={{ width: '60px' }}>
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="rounded-2"
                        style={{ width: '45px', height: '60px', objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <div className="fw-bold text-light">{m.title}</div>
                      <div className="text-muted small">{m.director ? `Dir: ${m.director}` : ''}</div>
                    </td>
                    <td>
                      <span className="small text-muted">{(m.genres || []).join(', ')}</span>
                    </td>
                    <td className="small text-muted">
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={12} /> {m.duration}m
                      </span>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-1 text-warning small fw-bold">
                        <Star size={12} className="fill-warning" /> {m.rating}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'now_showing' ? 'bg-danger' : m.status === 'coming_soon' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary p-1"
                          onClick={() => {
                            setEditingMovie(m);
                            setIsModalOpen(true);
                          }}
                          title="Edit Movie"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => handleDeleteMovie(m._id, m.title)}
                          title="Delete Movie"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movie Modal */}
      <MovieModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMovie(null);
        }}
        onSave={handleSaveMovie}
        movie={editingMovie}
      />
    </div>
  );
};
