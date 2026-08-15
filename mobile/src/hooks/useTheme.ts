import { useAppSelector } from './redux';
import { THEME } from '../constants';

export const useTheme = () => {
  const darkMode = useAppSelector((state) => state.settings.darkMode);

  if (darkMode) {
    return {
      primary: '#10B981', // Emerald green
      primaryDark: '#047857',
      secondary: '#3B82F6', // Blue
      danger: '#EF4444', // Red
      warning: '#F59E0B', // Amber
      success: '#10B981',
      background: '#0F172A', // Dark Slate
      card: '#1E293B',       // Slate Card
      text: '#F8FAFC',       // Slate Text
      textMuted: '#94A3B8',  // Slate Muted
      border: '#334155'      // Slate Border
    };
  }

  return THEME;
};

export default useTheme;
