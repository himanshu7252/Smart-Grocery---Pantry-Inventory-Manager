import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  familyId?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isRestoring: boolean; // flag for splash screen session loading
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isRestoring: true
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any, thunkAPI) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, ...user } = response.data;
      await AsyncStorage.setItem('token', token);
      return { token, user };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: any, thunkAPI) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, ...user } = response.data;
      await AsyncStorage.setItem('token', token);
      return { token, user };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Invalid email or password';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return thunkAPI.rejectWithValue('No token found');

      // Fetch current profile using API client
      const response = await api.get('/auth/me');
      return { token, user: response.data };
    } catch (error: any) {
      await AsyncStorage.removeItem('token');
      return thunkAPI.rejectWithValue('Session expired');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await AsyncStorage.removeItem('token');
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Restore Session
      .addCase(restoreSession.pending, (state) => {
        state.isRestoring = true;
      })
      .addCase(restoreSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.isRestoring = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isRestoring = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
