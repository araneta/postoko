import React, { useState, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentDetails } from '../types';
import stripeService from '../lib/stripeService';

interface StripePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentDetails: PaymentDetails[]) => void;
  total: number;
  formatPrice: (price: number) => string;
}

function WebStripePaymentForm({
  total,
  formatPrice,
  onPaymentComplete,
  onClose,
}: Omit<StripePaymentModalProps, 'visible'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      const paymentIntent = await stripeService.createPaymentIntent(total);
      if (!stripe || !elements) throw new Error('Stripe not loaded');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');
      const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: { card: cardElement },
      });
      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onPaymentComplete([
          {
            method: 'card',
            amount: total,
            transactionId: result.paymentIntent.id,
            cardLast4: '',
            cardBrand: '',
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Card Payment (Web)</Text>
      <CardElement options={{ style: { base: { fontSize: '18px' } } }} />
      {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
      <View style={{ flexDirection: 'row', marginTop: 24 }}>
        <Pressable
          style={{ flex: 1, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center', marginRight: 8 }}
          onPress={onClose}
        >
          <Text>Cancel</Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, padding: 16, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' }}
          disabled={isProcessing}
        >
          <Text style={{ color: 'white' }}>{isProcessing ? 'Processing...' : `Pay ${formatPrice(total)}`}</Text>
        </Pressable>
      </View>
    </form>
  );
}

export default function StripePaymentModal(props: StripePaymentModalProps) {
  // Always get the latest key
  const publishableKey = stripeService.getStripePublishableKey() || '';
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  if (!props.visible) return null;
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.visible}
      onRequestClose={props.onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Elements stripe={stripePromise}>
            <WebStripePaymentForm {...props} />
          </Elements>
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
}); 