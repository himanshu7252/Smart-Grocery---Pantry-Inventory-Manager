import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  fetchShoppingList,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  ShoppingItem
} from '../store/shoppingListSlice';
import { THEME } from '../constants';
import { useTheme } from '../hooks/useTheme';
import SvgIcon from '../components/SvgIcon';

export const ShoppingListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { list, loading } = useAppSelector((state) => state.shoppingList);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [addLoading, setAddLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(() => {
    dispatch(fetchShoppingList());
  }, [dispatch]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchShoppingList()).finally(() => setRefreshing(false));
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    const qty = parseFloat(newItemQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Quantity must be a positive number');
      return;
    }

    setAddLoading(true);
    try {
      await dispatch(
        addShoppingItem({
          name: newItemName,
          quantity: qty,
          unit: newItemUnit,
          itemId: null // manual item
        })
      ).unwrap();
      setNewItemName('');
      setNewItemQty('1');
      setNewItemUnit('pcs');
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to add item to shopping list');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleComplete = async (item: ShoppingItem) => {
    try {
      if (!item.completed && item.itemId) {
        // If checking off an item linked to inventory, warn that it restocks inventory!
        Alert.alert(
          'Restock Item',
          `Checking off ${item.name} will automatically add +${item.quantity} ${item.unit} to your Pantry Stock. Proceed?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restock',
              onPress: async () => {
                await dispatch(
                  updateShoppingItem({ itemId: item._id, completed: !item.completed })
                ).unwrap();
              }
            }
          ]
        );
      } else {
        await dispatch(
          updateShoppingItem({ itemId: item._id, completed: !item.completed })
        ).unwrap();
      }
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update item state');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await dispatch(deleteShoppingItem(itemId)).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to remove item');
    }
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => {
    return (
      <View style={[styles.itemRow, item.completed && styles.itemRowCompleted]}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleToggleComplete(item)}
        >
          <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
            {item.completed && <SvgIcon name="check" size={14} color="#FFFFFF" />}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.itemName, item.completed && styles.itemNameCompleted]}>
              {item.name}
            </Text>
            {item.itemId && (
              <Text style={styles.linkedText}> Smart Link to Pantry</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.itemRight}>
          <Text style={[styles.itemQty, item.completed && styles.itemQtyCompleted]}>
            {item.quantity} {item.unit}
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteItem(item._id)}
          >
            <SvgIcon name="trash" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const uncompletedItems = list?.items.filter((i) => !i.completed) || [];
  const completedItems = list?.items.filter((i) => i.completed) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Quick Add Bar */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.input}
          placeholder="Buy milk, eggs, bread..."
          placeholderTextColor="#94A3B8"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          style={styles.qtyInput}
          placeholder="Qty"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={newItemQty}
          onChangeText={setNewItemQty}
        />
        <TextInput
          style={styles.unitInput}
          placeholder="Unit"
          placeholderTextColor="#94A3B8"
          value={newItemUnit}
          onChangeText={setNewItemUnit}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem} disabled={addLoading}>
          {addLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <SvgIcon name="plus" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {uncompletedItems.length === 0 && completedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Shopping List is Empty</Text>
              <Text style={styles.emptySubText}>
                Low-stock items will automatically show up here, or you can add items manually at the top!
              </Text>
            </View>
          ) : (
            <>
              {/* Needs to Buy Section */}
              {uncompletedItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Needed Items ({uncompletedItems.length})</Text>
                  <FlatList
                    data={uncompletedItems}
                    keyExtractor={(item) => item._id}
                    renderItem={renderShoppingItem}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Already Carted / Checked Section */}
              {completedItems.length > 0 && (
                <View style={[styles.section, styles.completedSection]}>
                  <Text style={styles.sectionTitle}>Bought Items ({completedItems.length})</Text>
                  <FlatList
                    data={completedItems}
                    keyExtractor={(item) => item._id}
                    renderItem={renderShoppingItem}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: typeof THEME) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  addBar: {
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',

  },
  input: {
    flex: 2,
    backgroundColor: theme.card,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text
  },
  qtyInput: {
    width: 50,
    backgroundColor: theme.card,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    marginLeft: 6,
    textAlign: 'center'
  },
  unitInput: {
    width: 60,
    backgroundColor: theme.card,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    marginLeft: 6,
    textAlign: 'center'
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  loader: {
    marginTop: 40
  },
  section: {
    marginBottom: 20
  },
  completedSection: {
    opacity: 0.8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4
  },
  itemRow: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: theme.border
  },
  itemRowCompleted: {
    backgroundColor: theme.card
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  textContainer: {
    flex: 1
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textMuted
  },
  linkedText: {
    fontSize: 10,
    color: theme.secondary,
    fontWeight: '700',
    marginTop: 2
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginRight: 16
  },
  itemQtyCompleted: {
    color: theme.textMuted
  },
  deleteBtn: {
    padding: 4
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMuted
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18
  }
});

export default ShoppingListScreen;
