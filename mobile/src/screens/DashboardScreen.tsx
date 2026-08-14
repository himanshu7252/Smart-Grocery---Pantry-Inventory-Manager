import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchNotifications, markNotificationRead, NotificationType } from '../store/notificationSlice';
import api from '../services/api';
import { THEME } from '../constants';
import SvgIcon from '../components/SvgIcon';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type DashboardNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: DashboardNavigationProp;
}

interface SummaryData {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  shoppingItemsCount: number;
  inventoryValue: number;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications, loading: notifLoading } = useAppSelector((state) => state.notifications);

  const [summary, setSummary] = useState<SummaryData>({
    totalItems: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    shoppingItemsCount: 0,
    inventoryValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch summary from dashboard api
      const summaryRes = await api.get('/dashboard/summary');
      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }
      // Dispatch fetch notifications
      dispatch(fetchNotifications());
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDismissNotif = (id: string) => {
    dispatch(markNotificationRead(id));
  };

  const renderAlertItem = ({ item }: { item: NotificationType }) => {
    if (item.read) return null;
    const isError = item.type === 'EXPIRED' || item.type === 'LOW_STOCK';
    return (
      <View style={[styles.alertCard, isError ? styles.alertCardErr : styles.alertCardWarn]}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertTitle, isError ? styles.alertTextErr : styles.alertTextWarn]}>
            ⚠️ {item.title}
          </Text>
          <TouchableOpacity onPress={() => handleDismissNotif(item._id)}>
            <Text style={styles.dismissBtn}>Dismiss</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.alertMsg}>{item.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarPlaceholder} onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' } as any)}>
            <Text style={styles.avatarText}>👤</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={THEME.primary} style={styles.loader} />
        ) : (
          <>
            {/* Grid Summary Section */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryVal}>{summary.totalItems}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Inventory Value</Text>
                <Text style={styles.summaryVal}>${summary.inventoryValue}</Text>
              </View>
              <TouchableOpacity
                style={[styles.summaryCard, summary.lowStockCount > 0 && styles.summaryCardWarning]}
                onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' } as any)}
              >
                <Text style={styles.summaryLabel}>Low Stock</Text>
                <Text style={[styles.summaryVal, summary.lowStockCount > 0 && styles.warningText]}>
                  {summary.lowStockCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.summaryCard, summary.expiringSoonCount > 0 && styles.summaryCardDanger]}
                onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' } as any)}
              >
                <Text style={styles.summaryLabel}>Expiring Soon</Text>
                <Text style={[styles.summaryVal, summary.expiringSoonCount > 0 && styles.dangerText]}>
                  {summary.expiringSoonCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddGrocery')}>
                <View style={[styles.actionIconBg, { backgroundColor: '#D1FAE5' }]}>
                  <SvgIcon name="plus" color={THEME.primary} size={22} />
                </View>
                <Text style={styles.actionBtnTxt}>Add Item</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scanner')}>
                <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
                  <SvgIcon name="scanner" color={THEME.secondary} size={22} />
                </View>
                <Text style={styles.actionBtnTxt}>Barcode Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Main', { screen: 'ShoppingListTab' } as any)}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
                  <SvgIcon name="shopping-list" color={THEME.warning} size={22} />
                </View>
                <Text style={styles.actionBtnTxt}>Shopping List</Text>
              </TouchableOpacity>
            </View>

            {/* Active Alerts */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
            </View>

            {notifications.filter((n) => !n.read).length === 0 ? (
              <View style={styles.emptyNotifCard}>
                <Text style={styles.emptyNotifTxt}>✅ Your pantry is in perfect shape. No active alerts.</Text>
              </View>
            ) : (
              <FlatList
                data={notifications.filter((n) => !n.read)}
                keyExtractor={(item) => item._id}
                renderItem={renderAlertItem}
                scrollEnabled={false}
              />
            )}
          </>
        )}
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
    padding: 20,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  welcomeText: {
    fontSize: 15,
    color: THEME.textMuted,
    fontWeight: '500'
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 20
  },
  loader: {
    marginTop: 40
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  summaryCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    width: '48%',
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  summaryCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.warning
  },
  summaryCardDanger: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.danger
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  summaryVal: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    marginTop: 8
  },
  warningText: {
    color: THEME.warning
  },
  dangerText: {
    color: THEME.danger
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  actionBtn: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    width: '30%',
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  actionBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text
  },
  emptyNotifCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  emptyNotifTxt: {
    color: '#15803D',
    fontWeight: '600',
    fontSize: 14
  },
  alertCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  alertCardErr: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: THEME.danger
  },
  alertCardWarn: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: THEME.warning
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  alertTextErr: {
    color: THEME.danger
  },
  alertTextWarn: {
    color: THEME.warning
  },
  dismissBtn: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '700'
  },
  alertMsg: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  }
});

export default DashboardScreen;
