import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { PaymentDetails } from '../types';

interface StripePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentDetails: PaymentDetails[]) => void;
  total: number;
  formatPrice: (price: number) => string;
}

export default function StripePaymentModal({
  visible,
  onClose,
  onPaymentComplete,
  total,
  formatPrice,
}: StripePaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Create a mock payment for demo purposes
      const mockPayment: PaymentDetails = {
        method: 'card',
        amount: total,
        transactionId: `demo_${Date.now()}`,
        cardLast4: '4242',
        cardBrand: 'visa',
      };
      
      onPaymentComplete([mockPayment]);
      setIsProcessing(false);
    }, 2000);
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Payment</Text>
          
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentAmount}>{formatPrice(total)}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Demo Payment</Text>
            <Text style={styles.infoText}>
              This is a demo payment system. In a real application, this would integrate with Stripe or another payment processor.
            </Text>
            <Text style={styles.infoText}>
              Click "Complete Payment" to simulate a successful payment.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.payButton,
                isProcessing && styles.disabledButton
              ]}
              disabled={isProcessing}
              onPress={handlePayment}
            >
              <Text style={styles.payButtonText}>
                {isProcessing ? 'Processing...' : `Complete Payment`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    maxWidth: 400,
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
  infoContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonContainer: {
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
  payButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 