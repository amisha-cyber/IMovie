import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService.js';

// Load stored user and token if available
const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
const storedToken = localStorage.getItem('token') || null;

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authService.login(credentials);
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  } catch (err) {
    return rejectWithValue({
      message: err.message,
      code: err.code || err.response?.data?.code,
      email: err.data?.email || credentials.email
    });
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const res = await authService.register(userData);
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data || res;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const res = await authService.getMe();
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data.user;
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return rejectWithValue(err.message);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.logout();
  } catch (err) {
    // Ignore logout error
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    isAuthenticated: Boolean(storedToken && storedUser),
    loading: false,
    error: null,
    authErrorCode: null,
    unverifiedEmail: null
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.authErrorCode = null;
      state.unverifiedEmail = null;
    },
    updateProfileSuccess: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.authErrorCode = null;
        state.unverifiedEmail = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.authErrorCode = null;
        state.unverifiedEmail = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (typeof payload === 'object' && payload !== null) {
          state.error = payload.message || 'Login failed';
          state.authErrorCode = payload.code || null;
          state.unverifiedEmail = payload.email || null;
        } else {
          state.error = payload || 'Login failed';
          state.authErrorCode = null;
          state.unverifiedEmail = null;
        }
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.token) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          // Account created but unverified: no session
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.payload?.message || 'Registration failed';
      })
      // Check auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  }
});

export const { clearAuthError, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
