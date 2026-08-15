import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { THEME } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { useAppSelector } from '../hooks/redux';

interface CategoryData {
  _id: string;
  count: number;
  totalQuantity: number;
  totalValue: number;
}

interface PredictionData {
  itemId: string;
  name: string;
  category: string;
  currentQuantity: number;
  unit: string;
  avgDailyConsumption: number;
  daysRemaining: number | null;
  message: string;
}

interface ActivityStat {
  _id: 'PURCHASE' | 'CONSUMPTION' | 'ADJUSTMENT' | 'WASTE';
  totalQuantity: number;
  count: number;
}

export const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const styles = getStyles(theme, darkMode);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [activities, setActivities] = useState<ActivityStat[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch charts analytics
      const analyticsRes = await api.get('/dashboard/analytics');
      if (analyticsRes.data?.success) {
        setCategories(analyticsRes.data.data.categoryBreakdown || []);
        setActivities(analyticsRes.data.data.activityStats || []);
      }

      // Fetch predictions
      const predictionsRes = await api.get('/dashboard/restock-predictions');
      if (predictionsRes.data?.success) {
        setPredictions(predictionsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  // Get total inventory items value
  const totalValue = categories.reduce((sum, c) => sum + c.totalValue, 0);

  // Parse activity values
  const getQty = (type: string) => {
    const act = activities.find((a) => a._id === type);
    return act ? act.totalQuantity : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : (
          <>
            {/* Inventory Valuation Panel */}
            <View style={styles.valueCard}>
              <Text style={styles.valueLabel}>Estimated Pantry Value</Text>
              <Text style={styles.valueNumber}>${totalValue.toFixed(2)}</Text>
              <Text style={styles.valueSubtext}>Based on cost details of stocked items</Text>
            </View>

            {/* Consumption and Waste Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Consumed (30d)</Text>
                <Text style={styles.statsNumber}>{getQty('CONSUMPTION')} Units</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Wasted (30d)</Text>
                <Text style={[styles.statsNumber, getQty('WASTE') > 0 && { color: THEME.danger }]}>
                  {getQty('WASTE')} Units
                </Text>
              </View>
            </View>

            {/* Category Allocations */}
            <Text style={styles.sectionTitle}>Category Stock Valuation</Text>
            <View style={styles.card}>
              {categories.length === 0 ? (
                <Text style={styles.emptyText}>No category distribution records found.</Text>
              ) : (
                categories.map((item) => {
                  const pct = totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0;
                  return (
                    <View key={item._id} style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{item._id}</Text>
                        <Text style={styles.categoryVal}>
                          ${item.totalValue.toFixed(2)} ({item.count} items)
                        </Text>
                      </View>
                      {/* Bar indicator */}
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Restock Predictions */}
            <Text style={styles.sectionTitle}>💡 Restock Predictions</Text>
            <Text style={styles.descriptionText}>
              Estimated remaining stock based on daily average usage logs over the last 30 days.
            </Text>

            {predictions.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>No pantry items added to compile predictions.</Text>
              </View>
            ) : (
              predictions.map((p) => {
                const isUrgent = p.daysRemaining !== null && p.daysRemaining <= 3;
                const isWarning = p.daysRemaining !== null && p.daysRemaining > 3 && p.daysRemaining <= 7;
                return (
                  <View key={p.itemId} style={styles.predictionCard}>
                    <View style={styles.predictionHeader}>
                      <Text style={styles.predictionName}>{p.name}</Text>
                      <View
                        style={[
                          styles.badge,
                          isUrgent
                            ? styles.badgeDanger
                            : isWarning
                            ? styles.badgeWarning
                            : styles.badgeSuccess
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isUrgent
                              ? styles.badgeTextDanger
                              : isWarning
                              ? styles.badgeTextWarning
                              : styles.badgeTextSuccess
                          ]}
                        >
                          {p.message}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.predictionDetails}>
                      <View style={styles.predCol}>
                        <Text style={styles.predLabel}>Daily Consumption</Text>
                        <Text style={styles.predVal}>
                          {p.avgDailyConsumption} {p.unit}/day
                        </Text>
                      </View>
                      <View style={styles.predCol}>
                        <Text style={styles.predLabel}>Days Remaining</Text>
                        <Text style={styles.predVal}>
                          {p.daysRemaining !== null ? `${p.daysRemaining} days` : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
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
  loader: {
    marginTop: 40
  },
  valueCard: {
    backgroundColor: darkMode ? '#000000' : '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 3
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  valueNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    marginTop: 6
  },
  valueSubtext: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 6
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  statsCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    width: '48%',
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 1
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 10,
    marginBottom: 8,
    paddingLeft: 4
  },
  descriptionText: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 12,
    paddingHorizontal: 4,
    lineHeight: 18
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
  categoryRow: {
    marginBottom: 14
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text
  },
  categoryVal: {
    fontSize: 12,
    color: theme.textMuted
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3
  },
  progressBarFill: {
    height: 6,
    backgroundColor: theme.primary,
    borderRadius: 3
  },
  predictionCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 1
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10
  },
  predictionName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  badgeDanger: {
    backgroundColor: '#FEF2F2'
  },
  badgeWarning: {
    backgroundColor: '#FFFBEB'
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  badgeTextDanger: {
    color: theme.danger
  },
  badgeTextWarning: {
    color: theme.warning
  },
  badgeTextSuccess: {
    color: '#2E7D32'
  },
  predictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  predCol: {
    width: '48%'
  },
  predLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500'
  },
  predVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    marginTop: 4
  },
  emptyText: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    textAlign: 'center'
  }
});

export default AnalyticsScreen;
