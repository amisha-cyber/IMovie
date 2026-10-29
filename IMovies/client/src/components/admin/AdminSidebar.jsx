import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Film, Clapperboard, Calendar, Ticket, Users, ArrowLeft } from 'lucide-react';

export const AdminSidebar = () => {
  return (
    <div className="admin-sidebar p-3 d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 mb-4 text-warning fw-bold fs-6">
          <Clapperboard size={20} />
          <span>IMovies Admin</span>
        </div>

        <nav className="d-flex flex-column gap-1">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/movies" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Film size={18} />
            <span>Movies</span>
          </NavLink>

          <NavLink to="/admin/theatres" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Clapperboard size={18} />
            <span>Theatres & Screens</span>
          </NavLink>

          <NavLink to="/admin/shows" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Show Schedules</span>
          </NavLink>

          <NavLink to="/admin/bookings" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Ticket size={18} />
            <span>Bookings & Revenue</span>
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Users</span>
          </NavLink>
        </nav>
      </div>

      <div className="pt-3 border-top border-secondary border-opacity-25">
        <NavLink to="/" className="admin-nav-item text-secondary">
          <ArrowLeft size={18} />
          <span>Back to Main Site</span>
        </NavLink>
      </div>
    </div>
  );
};
