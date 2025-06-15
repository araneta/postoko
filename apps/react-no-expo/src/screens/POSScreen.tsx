import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ProductCard from '../components/ProductCard';
import {useStore} from '../store/useStore';
import {PrinterService} from '../services/PrinterService';

const POSScreen = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    createOrder,
    settings,
    formatPrice,
    loading,
  } = useStore();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const change = parseFloat(amountPaid) - total;

  const handlePayment = async () => {
    if (parseFloat(amountPaid) >= total) {
      setProcessing(true);
      try {
        const order = await createOrder('cash');
        if (order) {
          await PrinterService.printReceipt(order, settings.printer);
          Alert.alert('Success', 'Payment completed successfully!');
        }
        setShowPaymentModal(false);
        setAmountPaid('');
      } catch (error) {
        Alert.alert('Error', 'Failed to process payment. Please try again.');
      } finally {
        setProcessing(false);
      }
    }
  };

  const quickAmounts = [10, 20, 50, 100];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.productsContainer}>
        <FlatList
          data={products}
          renderItem={({item}) => (
            <ProductCard product={item} onPress={() => addToCart(item)} />
          )}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
        />
      </View>

      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Current Order</Text>
        <FlatList
          data={cart}
          renderItem={({item}) => (
            <View style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cartItemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() =>
                    updateCartItemQuantity(
                      item.id,
                      Math.max(0, item.quantity - 1),
                    )
                  }
                  style={styles.quantityButton}>
                  <Icon name="remove" size={20} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() =>
                    updateCartItemQuantity(item.id, item.quantity + 1)
                  }
                  style={styles.quantityButton}>
                  <Icon name="add" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Icon name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item.id}
          style={styles.cartList}
        />
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            cart.length === 0 && styles.disabledButton,
          ]}
          disabled={cart.length === 0}
          onPress={() => setShowPaymentModal(true)}>
          <Text style={styles.checkoutButtonText}>Complete Sale</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
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
              <Text style={styles.paymentAmount}>{formatPrice(total)}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.paymentLabel}>Amount Received:</Text>
              <TextInput
                style={styles.paymentInput}
                keyboardType="decimal-pad"
                value={amountPaid}
                onChangeText={setAmountPaid}
                placeholder="0.00"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.quickAmounts}>
              {quickAmounts.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmountPaid(amount.toString())}>
                  <Text style={styles.quickAmountText}>
                    {formatPrice(amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {parseFloat(amountPaid) > 0 && (
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Change:</Text>
                <Text
                  style={[
                    styles.changeAmount,
                    change < 0 ? styles.negativeChange : styles.positiveChange,
                  ]}>
                  {formatPrice(Math.abs(change))}
                </Text>
                {change < 0 && (
                  <Text style={styles.changeStatus}>(Insufficient payment)</Text>
                )}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowPaymentModal(false);
                  setAmountPaid('');
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.completeButton,
                  (change < 0 || processing) && styles.disabledButton,
                ]}
                disabled={change < 0 || processing}
                onPress={handlePayment}>
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.buttonText, styles.completeButtonText]}>
                    Complete Payment
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  productsContainer: {
    flex: 2,
    backgroundColor: '#f8f9fa',
  },
  productsList: {
    padding: 8,
  },
  cartContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
    minWidth: 350,
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e5e5',
  },
  totalText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  inputContainer: {
    marginBottom: 30,
  },
  paymentInput: {
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickAmountButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  changeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  changeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
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
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  completeButton: {
    backgroundColor: '#34C759',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonText: {
    color: 'white',
  },
});

export default POSScreen;