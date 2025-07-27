import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import BarcodeScanner from '../../components/BarcodeScanner';
import PaymentModal from '../../components/PaymentModal';
import CustomAlert from '../../components/CustomAlert';
import useStore from '../../store/useStore';
import { printReceipt } from '../../utils/printer';
import { PaymentDetails } from '../../types';
import { getCustomers } from '../../lib/api';
import { Customer } from '../../types';
import loyaltyService from '../../lib/loyalty';

export default function POSScreen() {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    createOrder, 
    settings, 
    formatPrice,
    checkLowStockAlerts 
  } = useStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [printError, setPrintError] = useState<string | null>(null);
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');







  // Check for low stock alerts when component mounts
  useEffect(() => {
    checkLowStockAlerts();
    // Fetch customers for selection
    (async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers', error);
      }
    })();
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
      visible: false,
      title: '',
      message: '',
      type: 'info',
    });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  const handlePaymentComplete = async (paymentDetails: PaymentDetails[]) => {
    try {
      // Pass customer to createOrder if selected
      const order = selectedCustomer
        ? await createOrder(paymentDetails, selectedCustomer)
        : await createOrder(paymentDetails);
      console.log('order', order);
      setShowPaymentModal(false);

      if (order) {
        await printReceipt(order, settings, formatPrice);
        // Check for low stock alerts after order completion
        await checkLowStockAlerts();
        
        // Award loyalty points if customer exists
        if (selectedCustomer && order.id && order.total) {
          try {
            await loyaltyService.earnPoints({
              customerId: selectedCustomer.id,
              orderId: order.id,
              amount: String(order.total)
            });
            showAlert('Points Earned!', 'Loyalty points have been added to the customer.', 'success');
          } catch (e) {
            let errorMsg = 'Failed to award loyalty points.';
            if (e instanceof Error) errorMsg = e.message;
            else if (typeof e === 'string') errorMsg = e;
            showAlert('Loyalty Error', errorMsg, 'error');
          }
        }
        // Show success alert
        showAlert(
          'Order Completed!',
          `Order #${order.id} has been created successfully.`,
          'success'
        );
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      if (Platform.OS === 'web') {
        console.warn('Print error:', error);
      } else {
        setPrintError('Failed to process payment or print receipt. Please try again.');
        setTimeout(() => setPrintError(null), 3000);
      }
      
      // Show error alert
      let errorMessage = 'Failed to create order. Please try again.';
      
      if (error instanceof Error) {
        try {
          // Try to parse the error message as JSON
          const errorData = JSON.parse(error.message);
          if (errorData.message && errorData.errors) {
            errorMessage = `${errorData.message}: ${errorData.errors.join(', ')}`;
          } else {
            errorMessage = error.message;
          }
        } catch {
          // If it's not JSON, use the error message as is
          errorMessage = error.message;
        }
      }
      
      showAlert(
        'Order Failed',
        errorMessage,
        'error'
      );
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    // Check for low stock alerts when product is added to cart
    checkLowStockAlerts();
  };

  const handleProductScanned = (product: any) => {
    handleAddToCart(product);
  };

  const handleManualBarcodeInput = () => {
    if (barcodeInput.trim()) {
      const product = products.find(p => p.barcode === barcodeInput.trim());
      if (product) {
        handleAddToCart(product);
        setBarcodeInput('');
      } else {
        alert(`No product found with barcode: ${barcodeInput}`);
      }
    }
  };

  const quickAmounts = [10000, 20000, 50000, 100000];

  // Filtered customers for picker modal
  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
     
      {/* Existing POS UI */}
      <View style={styles.container}>
        <View style={styles.productsContainer}>
          <View style={styles.productsHeader}>
            <Text style={styles.productsTitle}>Products</Text>
            <View style={styles.barcodeContainer}>
              <TextInput
                style={styles.barcodeInput}
                placeholder="Enter barcode"
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                onSubmitEditing={handleManualBarcodeInput}
                returnKeyType="search"
              />
              <Pressable
                style={styles.searchButton}
                onPress={handleManualBarcodeInput}>
                <Ionicons name="search" size={16} color="white" />
              </Pressable>
              <Pressable
                style={styles.scanButton}
                onPress={() => setShowScannerModal(true)}>
                <Ionicons name="scan-outline" size={20} color="white" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </Pressable>
            </View>
          </View>
          <FlatList
            data={products}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => handleAddToCart(item)}
              />
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        <View style={styles.cartContainer}>
          {/* Customer Selection */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>Customer:</Text>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                backgroundColor: '#fafafa',
                marginBottom: 4,
              }}
              onPress={() => setShowCustomerModal(true)}
            >
              <Ionicons name="person-circle" size={20} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16 }}>
                {selectedCustomer ? selectedCustomer.name : 'No customer selected'}
              </Text>
            </Pressable>
            <Pressable
              style={{ alignSelf: 'flex-start', marginTop: 2, marginLeft: 2 }}
              onPress={() => setSelectedCustomer(null)}
              disabled={!selectedCustomer}
            >
              <Text style={{ color: selectedCustomer ? '#FF3B30' : '#ccc', fontSize: 12 }}>
                {selectedCustomer ? 'Clear' : ''}
              </Text>
            </Pressable>
          </View>
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
                  {formatPrice(item.price * item.quantity)}
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
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
          <Pressable
            style={[styles.checkoutButton, cart.length === 0 && styles.disabledButton]}
            disabled={cart.length === 0}
            onPress={() => setShowPaymentModal(true)}>
            <Text style={styles.checkoutButtonText}>Complete Sale</Text>
          </Pressable>
        </View>

        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          total={total}
          formatPrice={formatPrice}
          cart={cart}
        />
        {/* Customer Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCustomerModal}
          onRequestClose={() => setShowCustomerModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, width: 350, maxHeight: 500 }}>
              <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16 }}>Select Customer</Text>
              {/* Search Box */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search customers by name or email"
                  value={searchCustomer}
                  onChangeText={setSearchCustomer}
                  autoCapitalize="none"
                />
              </View>
              <FlatList
                data={filteredCustomers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <Ionicons name="person-circle" size={24} color="#007AFF" style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.name}</Text>
                      <Text style={{ fontSize: 13, color: '#888' }}>{item.email}</Text>
                    </View>
                  </Pressable>
                )}
                style={{ maxHeight: 350 }}
              />
              <Pressable
                style={{ marginTop: 16, alignSelf: 'flex-end' }}
                onPress={() => setShowCustomerModal(false)}
              >
                <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showScannerModal}
          onRequestClose={() => setShowScannerModal(false)}>
          <BarcodeScanner
            onProductScanned={handleProductScanned}
            onClose={() => setShowScannerModal(false)}
          />
        </Modal>

        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          type={customAlert.type}
          onClose={hideAlert}
        />
      </View>
    </ScrollView>
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
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  barcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    color: '#333',
  },
});