import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchInventory, consumeGrocery, purchaseGrocery, GroceryItem } from '../store/inventorySlice';
import { THEME, CATEGORIES } from '../constants';
import SvgIcon from '../components/SvgIcon';
import QuantityStepper from '../components/QuantityStepper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type InventoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: InventoryScreenNavigationProp;
}

export const InventoryScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.inventory);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('recentlyAdded');
  const [refreshing, setRefreshing] = useState(false);
  const [stepperLoadingId, setStepperLoadingId] = useState<string | null>(null);

  const loadInventory = () => {
    dispatch(
      fetchInventory({
        search: search || undefined,
        category: selectedCategory || undefined,
        filter: selectedFilter || undefined,
        sort: selectedSort
      })
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [search, selectedCategory, selectedFilter, selectedSort])
  );

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(
      fetchInventory({
        search: search || undefined,
        category: selectedCategory || undefined,
        filter: selectedFilter || undefined,
        sort: selectedSort
      })
    ).finally(() => setRefreshing(false));
  };

  const handleIncrease = async (item: GroceryItem) => {
    setStepperLoadingId(item._id);
    try {
      await dispatch(purchaseGrocery({ id: item._id, amount: 1 })).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      setStepperLoadingId(null);
    }
  };

  const handleDecrease = async (item: GroceryItem) => {
    if (item.quantity <= 0) return;
    setStepperLoadingId(item._id);
    try {
      await dispatch(consumeGrocery({ id: item._id, amount: 1 })).unwrap();
    } catch (err) {
      console.error(err);
    } finally {
      setStepperLoadingId(null);
    }
  };

  const getExpiryStatus = (expiryDateStr: string | null, qty: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: '#64748B', bg: '#F1F5F9' };
    if (!expiryDateStr) return null;

    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: THEME.danger, bg: '#FEF2F2' };
    } else if (daysUntilExpiry <= 3) {
      return { label: 'Expiring Soon', color: THEME.warning, bg: '#FFFBEB' };
    }
    return null;
  };

  const renderGroceryItem = ({ item }: { item: GroceryItem }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate, item.quantity);
    const isLowStock = item.minimumStock > 0 && item.quantity <= item.minimumStock;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => navigation.navigate('GroceryDetails', { itemId: item._id })}
        >
          <View style={styles.cardInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.brand ? <Text style={styles.itemBrand}>{item.brand}</Text> : null}
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
              {item.location ? (
                <View style={styles.locationBadge}>
                  <Text style={styles.locationBadgeText}>📍 {item.location}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <SvgIcon name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <View style={styles.stepperContainer}>
            <QuantityStepper
              quantity={item.quantity}
              unit={item.unit}
              onIncrease={() => handleIncrease(item)}
              onDecrease={() => handleDecrease(item)}
              loading={stepperLoadingId === item._id}
            />
          </View>
          <View style={styles.statusContainer}>
            {isLowStock && item.quantity > 0 && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockBadgeText}>Low Stock</Text>
              </View>
            )}
            {expiryStatus && (
              <View style={[styles.statusBadge, { backgroundColor: expiryStatus.bg }]}>
                <Text style={[styles.statusBadgeText, { color: expiryStatus.color }]}>
                  {expiryStatus.label}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, brand, barcode..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories Row */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sub Filter Status bar */}
      <View style={styles.statusFiltersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterScroll}>
          <TouchableOpacity
            style={[styles.statusFilterChip, !selectedFilter && styles.statusFilterChipActive]}
            onPress={() => setSelectedFilter('')}
          >
            <Text style={[styles.statusFilterText, !selectedFilter && styles.statusFilterTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
          {[
            { id: 'lowStock', name: '⚠️ Low Stock' },
            { id: 'expiringSoon', name: '⏳ Expiring Soon' },
            { id: 'expired', name: '❌ Expired' },
            { id: 'available', name: '📦 In Stock' },
            { id: 'outOfStock', name: '📭 Out of Stock' }
          ].map((filt) => (
            <TouchableOpacity
              key={filt.id}
              style={[styles.statusFilterChip, selectedFilter === filt.id && styles.statusFilterChipActive]}
              onPress={() => setSelectedFilter(filt.id)}
            >
              <Text style={[styles.statusFilterText, selectedFilter === filt.id && styles.statusFilterTextActive]}>
                {filt.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sorting bar */}
      <View style={styles.sortingBar}>
        <Text style={styles.sortingLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'recentlyAdded', name: 'Recent' },
            { id: 'alphabetical', name: 'A-Z' },
            { id: 'expiryDate', name: 'Expiry' },
            { id: 'quantity', name: 'Stock' },
            { id: 'price', name: 'Price' }
          ].map((sortOption) => (
            <TouchableOpacity
              key={sortOption.id}
              style={[styles.sortBtn, selectedSort === sortOption.id && styles.sortBtnActive]}
              onPress={() => setSelectedSort(sortOption.id)}
            >
              <Text style={[styles.sortBtnTxt, selectedSort === sortOption.id && styles.sortBtnTxtActive]}>
                {sortOption.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={THEME.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderGroceryItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Empty pantry list</Text>
              <Text style={styles.emptySubText}>Add groceries using the floating button below!</Text>
            </View>
          }
        />
      )}

      {/* Floating Add FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddGrocery')}>
        <SvgIcon name="plus" color="#FFFFFF" size={26} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 16,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  filtersWrapper: {
    paddingVertical: 4
  },
  categoryScroll: {
    paddingHorizontal: 16
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    height: 38
  },
  categoryChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  categoryChipText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  categoryChipTextActive: {
    color: '#FFFFFF'
  },
  statusFiltersWrapper: {
    paddingVertical: 4
  },
  statusFilterScroll: {
    paddingHorizontal: 16
  },
  statusFilterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border
  },
  statusFilterChipActive: {
    backgroundColor: '#334155',
    borderColor: '#334155'
  },
  statusFilterText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  statusFilterTextActive: {
    color: '#FFFFFF'
  },
  sortingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  sortingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
    marginRight: 8
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 4
  },
  sortBtnActive: {
    backgroundColor: '#E2E8F0'
  },
  sortBtnTxt: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '600'
  },
  sortBtnTxtActive: {
    color: THEME.text,
    fontWeight: '700'
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80
  },
  loader: {
    marginTop: 40
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text
  },
  itemBrand: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap'
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  locationBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4
  },
  locationBadgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  stepperContainer: {
    flexDirection: 'row'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  lowStockBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6
  },
  lowStockBadgeText: {
    fontSize: 11,
    color: THEME.warning,
    fontWeight: '700'
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textMuted
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  }
});

export default InventoryScreen;
