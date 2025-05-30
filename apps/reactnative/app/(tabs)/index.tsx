import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import useStore from '../../store/useStore';
import { printReceipt } from '../../utils/printer';

export default function POSScreen() {
  const { products, cart, addToCart, removeFromCart, updateCartItemQuantity, createOrder, settings } = useStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [printError, setPrintError] = useState<string | null>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const change = parseFloat(amountPaid) - total;

  const handlePayment = async () => {
    if (parseFloat(amountPaid) >= total) {
      const order = createOrder('cash');
      setShowPaymentModal(false);
      setAmountPaid('');

      try {
        await printReceipt(order, settings.printer);
      } catch (error) {
        if (Platform.OS === 'web') {
          // On web, errors are less critical as the browser handles printing
          console.warn('Print error:', error);
        } else {
          setPrintError('Failed to print receipt. Please check printer connection.');
          setTimeout(() => setPrintError(null), 3000);
        }
      }
    }
  };

  const quickAmounts = [10, 20, 50, 100];

  return (
    <View style={styles.container}>
      <View style={styles.productsContainer}>
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => addToCart(item)}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Current Order</Text>
        {printError && (
          <Text style={styles.errorMessage}>{printError}</Text>
        )}
        <FlatList
          data={cart}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <View style={styles.quantityContainer}>
                <Pressable
                  onPress={() => updateCartItemQuantity(item.id, Math.max(0, item.quantity - 1))}
                  style={styles.quantityButton}>
                  <Ionicons name="remove" size={20} color="#007AFF" />
                </Pressable>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Pressable
                  onPress={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                  style={styles.quantityButton}>
                  <Ionicons name="add" size={20} color="#007AFF" />
                </Pressable>
              </View>
              <Text style={styles.cartItemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
              <Pressable onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>
        <Pressable
          style={[styles.checkoutButton, cart.length === 0 && styles.disabledButton]}
          disabled={cart.length === 0}
          onPress={() => setShowPaymentModal(true)}>
          <Text style={styles.checkoutButtonText}>Complete Sale</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment</Text>
            
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentAmount}>${total.toFixed(2)}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.paymentLabel}>Amount Received:</Text>
              <TextInput
                style={styles.paymentInput}
                keyboardType="decimal-pad"
                value={amountPaid}
                onChangeText={setAmountPaid}
                placeholder="0.00"
              />
            </View>

            <View style={styles.quickAmounts}>
              {quickAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmountPaid(amount.toString())}>
                  <Text style={styles.quickAmountText}>${amount}</Text>
                </Pressable>
              ))}
            </View>

            {parseFloat(amountPaid) > 0 && (
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Change:</Text>
                <Text style={[
                  styles.changeAmount,
                  change < 0 ? styles.negativeChange : styles.positiveChange
                ]}>
                  ${Math.abs(change).toFixed(2)}
                </Text>
                <Text style={styles.changeStatus}>
                  {change < 0 ? '(Insufficient payment)' : ''}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowPaymentModal(false);
                  setAmountPaid('');
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.completeButton,
                  change < 0 && styles.disabledButton
                ]}
                disabled={change < 0}
                onPress={handlePayment}>
                <Text style={[styles.buttonText, styles.completeButtonText]}>
                  Complete Payment
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  productsContainer: {
    flex: 2,
    padding: 8,
  },
  cartContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cartItemName: {
    flex: 1,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityButton: {
    padding: 4,
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  inputContainer: {
    marginBottom: 24,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'right',
    marginTop: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAmountButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  changeContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  changeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  changeAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  positiveChange: {
    color: '#34C759',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  changeStatus: {
    fontSize: 14,
    color: '#FF3B30',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  completeButton: {
    backgroundColor: '#34C759',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonText: {
    color: 'white',
  },
});
