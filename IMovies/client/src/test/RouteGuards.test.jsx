import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice.js';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { AdminRoute } from '../components/common/AdminRoute.jsx';

const renderWithAuth = (ui, authState = {}) => {
  const store = configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        authErrorCode: null,
        unverifiedEmail: null,
        ...authState
      }
    }
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={ui} />
          <Route path="/login" element={<div>Login Page Redirect Target</div>} />
          <Route path="/verify-email" element={<div>Verify Email Page Redirect Target</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('Route Guards Verification (ProtectedRoute & AdminRoute)', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>,
      { isAuthenticated: false, user: null }
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Redirect Target')).toBeInTheDocument();
  });

  it('redirects unverified users (isEmailVerified: false) to /verify-email', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>,
      {
        isAuthenticated: true,
        user: { name: 'Unverified User', email: 'unverified@test.com', isEmailVerified: false }
      }
    );

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(screen.getByText('Verify Email Page Redirect Target')).toBeInTheDocument();
  });

  it('renders children for verified authenticated users', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>,
      {
        isAuthenticated: true,
        user: { name: 'Verified User', email: 'verified@test.com', isEmailVerified: true }
      }
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('blocks non-admin users from AdminRoute', () => {
    renderWithAuth(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>,
      {
        isAuthenticated: true,
        user: { name: 'Customer', role: 'user', isEmailVerified: true }
      }
    );

    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Redirect Target')).toBeInTheDocument();
  });

  it('allows verified admin users to access AdminRoute', () => {
    renderWithAuth(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>,
      {
        isAuthenticated: true,
        user: { name: 'Super Admin', role: 'admin', isEmailVerified: true }
      }
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
