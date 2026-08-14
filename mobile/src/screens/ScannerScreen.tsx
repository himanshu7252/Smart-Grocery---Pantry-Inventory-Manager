import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAppDispatch } from '../hooks/redux';
import { addGrocery } from '../store/inventorySlice';
import { THEME } from '../constants';
import SvgIcon from '../components/SvgIcon';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type ScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Scanner'>;

interface Props {
  navigation: ScannerScreenNavigationProp;
}

const MOCK_BARCODES = [
  { name: 'Diet Coke (Can)', barcode: '049000028916', category: 'Beverages' },
  { name: 'Organic Milk (1L)', barcode: '12345678', category: 'Dairy' },
  { name: 'Whole Wheat Bread', barcode: '072250037129', category: 'Grains' },
  { name: 'Russet Potatoes (1kg)', barcode: '033383180293', category: 'Vegetables' }
];

const MOCK_RECEIPT_ITEMS = [
  { name: 'Organic Milk', category: 'Dairy', brand: 'Organic Valley', quantity: 2, unit: 'L', purchasePrice: 1.5, barcode: '12345678', location: 'Fridge' },
  { name: 'Russet Potatoes', category: 'Vegetables', brand: 'FarmFresh', quantity: 1, unit: 'kg', purchasePrice: 3.0, barcode: '033383180293', location: 'Pantry' },
  { name: 'Diet Coke', category: 'Beverages', brand: 'Coca-Cola', quantity: 6, unit: 'cans', purchasePrice: 0.75, barcode: '049000028916', location: 'Cabinet' }
];

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'barcode' | 'ocr'>('barcode');
  const [ocrStep, setOcrStep] = useState<'idle' | 'scanning' | 'parsed'>('idle');
  const [importing, setImporting] = useState(false);

  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTab === 'barcode' || ocrStep === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      laserAnim.setValue(0);
    }
  }, [laserAnim, activeTab, ocrStep]);

  const handleSimulateScan = (barcode: string) => {
    navigation.navigate({
      name: 'AddGrocery',
      params: { scannedBarcode: barcode },
      merge: true
    } as any);
  };

  const handleStartOCR = () => {
    setOcrStep('scanning');
    // Simulate camera snapshot & OCR text processing
    setTimeout(() => {
      setOcrStep('parsed');
    }, 2500);
  };

  const handleImportOCRItems = async () => {
    setImporting(true);
    try {
      // Loop and dispatch addGrocery for each parsed item
      for (const item of MOCK_RECEIPT_ITEMS) {
        await dispatch(addGrocery(item)).unwrap();
      }
      Alert.alert('Import Success', 'Receipt parsed! Imported 3 items into your Pantry stock.', [
        { text: 'OK', onPress: () => navigation.navigate('Main' as any) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to import receipt items');
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Scanner</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'barcode' && styles.tabActive]}
          onPress={() => {
            setActiveTab('barcode');
            setOcrStep('idle');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'barcode' && styles.tabTextActive]}>
            Barcode Scan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ocr' && styles.tabActive]}
          onPress={() => setActiveTab('ocr')}
        >
          <Text style={[styles.tabText, activeTab === 'ocr' && styles.tabTextActive]}>
            Receipt OCR
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'barcode' ? (
        // ---------------- BARCODE UI ----------------
        <View style={{ flex: 1 }}>
          <View style={styles.scannerWrapper}>
            <Text style={styles.instructionText}>Center the product barcode inside the frame</Text>

            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <Animated.View
                style={[
                  styles.laserLine,
                  { transform: [{ translateY: laserAnim }] }
                ]}
              />
            </View>

            <Text style={styles.simLabel}>Select an item to simulate scanning:</Text>
          </View>

          <ScrollView contentContainerStyle={styles.simList}>
            {MOCK_BARCODES.map((item) => (
              <TouchableOpacity
                key={item.barcode}
                style={styles.simItem}
                onPress={() => handleSimulateScan(item.barcode)}
              >
                <View style={styles.simItemLeft}>
                  <Text style={styles.simItemName}>{item.name}</Text>
                  <Text style={styles.simItemBarcode}>Code: {item.barcode}</Text>
                </View>
                <View style={styles.simCategoryTag}>
                  <Text style={styles.simCategoryText}>{item.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        // ---------------- RECEIPT OCR UI ----------------
        <View style={{ flex: 1, padding: 20 }}>
          {ocrStep === 'idle' && (
            <View style={styles.ocrCenter}>
              <Text style={styles.ocrIcon}>🧾</Text>
              <Text style={styles.ocrTitle}>Receipt Scanner (OCR)</Text>
              <Text style={styles.ocrDesc}>
                Take a picture of your store receipt to automatically extract product names, quantities, and prices.
              </Text>
              <TouchableOpacity style={styles.ocrBtn} onPress={handleStartOCR}>
                <Text style={styles.ocrBtnTxt}>Capture Receipt Image</Text>
              </TouchableOpacity>
            </View>
          )}

          {ocrStep === 'scanning' && (
            <View style={styles.ocrCenter}>
              <View style={[styles.targetFrame, { marginBottom: 24 }]}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserAnim }] }
                  ]}
                />
              </View>
              <ActivityIndicator color={THEME.primary} size="large" />
              <Text style={styles.ocrScanTxt}>Uploading & Parsing Receipt OCR Text...</Text>
            </View>
          )}

          {ocrStep === 'parsed' && (
            <ScrollView contentContainerStyle={styles.parsedContainer}>
              <Text style={styles.parsedTitle}>Successfully Extracted Items:</Text>
              <Text style={styles.parsedSub}>Verify details before importing to stock:</Text>

              {MOCK_RECEIPT_ITEMS.map((item, index) => (
                <View key={index} style={styles.parsedItemRow}>
                  <View>
                    <Text style={styles.parsedItemName}>{item.name}</Text>
                    <Text style={styles.parsedItemDetails}>
                      Price: ${item.purchasePrice} | Category: {item.category}
                    </Text>
                  </View>
                  <Text style={styles.parsedItemQty}>
                    +{item.quantity} {item.unit}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.importBtn}
                onPress={handleImportOCRItems}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.importBtnText}>Import 3 Items to Pantry</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelOcrBtn}
                onPress={() => setOcrStep('idle')}
                disabled={importing}
              >
                <Text style={styles.cancelOcrBtnTxt}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 4,
    borderRadius: 8,
    margin: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6
  },
  tabActive: {
    backgroundColor: THEME.primary
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700'
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  scannerWrapper: {
    alignItems: 'center',
    paddingVertical: 20
  },
  instructionText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20
  },
  targetFrame: {
    width: 250,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  laserLine: {
    width: 230,
    height: 3,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 0
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: THEME.primary,
    borderWidth: 4
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8
  },
  simLabel: {
    fontSize: 13,
    color: '#E2E8F0',
    marginTop: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  simList: {
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  simItem: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  simItemLeft: {
    flex: 1
  },
  simItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  simItemBarcode: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  },
  simCategoryTag: {
    backgroundColor: '#334155',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  simCategoryText: {
    fontSize: 11,
    color: '#F1F5F9',
    fontWeight: '600'
  },
  ocrCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  ocrIcon: {
    fontSize: 70,
    marginBottom: 20
  },
  ocrTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8
  },
  ocrDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32
  },
  ocrBtn: {
    height: 48,
    backgroundColor: THEME.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    elevation: 4
  },
  ocrBtnTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  ocrScanTxt: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600'
  },
  parsedContainer: {
    paddingBottom: 40
  },
  parsedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  parsedSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 20
  },
  parsedItemRow: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  parsedItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  parsedItemDetails: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  },
  parsedItemQty: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.primary
  },
  importBtn: {
    height: 48,
    backgroundColor: THEME.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 4
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  cancelOcrBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12
  },
  cancelOcrBtnTxt: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700'
  }
});

export default ScannerScreen;
