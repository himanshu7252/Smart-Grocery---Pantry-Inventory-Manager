import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

export interface NotificationType {
  _id: string;
  userId: string;
  type: 'LOW_STOCK' | 'EXPIRY_SOON' | 'EXPIRED' | 'RESTOCK';
  title: string;
  message: string;
  relatedItemId: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationType[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/notifications');
      return response.data.data as NotificationType[];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string, thunkAPI) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data.data as NotificationType;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to read notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<NotificationType[]>) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark Read
      .addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<NotificationType>) => {
        const index = state.notifications.findIndex((n) => n._id === action.payload._id);
        if (index > -1) {
          state.notifications[index] = action.payload;
        }
      });
  }
});

export default notificationSlice.reducer;
