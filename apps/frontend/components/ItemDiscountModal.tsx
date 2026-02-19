import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';
import useStore from '../store/useStore';

interface ItemDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  cartItem: CartItem | null;
  onUpdateItemDiscount: (itemId: string, discountValue: number, discountType: 'percentage' | 'fixed_amount') => void;
  onRemoveItemDiscount: (itemId: string) => void;
}

export const ItemDiscountModal: React.FC<ItemDiscountModalProps> = ({
  visible,
  onClose,
  cartItem,
  onUpdateItemDiscount,
  onRemoveItemDiscount,
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const { formatPrice } = useStore();

  if (!cartItem) return null;

  const itemTotal = cartItem.price * cartItem.quantity;
  const currentDiscount = cartItem.discountAmount || 0;
  const currentPrice = itemTotal - currentDiscount;

  const calculateDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return 0;
    
    if (discountType === 'percentage') {
      return Math.min((itemTotal * value) / 100, itemTotal);
    } else {
      return Math.min(value, itemTotal);
    }
  };

  const discountAmount = calculateDiscount();
  const newTotal = itemTotal - discountAmount;

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      return;
    }
    
    onUpdateItemDiscount(cartItem.id, value, discountType);
    setDiscountValue('');
    onClose();
  };

  const handleRemoveDiscount = () => {
    onRemoveItemDiscount(cartItem.id);
    setDiscountValue('');
    onClose();
  };

  const handleClose = () => {
    setDiscountValue('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Item Discount</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{cartItem.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetail}>
                {cartItem.quantity} × {formatPrice(cartItem.price)} = {formatPrice(itemTotal)}
              </Text>
              {currentDiscount > 0 && (
                <Text style={styles.currentDiscount}>
                  Current discount: -{formatPrice(currentDiscount)}
                </Text>
              )}
              <Text style={styles.currentPrice}>
                Current price: {formatPrice(currentPrice)}
              </Text>
            </View>
          </View>

          {/* Discount Type Selection */}
          <View style={styles.discountTypeSection}>
            <Text style={styles.sectionTitle}>Discount Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  discountType === 'percentage' && styles.typeButtonActive
                ]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[
                  styles.typeButtonText,
                  discountType === 'percentage' && styles.typeButtonTextActive
                ]}>
                  Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  discountType === 'fixed_amount' && styles.typeButtonActive
                ]}
                onPress={() => setDiscountType('fixed_amount')}
              >
                <Text style={[
                  styles.typeButtonText,
                  discountType === 'fixed_amount' && styles.typeButtonTextActive
                ]}>
                  Fixed Amount
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Discount Input */}
          <View style={styles.discountInputSection}>
            <Text style={styles.sectionTitle}>
              Discount Value {discountType === 'percentage' ? '(%)' : ''}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.discountInput}
                value={discountValue}
                onChangeText={setDiscountValue}
                placeholder={discountType === 'percentage' ? '0' : '0.00'}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>
                {discountType === 'percentage' ? '%' : formatPrice(0).split(' ')[0]}
              </Text>
            </View>
          </View>

          {/* Discount Preview */}
          {discountValue && !isNaN(parseFloat(discountValue)) && parseFloat(discountValue) > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Original Total:</Text>
                  <Text style={styles.previewValue}>{formatPrice(itemTotal)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Discount:</Text>
                  <Text style={styles.previewDiscount}>-{formatPrice(discountAmount)}</Text>
                </View>
                <View style={[styles.previewRow, styles.previewRowBorder]}>
                  <Text style={styles.previewLabel}>New Total:</Text>
                  <Text style={styles.previewNewTotal}>{formatPrice(newTotal)}</Text>
                </View>
                {discountType === 'percentage' && (
                  <Text style={styles.percentageNote}>
                    {discountValue}% of {formatPrice(itemTotal)} = {formatPrice(discountAmount)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Quick Discount Buttons */}
          <View style={styles.quickDiscountSection}>
            <Text style={styles.sectionTitle}>Quick Discounts</Text>
            <View style={styles.quickButtons}>
              {(discountType === 'percentage' ? [10, 15, 20, 25, 50] : [5, 10, 20, 50]).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickButton}
                  onPress={() => setDiscountValue(value.toString())}
                >
                  <Text style={styles.quickButtonText}>
                    {discountType === 'percentage' ? `${value}%` : formatPrice(value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {currentDiscount > 0 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveDiscount}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.removeButtonText}>Remove Discount</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.applyButton,
              (!discountValue || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) <= 0) && styles.applyButtonDisabled
            ]}
            onPress={handleApplyDiscount}
            disabled={!discountValue || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) <= 0}
          >
            <Text style={styles.applyButtonText}>Apply Discount</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetail: {
    fontSize: 16,
    color: '#666',
  },
  currentDiscount: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  discountTypeSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  discountInputSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  discountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  inputSuffix: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  previewSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  previewRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewDiscount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  previewNewTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  percentageNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  quickDiscountSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
