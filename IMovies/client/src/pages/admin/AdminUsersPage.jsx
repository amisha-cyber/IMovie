import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await adminService.getUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    try {
      const res = await adminService.toggleUserStatus(id);
      toast.success(res.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user account status.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-light mb-1">User Account Management</h2>
          <p className="text-muted small mb-0">Manage customer and administrative accounts, roles, and access status</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 mb-4 row g-2 align-items-center">
        <div className="col-md-6">
          <form onSubmit={handleSearchSubmit} className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm bg-black border-secondary text-light ps-5 py-2"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} className="position-absolute text-muted" style={{ top: '10px', left: '16px' }} />
          </form>
        </div>

        <div className="col-md-6 d-flex justify-content-md-end gap-2">
          <select
            className="form-select form-select-sm bg-black border-secondary text-light w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : (
        <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="fw-bold text-light">{u.name}</div>
                    </td>
                    <td>
                      <span className="text-muted small">{u.email}</span>
                    </td>
                    <td>
                      <span className="text-muted small">{u.phone || '—'}</span>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 d-inline-flex align-items-center gap-1">
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary">
                          User
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.accountStatus === 'active' ? 'bg-success' : 'bg-danger'}`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          className={`btn btn-sm ${u.accountStatus === 'active' ? 'btn-outline-danger' : 'btn-outline-success'} p-1`}
                          onClick={() => handleToggleStatus(u._id, u.accountStatus, u.name)}
                          title={u.accountStatus === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {u.accountStatus === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
