import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  Modal
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { deleteGrocery, consumeGrocery, purchaseGrocery } from '../store/inventorySlice';
import api from '../services/api';
import { THEME } from '../constants';
import SvgIcon from '../components/SvgIcon';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';

type GroceryDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroceryDetails'>;
type DetailsRouteProp = RouteProp<RootStackParamList, 'GroceryDetails'>;

interface Props {
  navigation: GroceryDetailsScreenNavigationProp;
  route: DetailsRouteProp;
}

interface HistoryLog {
  _id: string;
  type: 'PURCHASE' | 'CONSUMPTION' | 'ADJUSTMENT' | 'WASTE';
  quantity: number;
  reason: string;
  createdAt: string;
}

export const GroceryDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId } = route.params;
  const dispatch = useAppDispatch();

  // Get item from inventory slice
  const item = useAppSelector((state) =>
    state.inventory.items.find((i) => i._id === itemId)
  );

  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal actions
  const [modalType, setModalType] = useState<'consume' | 'purchase' | null>(null);
  const [modalAmount, setModalAmount] = useState('1');
  const [modalReason, setModalReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/inventory/${itemId}/history`);
      if (res.data?.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching transaction logs:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (item) {
      loadHistory();
    }
  }, [itemId, item?.quantity]);

  const handleDelete = () => {
    Alert.alert(
      'Remove Product',
      `Are you sure you want to delete ${item?.name} from your pantry list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteGrocery(itemId)).unwrap();
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err || 'Failed to delete grocery item');
            }
          }
        }
      ]
    );
  };

  const handleActionSubmit = async () => {
    const qty = parseFloat(modalAmount);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive quantity');
      return;
    }

    setModalLoading(true);
    try {
      if (modalType === 'consume') {
        if (item && item.quantity < qty) {
          Alert.alert(
            'Insufficient Stock',
            `You only have ${item.quantity} ${item.unit} available.`
          );
          setModalLoading(false);
          return;
        }
        await dispatch(
          consumeGrocery({
            id: itemId,
            amount: qty,
            reason: modalReason || undefined
          })
        ).unwrap();
      } else if (modalType === 'purchase') {
        await dispatch(
          purchaseGrocery({
            id: itemId,
            amount: qty,
            reason: modalReason || undefined
          })
        ).unwrap();
      }
      setModalType(null);
      setModalAmount('1');
      setModalReason('');
    } catch (err: any) {
      Alert.alert('Action Failed', err || 'Failed to update stock levels');
    } finally {
      setModalLoading(false);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product details not found or removed.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditGrocery', { itemId })}
            style={styles.actionIcon}
          >
            <SvgIcon name="edit" size={20} color={THEME.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionIcon}>
            <SvgIcon name="trash" size={20} color={THEME.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Main Details Panel */}
        <View style={styles.detailsCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.nameText}>{item.name}</Text>
          {item.brand ? <Text style={styles.brandText}>{item.brand}</Text> : null}

          {item.location ? (
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>📍 Stored in: {item.location}</Text>
            </View>
          ) : null}

          {/* Large Quantity Callout */}
          <View style={styles.quantityCallout}>
            <Text style={styles.quantityLabel}>Current Available Stock</Text>
            <Text style={styles.quantityValue}>
              {item.quantity} <Text style={styles.unitText}>{item.unit}</Text>
            </Text>
          </View>

          {/* Quick Logs Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={() => setModalType('consume')}
            >
              <Text style={styles.btnTxt}>Log Usage (-)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => setModalType('purchase')}
            >
              <Text style={styles.btnTxt}>Restock (+)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Specifications List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Specifications</Text>
          <View style={styles.specCard}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Minimum Safety Stock</Text>
              <Text style={styles.specValue}>
                {item.minimumStock} {item.unit}
              </Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Estimated Cost</Text>
              <Text style={styles.specValue}>${item.purchasePrice}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Barcode ID</Text>
              <Text style={styles.specValue}>{item.barcode || 'Not Specified'}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Expiry Date</Text>
              <Text style={[styles.specValue, styles.expiryValue]}>
                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'No Expiry Set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {item.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* Historical Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pantry Log History</Text>
          {historyLoading ? (
            <ActivityIndicator size="small" color={THEME.primary} style={styles.logsLoader} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyLogsText}>No stock logs recorded for this item yet.</Text>
          ) : (
            <View style={styles.logsContainer}>
              {history.map((log) => {
                const date = new Date(log.createdAt).toLocaleDateString();
                const isAdd = log.type === 'PURCHASE';
                return (
                  <View key={log._id} style={styles.logRow}>
                    <View style={styles.logLeft}>
                      <View
                        style={[
                          styles.logIconBg,
                          { backgroundColor: isAdd ? '#D1FAE5' : '#FEE2E2' }
                        ]}
                      >
                        <Text style={{ fontSize: 12 }}>{isAdd ? '📈' : '📉'}</Text>
                      </View>
                      <View>
                        <Text style={styles.logType}>
                          {log.type} {log.reason ? `(${log.reason})` : ''}
                        </Text>
                        <Text style={styles.logDate}>{date}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.logQtyText,
                        { color: isAdd ? THEME.primary : THEME.danger }
                      ]}
                    >
                      {isAdd ? '+' : '-'}
                      {log.quantity} {item.unit}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Adjustments Modal */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'consume' ? 'Log Item Consumption' : 'Restock Pantry Stock'}
            </Text>

            <Text style={styles.modalLabel}>Quantity ({item.unit})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={modalAmount}
              onChangeText={setModalAmount}
            />

            <Text style={styles.modalLabel}>Reason / Source (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={
                modalType === 'consume' ? 'e.g. baking cake, wasted' : 'e.g. Safeway purchase'
              }
              placeholderTextColor="#94A3B8"
              value={modalReason}
              onChangeText={setModalReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setModalType(null);
                  setModalAmount('1');
                  setModalReason('');
                }}
                disabled={modalLoading}
              >
                <Text style={styles.modalBtnTxtCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleActionSubmit}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnTxtSubmit}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  headerBackText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700'
  },
  headerActions: {
    flexDirection: 'row'
  },
  actionIcon: {
    marginLeft: 18,
    padding: 2
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 20
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  categoryText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700'
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text
  },
  brandText: {
    fontSize: 15,
    color: THEME.textMuted,
    marginTop: 4
  },
  locationContainer: {
    marginTop: 8
  },
  locationText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  quantityCallout: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.text,
    marginTop: 6
  },
  unitText: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.textMuted
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btn: {
    width: '48%',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1
  },
  btnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  btnPrimary: {
    backgroundColor: THEME.primary
  },
  btnTxt: {
    fontSize: 14,
    fontWeight: '700'
  },
  btnDangerTxt: {
    color: THEME.danger
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8
  },
  specCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    borderWidth: 1,
    borderColor: THEME.border
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  specLabel: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '500'
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text
  },
  expiryValue: {
    color: THEME.warning
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20
  },
  logsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 1,
    borderWidth: 1,
    borderColor: THEME.border
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  logType: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text
  },
  logDate: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2
  },
  logQtyText: {
    fontSize: 14,
    fontWeight: '700'
  },
  emptyLogsText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    paddingLeft: 4
  },
  logsLoader: {
    paddingVertical: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 8
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 16
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10
  },
  modalBtnCancel: {
    backgroundColor: '#F1F5F9'
  },
  modalBtnSubmit: {
    backgroundColor: THEME.primary
  },
  modalBtnTxtCancel: {
    color: '#475569',
    fontWeight: '700'
  },
  modalBtnTxtSubmit: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  errorText: {
    fontSize: 16,
    color: THEME.textMuted,
    fontWeight: '500',
    textAlign: 'center'
  },
  backText: {
    fontSize: 15,
    color: THEME.primary,
    fontWeight: '700',
    marginTop: 12
  },
  backBtn: {
    marginTop: 16
  },
  iconBtn: {
    paddingVertical: 4
  }
});

export default GroceryDetailsScreen;
