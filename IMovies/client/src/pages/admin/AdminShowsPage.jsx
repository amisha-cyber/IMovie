import React, { useState, useEffect } from 'react';
import { showService } from '../../services/showService.js';
import { movieService } from '../../services/movieService.js';
import { theatreService } from '../../services/theatreService.js';
import { ShowModal } from '../../components/admin/ShowModal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

export const AdminShowsPage = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        showService.getShows({ limit: 50 }),
        movieService.getMovies({ status: 'now_showing' }),
        theatreService.getTheatres()
      ]);
      setShows(showsRes.data || []);
      setMovies(moviesRes.data || []);
      setTheatres(theatresRes.data || []);
    } catch (err) {
      toast.error('Failed to load shows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveShow = async (showData) => {
    try {
      await showService.createShow(showData);
      toast.success('Show scheduled successfully and 60 seat records generated!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule show.');
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and remove this scheduled show?')) return;
    try {
      await showService.deleteShow(id);
      toast.success('Show removed.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove show.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-light mb-1">Show Scheduling</h2>
          <p className="text-muted small mb-0">Schedule screenings with automated conflict prevention and seat inventory</p>
        </div>
        <button
          type="button"
          className="btn btn-cinema d-flex align-items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} /> Schedule New Show
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading show schedules..." />
      ) : (
        <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Movie</th>
                  <th>Theatre & Screen</th>
                  <th>Date & Timing</th>
                  <th>Base Price</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="fw-bold text-light">{s.movie?.title || 'Unknown Movie'}</div>
                      <div className="text-muted small">{s.movie?.duration}m • {s.movie?.certification}</div>
                    </td>
                    <td>
                      <div className="text-light small">{s.theatre?.name}</div>
                      <div className="text-muted small">
                        <span className="badge bg-black border border-secondary text-secondary">
                          {s.screen?.name} ({s.screen?.screenType})
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 small text-light">
                        <Calendar size={13} className="text-danger" />
                        <span>{new Date(s.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 small text-muted">
                        <Clock size={13} />
                        <span>
                          {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="fw-bold text-light">₹{s.basePrice}</td>
                    <td>
                      <span className={`badge ${s.status === 'scheduled' ? 'bg-success' : s.status === 'running' ? 'bg-primary' : 'bg-secondary'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger p-1"
                        onClick={() => handleDeleteShow(s._id)}
                        title="Delete Show"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show Modal */}
      <ShowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveShow}
        movies={movies}
        theatres={theatres}
      />
    </div>
  );
};
