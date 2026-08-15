import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logoutUser } from '../store/authSlice';
import { THEME } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { setDarkMode, setOfflineCaching } from '../store/settingsSlice';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { darkMode, offlineCaching } = useAppSelector((state) => state.settings);
  const styles = getStyles(theme, darkMode);

  const toggleDarkMode = (value: boolean) => {
    dispatch(setDarkMode(value));
    try {
      AsyncStorage.setItem('pref_dark_mode', String(value));
    } catch (err) {
      console.error('Error saving dark mode preference:', err);
    }
  };

  const toggleOfflineCaching = (value: boolean) => {
    dispatch(setOfflineCaching(value));
    try {
      AsyncStorage.setItem('pref_offline_caching', String(value));
    } catch (err) {
      console.error('Error saving offline caching preference:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          dispatch(logoutUser());
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.nameText}>{user?.name || 'Jane Doe'}</Text>
          <Text style={styles.emailText}>{user?.email || 'jane@example.com'}</Text>
          {user?.phone ? <Text style={styles.phoneText}>📞 {user.phone}</Text> : null}
        </View>

        {/* App Config */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.card}>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Dark Mode (Simulation)</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor={darkMode ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Offline Storage Caching</Text>
            <Switch
              value={offlineCaching}
              onValueChange={toggleOfflineCaching}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor={offlineCaching ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: typeof THEME, darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  profileCard: {
    backgroundColor: darkMode ? '#000000' : '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 3
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text
  },
  emailText: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4
  },
  phoneText: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
    paddingLeft: 4
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 1,
    marginBottom: 20
  },

  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  prefLabel: {
    fontSize: 14,
    color: theme.text
  },
  logoutBtn: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 1
  },
  logoutBtnText: {
    color: theme.danger,
    fontSize: 15,
    fontWeight: '700'
  }
});

export default ProfileScreen;
