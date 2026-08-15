import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAppDispatch } from '../hooks/redux';
import { restoreSession } from '../store/authSlice';
import { THEME } from '../constants';

export const SplashScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkSession = async () => {
      // Small artificial delay for visual brand presence
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));
      dispatch(restoreSession());
    };
    checkSession();
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/app_logo.png')}
          style={styles.logoImage}
        />
        <Text style={styles.title}>PantrySmart</Text>
        <Text style={styles.subtitle}>Smart Grocery & Stock Manager</Text>
      </View>
      <ActivityIndicator size="large" color={THEME.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Premium dark slate background
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: THEME.primary,
    elevation: 8,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500'
  },
  loader: {
    marginBottom: 20
  }
});

export default SplashScreen;
