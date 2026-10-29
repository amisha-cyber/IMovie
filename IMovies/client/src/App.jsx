import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/authSlice.js';

// Layouts
import { MainLayout } from './layouts/MainLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

// Route Guards
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { AdminRoute } from './components/common/AdminRoute.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

// Public Pages
import { HomePage } from './pages/HomePage.jsx';
import { MoviesPage } from './pages/MoviesPage.jsx';
import { MovieDetailsPage } from './pages/MovieDetailsPage.jsx';
import { TheatresPage } from './pages/TheatresPage.jsx';
import { SeatSelectionPage } from './pages/SeatSelectionPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

// Authenticated User Pages
import { BookingConfirmationPage } from './pages/BookingConfirmationPage.jsx';
import { UserBookingsPage } from './pages/UserBookingsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminMoviesPage } from './pages/admin/AdminMoviesPage.jsx';
import { AdminTheatresPage } from './pages/admin/AdminTheatresPage.jsx';
import { AdminShowsPage } from './pages/admin/AdminShowsPage.jsx';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage.jsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.jsx';

export const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check session on initial load
    dispatch(checkAuth());

    // Listen to global auth-expired event from API interceptor
    const handleAuthExpired = () => {
      dispatch(checkAuth());
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Routes>
        {/* Main Customer Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:id" element={<MovieDetailsPage />} />
          <Route path="theatres" element={<TheatresPage />} />
          <Route path="book/:showId" element={<SeatSelectionPage />} />

          {/* Protected Customer Routes */}
          <Route
            path="booking-confirmation/:id"
            element={
              <ProtectedRoute>
                <BookingConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-bookings"
            element={
              <ProtectedRoute>
                <UserBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Protected Administration Layout */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="theatres" element={<AdminTheatresPage />} />
          <Route path="shows" element={<AdminShowsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
