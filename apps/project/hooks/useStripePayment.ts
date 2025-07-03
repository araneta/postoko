import { useState, useCallback } from 'react';
import { PaymentDetails } from '../types';

interface UseStripePaymentReturn {
  isPaymentModalVisible: boolean;
  showPaymentModal: (total: number) => void;
  hidePaymentModal: () => void;
  onPaymentComplete: (paymentDetails: PaymentDetails[]) => void;
  lastPaymentDetails: PaymentDetails[] | null;
  isProcessing: boolean;
}

export function useStripePayment(): UseStripePaymentReturn {
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [lastPaymentDetails, setLastPaymentDetails] = useState<PaymentDetails[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showPaymentModal = useCallback((total: number) => {
    setIsPaymentModalVisible(true);
  }, []);

  const hidePaymentModal = useCallback(() => {
    setIsPaymentModalVisible(false);
  }, []);

  const onPaymentComplete = useCallback((paymentDetails: PaymentDetails[]) => {
    setLastPaymentDetails(paymentDetails);
    setIsPaymentModalVisible(false);
    setIsProcessing(false);
  }, []);

  return {
    isPaymentModalVisible,
    showPaymentModal,
    hidePaymentModal,
    onPaymentComplete,
    lastPaymentDetails,
    isProcessing,
  };
} 