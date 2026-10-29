import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar.jsx';
import { AdminSidebar } from '../components/admin/AdminSidebar.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const AdminLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <AdminSidebar />
        <main className="flex-grow-1 p-4 bg-dark overflow-auto" style={{ maxHeight: 'calc(100vh - 72px)' }}>
          <Outlet />
        </main>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        theme="dark"
      />
    </div>
  );
};
