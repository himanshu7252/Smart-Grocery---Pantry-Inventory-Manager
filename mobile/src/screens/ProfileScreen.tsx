import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logoutUser } from '../store/authSlice';
import api from '../services/api';
import { THEME } from '../constants';

interface FamilyInfo {
  _id: string;
  name: string;
  ownerId: string;
  members: Array<{ _id: string; name: string; email: string }>;
}

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [familyLoading, setFamilyLoading] = useState(false);

  const loadFamilyDetails = async () => {
    if (!user?.familyId) {
      setFamily(null);
      return;
    }
    try {
      setFamilyLoading(true);
      // Fetches family details from server
      const res = await api.get(`/auth/family/${user.familyId}`);
      if (res.data?.success) {
        setFamily(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching family groups:', err);
    } finally {
      setFamilyLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyDetails();
  }, [user?.familyId]);

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

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    setFamilyLoading(true);
    try {
      // Create Family endpoint Simulation / call
      // In advanced sharing, it logs on server
      const res = await api.post('/auth/family/create', { name: familyName });
      if (res.data?.success) {
        Alert.alert('Success', `Family Group "${familyName}" created!`);
        // Force refresh user profile
        loadFamilyDetails();
      }
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Failed to create family group');
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) return;
    setFamilyLoading(true);
    try {
      const res = await api.post('/auth/family/join', { familyId: familyCode });
      if (res.data?.success) {
        Alert.alert('Success', 'Successfully joined the family group!');
        loadFamilyDetails();
      }
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Failed to join group');
    } finally {
      setFamilyLoading(false);
    }
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

        {/* Family Sharing Section */}
        <Text style={styles.sectionTitle}>Family Sharing & Shared Pantry</Text>
        {familyLoading ? (
          <ActivityIndicator size="small" color={THEME.primary} style={styles.loader} />
        ) : family ? (
          <View style={styles.card}>
            <Text style={styles.familyTitle}>👪 {family.name}</Text>
            <Text style={styles.familyCode}>Invite Code: {family._id}</Text>
            <Text style={styles.subTitle}>Group Members:</Text>
            {family.members?.map((member) => (
              <View key={member._id} style={styles.memberRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.infoText}>
              Share your grocery list and pantry stock with family members in real-time!
            </Text>

            <View style={styles.actionBlock}>
              <Text style={styles.label}>Create Family Group</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. The Smiths Pantry"
                  placeholderTextColor="#94A3B8"
                  value={familyName}
                  onChangeText={setFamilyName}
                />
                <TouchableOpacity style={styles.btn} onPress={handleCreateFamily}>
                  <Text style={styles.btnText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionBlock}>
              <Text style={styles.label}>Join Group via Invite Code</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 660f9ac8d..."
                  placeholderTextColor="#94A3B8"
                  value={familyCode}
                  onChangeText={setFamilyCode}
                />
                <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleJoinFamily}>
                  <Text style={styles.btnText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* App Config */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.card}>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Dark Mode (Simulation)</Text>
            <Text style={styles.prefVal}>Disabled</Text>
          </View>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Offline Storage Caching</Text>
            <Text style={styles.prefVal}>Active</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40
  },
  profileCard: {
    backgroundColor: '#0F172A', // Slate dark card
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.primary,
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
    color: '#FFFFFF'
  },
  emailText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4
  },
  phoneText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
    paddingLeft: 4
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 1,
    marginBottom: 20
  },
  infoText: {
    fontSize: 13,
    color: THEME.textMuted,
    lineHeight: 18,
    marginBottom: 14
  },
  actionBlock: {
    marginBottom: 14
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text,
    fontSize: 13
  },
  btn: {
    height: 40,
    backgroundColor: THEME.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginLeft: 8
  },
  btnSecondary: {
    backgroundColor: THEME.secondary
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  familyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 4
  },
  familyCode: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 14
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text
  },
  memberEmail: {
    fontSize: 12,
    color: THEME.textMuted
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  prefLabel: {
    fontSize: 14,
    color: THEME.text
  },
  prefVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textMuted
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 1
  },
  logoutBtnText: {
    color: THEME.danger,
    fontSize: 15,
    fontWeight: '700'
  },
  loader: {
    paddingVertical: 16
  }
});

export default ProfileScreen;
