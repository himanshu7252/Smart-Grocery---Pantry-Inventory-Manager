import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '../constants';
import SvgIcon from './SvgIcon';

interface QuantityStepperProps {
  quantity: number;
  unit: string;
  onDecrease: () => void;
  onIncrease: () => void;
  loading?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  unit,
  onDecrease,
  onIncrease,
  loading = false
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, quantity <= 0 && styles.disabledButton]}
        onPress={onDecrease}
        disabled={quantity <= 0 || loading}
      >
        <SvgIcon name="minus" size={16} color={quantity <= 0 ? '#CBD5E1' : '#475569'} />
      </TouchableOpacity>

      <View style={styles.quantityContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={THEME.primary} />
        ) : (
          <Text style={styles.quantityText}>
            {quantity} <Text style={styles.unitText}>{unit}</Text>
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onIncrease}
        disabled={loading}
      >
        <SvgIcon name="plus" size={16} color="#475569" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2
  },
  button: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  disabledButton: {
    backgroundColor: '#F8FAFC',
    elevation: 0
  },
  quantityContainer: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textMuted
  }
});

export default QuantityStepper;
