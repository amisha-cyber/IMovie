import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import {
  DollarSign,
  Ticket,
  Film,
  Calendar,
  Users,
  XCircle,
  Clapperboard,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (showToast = false) => {
    try {
      if (!data) setLoading(true);
      else setRefreshing(true);

      const res = await adminService.getAnalytics();
      setData(res.data);
      if (showToast) {
        toast.success('Dashboard metrics synced with database.');
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      toast.error('Failed to sync dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner message="Calculating real-time cinema metrics..." />;
  }

  const stats = data?.stats || {};
  const theatres = data?.theatres || [];
  const recentBookings = data?.recentBookings || [];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h2 className="fw-bold text-light mb-1">Executive Dashboard</h2>
          <p className="text-muted small mb-0">Authoritative metrics calculated from verified database transactions</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            id="refresh-dashboard-btn"
          >
            <RefreshCw size={14} className={refreshing ? 'spinner-border spinner-border-sm' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 small">
            ● Database Synced
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            color="success"
            subtitle="Calculated strictly from verified payments"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Confirmed Bookings"
            value={(stats.confirmedBookings || 0).toLocaleString()}
            icon={Ticket}
            color="danger"
            subtitle={`Out of ${stats.totalBookings || 0} total requests`}
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Active Cinemas"
            value={stats.activeTheatres || theatres.length || 0}
            icon={Clapperboard}
            color="danger"
            subtitle={`${stats.totalScreens || 0} screens configured`}
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Active Movies"
            value={stats.totalMovies || 0}
            icon={Film}
            color="warning"
            subtitle="Now showing & coming soon"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Upcoming Shows"
            value={stats.upcomingShows || 0}
            icon={Calendar}
            color="primary"
            subtitle="Scheduled in auditorium screens"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Registered Users"
            value={stats.totalUsers || 0}
            icon={Users}
            color="info"
            subtitle="Customer accounts in database"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Total Screens"
            value={stats.totalScreens || 0}
            icon={Clapperboard}
            color="light"
            subtitle="Across all cinema complexes"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Cancellations"
            value={stats.cancelledBookings || 0}
            icon={XCircle}
            color="secondary"
            subtitle="Cancelled per policy rules"
          />
        </div>
      </div>

      {/* Cinema Complexes Overview Section */}
      <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-light mb-0">Active Cinema Complexes ({theatres.length})</h5>
            <div className="text-muted small">Live inventory fetched directly from MongoDB</div>
          </div>
          <Link to="/admin/theatres" className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
            <span>Manage Theatres & Screens</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {theatres.length === 0 ? (
          <div className="text-center py-4 text-muted small">No cinema complexes found in database.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Cinema Complex</th>
                  <th>Location</th>
                  <th>Screens</th>
                  <th>Amenities</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {theatres.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="fw-bold text-light">{t.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '280px' }}>
                        {t.address}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 small">
                        <MapPin size={12} className="me-1" />
                        {t.city}{t.state ? `, ${t.state}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-25 text-light px-2 py-1">
                        {t.screenCount || (t.screens ? t.screens.length : 0)} Screens
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '260px' }}>
                        {(t.amenities || []).slice(0, 2).map((a, i) => (
                          <span key={i} className="badge bg-black border border-secondary text-secondary" style={{ fontSize: '0.7rem' }}>
                            <Sparkles size={9} className="text-warning me-1" />
                            {a}
                          </span>
                        ))}
                        {(t.amenities || []).length > 2 && (
                          <span className="badge bg-black text-muted" style={{ fontSize: '0.7rem' }}>
                            +{t.amenities.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success bg-opacity-25 text-success">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-light mb-0">Recent Cinema Bookings</h5>
          <Link to="/admin/bookings" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
            <span>View All</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-4 text-muted small">No recent bookings recorded.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Movie</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Booked At</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td className="font-monospace small fw-bold text-danger">{b.bookingReference}</td>
                    <td>
                      <div className="fw-semibold small">{b.user?.name || 'Customer'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{b.user?.email}</div>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: '180px' }}>
                      {b.show?.movie?.title || 'Movie'}
                    </td>
                    <td>
                      <span className="small text-light">
                        {b.seats?.map((s) => s.seatNumber).join(', ')}
                      </span>
                    </td>
                    <td className="fw-bold text-light">₹{b.grandTotal}</td>
                    <td>
                      <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : b.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
