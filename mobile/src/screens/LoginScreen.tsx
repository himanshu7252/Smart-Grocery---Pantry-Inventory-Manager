import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginUser, clearError } from '../store/authSlice';
import { THEME } from '../constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Clear Redux auth errors on mount/unmount
    dispatch(clearError());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validate = () => {
    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return false;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleLogin = () => {
    if (!validate()) return;
    dispatch(loginUser({ email, password }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.icon}>🛒</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage your inventory</Text>
          </View>

          <View style={styles.form}>
            {(validationError || error) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{validationError || error}</Text>
              </View>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="enter your email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationError) setValidationError(null);
              }}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationError) setValidationError(null);
              }}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC' // Light slate background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 36
  },
  icon: {
    fontSize: 50,
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  button: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24
  },
  footerText: {
    fontSize: 14,
    color: '#64748B'
  },
  link: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '700'
  }
});

export default LoginScreen;
