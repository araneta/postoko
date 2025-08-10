import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod, PaymentDetails, CartItem } from '../types';
import paymentService from '../lib/payment';
import {processCardPaymentStripe, getStripeSession, processPaypal} from '../lib/api'; // Import the function to process card payment

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentDetails: PaymentDetails[]) => void;
  total: number;
  formatPrice: (price: number) => string;
  cart: CartItem[];
}

interface CustomAlert {
  visible: boolean;
  title: string;
  message: string;
}

export default function PaymentModal({
  visible,
  onClose,
  onPaymentComplete,
  total,
  formatPrice,
  cart
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletType, setWalletType] = useState<'apple_pay' | 'google_pay' | 'paypal'>('apple_pay');
  const [customAlert, setCustomAlert] = useState<CustomAlert>({
    visible: false,
    title: '',
    message: '',
  });
  let interval: NodeJS.Timeout;
  // Get available payment methods from payment service
  const availableMethods = paymentService.getAvailablePaymentMethods();
  const isPaymentEnabled = paymentService.isPaymentEnabled();

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: 'cash-outline', color: '#34C759' },
    { id: 'card', name: 'Card', icon: 'card-outline', color: '#007AFF' },
    { id: 'digital_wallet', name: 'Digital Wallet', icon: 'phone-portrait-outline', color: '#FF9500' },
  ].filter(method => availableMethods.includes(method.id as PaymentMethod));

  const digitalWallets = [
    //{ id: 'apple_pay', name: 'Apple Pay', icon: 'logo-apple' },
    //{ id: 'google_pay', name: 'Google Pay', icon: 'logo-google' },
    { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' },
  ];

  const quickAmounts = [10000, 20000, 50000, 100000];

  const change = parseFloat(amountPaid) - total;

  const checkSession = async (sessionID: string) => {
    try {
      const sessionData = await getStripeSession(sessionID);
      console.log('Stripe session data:', sessionData);
      if (sessionData && sessionData.payment_status=== 'paid') {
        //return sessionData; // Return session data for redirection
        var paymentDetailx: PaymentDetails = {
          method: 'card',
          amount: total,
          transactionId: sessionData.id,
        };
        clearInterval(interval); // Stop polling
        onPaymentComplete([paymentDetailx]);
        resetForm();

      } else {
        throw new Error('Invalid session data received');
      }
    } catch (error) {
      console.error('Error checking Stripe session:', error);
      throw new Error('Failed to retrieve payment session. Please try again.');
    }
  };

  const handleStripePayment = async () => {
    console.log('handleStripePayment');
    if (isProcessing) return;
    if (!isPaymentEnabled) {
      showAlert('Payment Disabled', 'Payment processing is not enabled. Please contact your administrator.');
      return;
    }

    const sessionData = await processCardPaymentStripe(cart);
    const sessionID = sessionData.session_id;
    console.log('Stripe session data:', sessionData);
    // Open Stripe checkout in a new tab
    const checkoutWindow = window.open(sessionData.url, '_blank');

    // Poll every 1 second to check session status
    interval = setInterval(async () => {
      try {
        const updatedSession = await checkSession(sessionID);
        
      } catch (error) {
        console.error('Polling error:', error);
        // Optionally handle error, e.g., stop polling if session not found
      }
    }, 1000);
  };

  const handlePaypalPayment = async () => {
    console.log('handlePaypalPayment');
    if (isProcessing) return;
    if (!isPaymentEnabled) {
      showAlert('Payment Disabled', 'Payment processing is not enabled. Please contact your administrator.');
      return;
    }
    
    const sessionData = await processPaypal(cart);
    const sessionID = sessionData.session_id;
    console.log('Stripe session data:', sessionData);
    // Open Stripe checkout in a new tab
    const checkoutWindow = window.open(sessionData.url, '_blank');

    // Poll every 1 second to check session status
    interval = setInterval(async () => {
      try {
        const updatedSession = await checkSession(sessionID);
        
      } catch (error) {
        console.error('Polling error:', error);
        // Optionally handle error, e.g., stop polling if session not found
      }
    }, 1000);
  };

  const handlePayment = async () => {
    console.log('handlePayment');
    if (isProcessing) return;
    console.log('isPaymentEnabled', isPaymentEnabled);
    if (!isPaymentEnabled) {
      showAlert('Payment Disabled', 'Payment processing is not enabled. Please contact your administrator.');
      return;
    }

    setIsProcessing(true);
    try {
      let paymentDetails: PaymentDetails[] = [];

      switch (selectedMethod) {
        case 'cash':
          if (parseFloat(amountPaid) < total) {
            showAlert('Insufficient Payment', 'Amount paid must be at least the total amount.');
            return;
          }
          paymentDetails = [paymentService.processCashPayment(parseFloat(amountPaid), total)];
          console.log('Cash payment details:', paymentDetails);
          break;

        case 'card':
          /*if (!validateCardInputs()) {
            return;
          }
          
          const cardData = {
            cardNumber: cardNumber.replace(/\s/g, ''),
            expiryMonth: parseInt(expiryMonth),
            expiryYear: parseInt(expiryYear),
            cvc,
            amount: total,
          };
          const cardPayment = await paymentService.processCardPayment(cardData);
          paymentDetails = [cardPayment];
          */
         

          break;

        case 'digital_wallet':
          const walletData = {
            walletType,
            amount: total,
          };
          const walletPayment = await paymentService.processDigitalWalletPayment(walletData);
          paymentDetails = [walletPayment];
          break;
      }

      onPaymentComplete(paymentDetails);
      resetForm();
    } catch (error) {
      console.error('Payment error:', error);
      showAlert('Payment Error', error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validateCardInputs = (): boolean => {
    console.log('validateCardInputs');
    if (!paymentService.validateCardNumber(cardNumber)) {
      showAlert('Invalid Card', 'Please enter a valid card number.');
      console.log('Invalid Card');
      return false;
    }

    if (!paymentService.validateExpiryDate(parseInt(expiryMonth), parseInt(expiryYear))) {
      showAlert('Invalid Expiry', 'Please enter a valid expiry date.');
      return false;
    }

    if (!paymentService.validateCVC(cvc)) {
      showAlert('Invalid CVC', 'Please enter a valid CVC.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setAmountPaid('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvc('');
    setSelectedMethod(availableMethods[0] || 'cash');
  };

  const formatCardNumberInput = (text: string) => {
    const formatted = paymentService.formatCardNumber(text);
    setCardNumber(formatted);
  };

  const showAlert = (title: string, message: string) => {
    setCustomAlert({
      visible: true,
      title,
      message,
    });
  };

  const hideAlert = () => {
    setCustomAlert({
      visible: false,
      title: '',
      message: '',
    });
  };

  // Show warning if payment is disabled
  if (!isPaymentEnabled) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={48} color="#FF9500" />
              <Text style={styles.warningTitle}>Payment Processing Disabled</Text>
              <Text style={styles.warningText}>
                Payment processing is not enabled for your account. Please contact your administrator to configure payment settings.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const renderCashPayment = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Cash Payment</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Amount Received:</Text>
        <TextInput
          style={styles.amountInput}
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
            <Text style={styles.quickAmountText}>{formatPrice(amount)}</Text>
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
            {formatPrice(Math.abs(change))}
          </Text>
          {change < 0 && (
            <Text style={styles.insufficientText}>(Insufficient payment)</Text>
          )}
        </View>
      )}
    </View>
  );

  const renderStipePayment = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Stripe Payment</Text>
      <Pressable
          style={[
            styles.button,
            styles.completeButton,
            
          ]}          
          onPress={handleStripePayment}>
          <Text style={[styles.buttonText, styles.completeButtonText]}>
            Pay using Stripe
          </Text>
        </Pressable>
    </View>
  );

  const renderCardPayment = () => (
    
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Card Payment</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Card Number:</Text>
        <TextInput
          style={styles.cardInput}
          value={cardNumber}
          onChangeText={formatCardNumberInput}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Expiry:</Text>
        <View style={styles.expiryContainer}>
          <TextInput
            style={styles.expiryInput}
            value={expiryMonth}
            onChangeText={setExpiryMonth}
            placeholder="MM"
            maxLength={2}
            keyboardType="numeric"
          />
          <Text style={styles.expirySeparator}>/</Text>
          <TextInput
            style={styles.expiryInput}
            value={expiryYear}
            onChangeText={setExpiryYear}
            placeholder="YYYY"
            maxLength={4}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>CVC:</Text>
        <TextInput
          style={styles.cvcInput}
          value={cvc}
          onChangeText={setCvc}
          placeholder="123"
          maxLength={4}
          keyboardType="numeric"
          secureTextEntry
        />
      </View>
    </View>
  );
  const renderPaypalPayment = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Digital Wallet</Text>
      
      <View style={styles.walletOptions}>
        
          <Pressable
            key={'paypal'}
            style={[
              styles.walletOption,
              walletType === 'paypal' && styles.selectedWallet
            ]}
            onPress={handlePaypalPayment}>
            <Ionicons 
              name={'logo-paypal' as any} 
              size={24} 
              color={walletType === 'paypal' ? '#007AFF' : '#666'} 
            />
            <Text style={[
              styles.walletText,
              walletType === 'paypal' && styles.selectedWalletText
            ]}>
              {"Paypal"}
            </Text>
          </Pressable>
        
      </View>
    </View>
  );
  const renderDigitalWalletPayment = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Digital Wallet</Text>
      
      <View style={styles.walletOptions}>
        {digitalWallets.map((wallet) => (
          <Pressable
            key={wallet.id}
            style={[
              styles.walletOption,
              walletType === wallet.id && styles.selectedWallet
            ]}
            onPress={() => setWalletType(wallet.id as any)}>
            <Ionicons 
              name={wallet.icon as any} 
              size={24} 
              color={walletType === wallet.id ? '#007AFF' : '#666'} 
            />
            <Text style={[
              styles.walletText,
              walletType === wallet.id && styles.selectedWalletText
            ]}>
              {wallet.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderPaymentMethod = () => {
    switch (selectedMethod) {
      case 'cash':
        return renderCashPayment();
      case 'card':
        //return renderCardPayment();
        return renderStipePayment();
      case 'digital_wallet':
        //return renderDigitalWalletPayment();
        return renderPaypalPayment();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (selectedMethod) {
      case 'cash':
        return parseFloat(amountPaid) >= total;
      case 'card':
        //return cardNumber && expiryMonth && expiryYear && cvc;
        return false; // Placeholder, card validation is not implemented
      case 'digital_wallet':
        return true;
      default:
        return false;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentAmount}>{formatPrice(total)}</Text>
          </View>

          <ScrollView style={styles.methodsContainer}>
            <Text style={styles.methodsTitle}>Select Payment Method</Text>
            <View style={styles.methodsGrid}>
              {paymentMethods.map((method) => (
                <Pressable
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.selectedMethod
                  ]}
                  onPress={() => setSelectedMethod(method.id as PaymentMethod)}>
                  <Ionicons 
                    name={method.icon as any} 
                    size={32} 
                    color={selectedMethod === method.id ? 'white' : method.color} 
                  />
                  <Text style={[
                    styles.methodText,
                    selectedMethod === method.id && styles.selectedMethodText
                  ]}>
                    {method.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {renderPaymentMethod()}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                onClose();
                resetForm();
              }}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.completeButton,
                (!canProceed() || isProcessing) && styles.disabledButton
              ]}
              disabled={!canProceed() || isProcessing}
              onPress={handlePayment}>
              <Text style={[styles.buttonText, styles.completeButtonText]}>
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlert.visible}
        onRequestClose={hideAlert}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#FF9500" />
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
            </View>
            <Text style={styles.alertMessage}>{customAlert.message}</Text>
            <Pressable
              style={styles.alertButton}
              onPress={hideAlert}>
              <Text style={styles.alertButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  warningContainer: {
    alignItems: 'center',
    padding: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#FF9500',
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  methodsContainer: {
    flex: 1,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    marginHorizontal: 4,
  },
  selectedMethod: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  methodText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedMethodText: {
    color: 'white',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'right',
  },
  cardInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardInputHalf: {
    flex: 1,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  expirySeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#666',
  },
  cvcInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'left',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  changeLabel: {
    fontSize: 16,
    color: '#666',
  },
  changeAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#34C759',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  insufficientText: {
    fontSize: 12,
    color: '#FF3B30',
    fontStyle: 'italic',
  },
  walletOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    marginHorizontal: 4,
  },
  selectedWallet: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  walletText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedWalletText: {
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  completeButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  completeButtonText: {
    color: 'white',
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 