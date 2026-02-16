import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { CartItem, DiscountValidationRequest, DiscountValidationResponse, Customer } from '../types';
import { validateDiscountCode } from '../lib/api';
import CustomAlert from './CustomAlert';
import useStore from '../store/useStore';

interface DiscountValidatorProps {
  visible: boolean;
  onClose: () => void;
  onApplyDiscount: (discount: DiscountValidationResponse) => void;
  cartItems: CartItem[];
  storeId: number;
  customer?: Customer | null;
}

export const DiscountValidator: React.FC<DiscountValidatorProps> = ({
  visible,
  onClose,
  onApplyDiscount,
  cartItems,
  storeId,
  customer,
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<DiscountValidationResponse | null>(null);
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  const {settings} = useStore();
  const currencyCode = settings.currency.code;

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setCustomAlert({
      ...customAlert,
      visible: false,
    });
  };

  const calculateOrderTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleValidateCode = async () => {
    if (!discountCode.trim()) {
      showAlert('Error', 'Please enter a discount code', 'error');
      return;
    }

    try {
      setLoading(true);
      setValidationResult(null);

      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        categoryId: item.categoryId,
      }));

      const request: DiscountValidationRequest = {
        code: discountCode.trim().toUpperCase(),
        storeInfoId: storeId,
        orderItems,
        customerId: customer?.id,
        orderTotal: calculateOrderTotal(),
      };

      console.log('Validating discount code with request:', {
        code: request.code,
        storeInfoId: request.storeInfoId,
        customerId: request.customerId,
        customerName: customer?.name,
        orderTotal: request.orderTotal,
        itemCount: request.orderItems.length
      });

      const result = await validateDiscountCode(request);
      setValidationResult(result);

      if (!result.valid) {
        showAlert('Invalid Code', result.message || 'This discount code is not valid', 'error');
      }
    } catch (error:any) {
      console.error('Failed to validate discount code:', error);
      let errorMsg = JSON.parse(error.message);
      showAlert('Error', errorMsg.error || 'Failed to validate discount code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    if (validationResult && validationResult.valid) {
      onApplyDiscount(validationResult);
      setDiscountCode('');
      setValidationResult(null);
      onClose();
    }
  };

  const handleClose = () => {
    setDiscountCode('');
    setValidationResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Apply Discount</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.orderSummary}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Text style={styles.orderTotal}>
              Subtotal: {currencyCode} {calculateOrderTotal().toFixed(2)}
            </Text>
            <Text style={styles.itemCount}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </Text>
            {customer && (
              <View style={styles.customerInfoContainer}>
                <Text style={styles.customerLabel}>Customer:</Text>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerEmail}>{customer.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.codeSection}>
            <Text style={styles.sectionTitle}>Discount Code</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={discountCode}
                onChangeText={setDiscountCode}
                placeholder="Enter discount code"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.validateButton, loading && styles.validateButtonDisabled]}
                onPress={handleValidateCode}
                disabled={loading}
              >
                <Text style={styles.validateButtonText}>
                  {loading ? 'Checking...' : 'Validate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {validationResult && (
            <View style={styles.resultSection}>
              {validationResult.valid ? (
                <View style={styles.validResult}>
                  <Text style={styles.validTitle}>✅ Valid Discount Code!</Text>
                  
                  {validationResult.promotion && (
                    <View style={styles.promotionInfo}>
                      <Text style={styles.promotionName}>
                        {validationResult.promotion.name}
                      </Text>
                      <Text style={styles.promotionDescription}>
                        {validationResult.promotion.description}
                      </Text>
                    </View>
                  )}

                  <View style={styles.discountDetails}>
                    <Text style={styles.discountAmount}>
                      Discount: -{currencyCode} {validationResult.discountAmount.toFixed(2)}
                    </Text>
                    <Text style={styles.newTotal}>
                      New Total: {currencyCode} {(calculateOrderTotal() - validationResult.discountAmount).toFixed(2)}
                    </Text>
                  </View>

                  {validationResult.eligibleItems.length > 0 && (
                    <View style={styles.eligibleItems}>
                      <Text style={styles.eligibleTitle}>Eligible Items:</Text>
                      {validationResult.eligibleItems.map((item, index) => (
                        <Text key={index} style={styles.eligibleItem}>
                          • {item.quantity}x items - {currencyCode} {(item.totalDiscount || 0).toFixed(2)} off
                        </Text>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyDiscount}
                  >
                    <Text style={styles.applyButtonText}>Apply Discount</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.invalidResult}>
                  <Text style={styles.invalidTitle}>❌ Invalid Code</Text>
                  <Text style={styles.invalidMessage}>
                    {validationResult.message || 'This discount code is not valid'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.quickCodes}>
            <Text style={styles.sectionTitle}>Quick Codes</Text>
            <Text style={styles.quickCodesSubtitle}>
              Tap to try common discount codes
            </Text>
            <View style={styles.quickCodeButtons}>
              {['SAVE10', 'WELCOME20', 'BOGO2024', 'HAPPYHOUR'].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={styles.quickCodeButton}
                  onPress={() => setDiscountCode(code)}
                >
                  <Text style={styles.quickCodeText}>{code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          type={customAlert.type}
          onClose={hideAlert}
        />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  customerInfoContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  customerLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#666',
  },
  codeSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  validateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  validateButtonDisabled: {
    opacity: 0.6,
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultSection: {
    marginBottom: 16,
  },
  validResult: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  validTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 12,
  },
  promotionInfo: {
    marginBottom: 12,
  },
  promotionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#666',
  },
  discountDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  discountAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  newTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eligibleItems: {
    marginBottom: 16,
  },
  eligibleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eligibleItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  applyButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  invalidResult: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  invalidTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  invalidMessage: {
    fontSize: 14,
    color: '#666',
  },
  quickCodes: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  quickCodesSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  quickCodeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCodeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quickCodeText: {
    color: '#333',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});