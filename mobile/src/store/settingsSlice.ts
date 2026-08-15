import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  darkMode: boolean;
  offlineCaching: boolean;
}

const initialState: SettingsState = {
  darkMode: false,
  offlineCaching: true
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setOfflineCaching: (state, action: PayloadAction<boolean>) => {
      state.offlineCaching = action.payload;
    }
  }
});

export const { setDarkMode, setOfflineCaching } = settingsSlice.actions;
export default settingsSlice.reducer;
