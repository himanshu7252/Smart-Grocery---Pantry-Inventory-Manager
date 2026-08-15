import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAppDispatch } from '../hooks/redux';
import { addGrocery } from '../store/inventorySlice';
import { THEME, CATEGORIES, UNITS } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type AddGroceryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddGrocery'>;

interface Props {
  navigation: AddGroceryScreenNavigationProp;
}

export const AddGroceryScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const styles = getStyles(theme);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Other');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [minimumStock, setMinimumStock] = useState('0');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);



  const validate = () => {
    if (!name.trim()) {
      setValidationError('Product Name is required');
      return false;
    }
    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal < 0) {
      setValidationError('Quantity must be a positive number');
      return false;
    }
    const minStockVal = parseFloat(minimumStock);
    if (isNaN(minStockVal) || minStockVal < 0) {
      setValidationError('Minimum stock must be a non-negative number');
      return false;
    }
    const priceVal = parseFloat(purchasePrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setValidationError('Purchase Price must be a non-negative number');
      return false;
    }
    if (expiryDate && isNaN(Date.parse(expiryDate))) {
      setValidationError('Expiry Date must be valid format (YYYY-MM-DD)');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = {
        name,
        category,
        brand,
        quantity: parseFloat(quantity),
        unit,
        minimumStock: parseFloat(minimumStock),
        purchasePrice: parseFloat(purchasePrice),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        barcode: '',
        location,
        notes
      };

      await dispatch(addGrocery(data)).unwrap();
      navigation.goBack();
    } catch (err: any) {
      setValidationError(err || 'Failed to save grocery item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Grocery Item</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
            {loading ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {validationError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Organic Milk"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setValidationError(null);
            }}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Organic Valley"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Storage Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fridge, Pantry"
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitPicker}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Minimum Stock Threshold</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={minimumStock}
                onChangeText={setMinimumStock}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Purchase Price ($)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
              />
            </View>
          </View>

          <Text style={styles.label}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            value={expiryDate}
            onChangeText={setExpiryDate}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add special notes..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};const getStyles = (theme: typeof THEME) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  keyboardContainer: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text
  },
  saveBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  saveBtnText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '700'
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  errorCard: {
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
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
    marginTop: 12
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 16,
    color: theme.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.border
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfCol: {
    width: '48%'
  },
  categoryPicker: {
    paddingVertical: 4,
    marginBottom: 8
  },
  categoryChip: {
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: theme.border
  },
  categoryChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  categoryChipText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  categoryChipTextActive: {
    color: '#FFFFFF'
  },
  unitPicker: {
    paddingVertical: 4
  },
  unitChip: {
    backgroundColor: theme.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 4,
    borderWidth: 1,
    borderColor: theme.border
  },
  unitChipActive: {
    backgroundColor: '#334155',
    borderColor: '#334155'
  },
  unitChipText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  unitChipTextActive: {
    color: '#FFFFFF'
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top'
  }
});

export default AddGroceryScreen;
