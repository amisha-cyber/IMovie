import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authService } from '../services/authService.js';
import { api } from '../services/api.js';
import { updateProfileSuccess } from '../store/authSlice.js';
import { User, Mail, Phone, Shield, Bell, Check } from 'lucide-react';
import { toast } from 'react-toastify';

export const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/users/notifications');
        setNotifications(res.data?.notifications || []);
      } catch (err) {
        // Ignore notification fetch error
      }
    };
    fetchNotifications();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authService.updateProfile(formData);
      dispatch(updateProfileSuccess(res.data.user));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.info('All notifications marked as read.');
    } catch (err) {
      // Ignore
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">My Account</h1>
        <p className="text-muted small">Manage your personal information and view cinema notifications</p>
      </div>

      <div className="row g-4">
        {/* Profile Details Form */}
        <div className="col-lg-6">
          <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm h-100">
            <h4 className="fw-bold mb-4 text-light d-flex align-items-center gap-2">
              <User size={22} className="text-danger" /> Personal Profile
            </h4>

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-3">
                <label className="form-label text-muted small">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-black border-secondary text-muted">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    className="form-control bg-black border-secondary text-light"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small">Email Address (Registered)</label>
                <div className="input-group">
                  <span className="input-group-text bg-black border-secondary text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    disabled
                    className="form-control bg-black border-secondary text-secondary"
                    value={user?.email || ''}
                  />
                </div>
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Email address cannot be modified once verified.
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-black border-secondary text-muted">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    className="form-control bg-black border-secondary text-light"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <Shield size={16} className="text-success" />
                  <span className="small text-muted">Role: <strong className="text-light text-capitalize">{user?.role}</strong></span>
                </div>
                <button type="submit" className="btn btn-cinema btn-sm px-4" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notifications & System Updates */}
        <div className="col-lg-6">
          <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0 text-light d-flex align-items-center gap-2">
                  <Bell size={22} className="text-warning" /> Activity Notifications
                </h4>
                {notifications.some((n) => !n.read) && (
                  <button onClick={handleMarkAllRead} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  No notifications yet. You will receive updates on booking confirmations and reminders here.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '380px' }}>
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 rounded-3 border ${
                        n.read ? 'bg-black border-secondary border-opacity-25' : 'bg-dark border-danger border-opacity-50'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-light small">{n.title}</strong>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-muted small mb-0">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-muted small">
              Account status: <span className="badge bg-success">Active & Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
