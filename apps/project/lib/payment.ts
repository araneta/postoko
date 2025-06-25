import { PaymentMethod, PaymentDetails, PaymentConfig } from '../types';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface CardPaymentData {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  amount: number;
}

export interface DigitalWalletData {
  walletType: 'apple_pay' | 'google_pay' | 'paypal';
  amount: number;
}

class PaymentService {
  private baseUrl = 'http://localhost:3000/api';
  private paymentConfig: PaymentConfig | null = null;

  // Set payment configuration from user settings
  setPaymentConfig(config: PaymentConfig) {
    this.paymentConfig = config;
  }

  // Get payment configuration
  getPaymentConfig(): PaymentConfig | null {
    return this.paymentConfig;
  }

  // Check if payment is enabled
  isPaymentEnabled(): boolean {
    return this.paymentConfig?.enabled === true;
  }

  // Check if specific payment method is enabled
  isPaymentMethodEnabled(method: PaymentMethod): boolean {
    return this.paymentConfig?.paymentMethods?.includes(method) === true;
  }

  // Initialize Stripe payment intent
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
    if (!this.isPaymentEnabled()) {
      throw new Error('Payment processing is not enabled');
    }

    try {
      const response = await fetch(`${this.baseUrl}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          config: this.paymentConfig, // Send config to backend
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Process card payment
  async processCardPayment(paymentData: CardPaymentData): Promise<PaymentDetails> {
    if (!this.isPaymentMethodEnabled('card')) {
      throw new Error('Card payments are not enabled');
    }

    try {
      const paymentIntent = await this.createPaymentIntent(paymentData.amount);
      
      // In a real implementation, you would use Stripe's SDK to confirm the payment
      // For now, we'll simulate a successful payment
      const paymentDetails: PaymentDetails = {
        method: 'card',
        amount: paymentData.amount,
        transactionId: paymentIntent.id,
        cardLast4: paymentData.cardNumber.slice(-4),
        cardBrand: this.detectCardBrand(paymentData.cardNumber),
      };

      return paymentDetails;
    } catch (error) {
      console.error('Error processing card payment:', error);
      throw error;
    }
  }

  // Process digital wallet payment
  async processDigitalWalletPayment(walletData: DigitalWalletData): Promise<PaymentDetails> {
    if (!this.isPaymentMethodEnabled('digital_wallet')) {
      throw new Error('Digital wallet payments are not enabled');
    }

    try {
      const paymentIntent = await this.createPaymentIntent(walletData.amount);
      
      // In a real implementation, you would integrate with the specific wallet
      const paymentDetails: PaymentDetails = {
        method: 'digital_wallet',
        amount: walletData.amount,
        transactionId: paymentIntent.id,
        walletType: walletData.walletType,
      };

      return paymentDetails;
    } catch (error) {
      console.error('Error processing digital wallet payment:', error);
      throw error;
    }
  }

  // Process cash payment
  processCashPayment(amountPaid: number, totalAmount: number): PaymentDetails {
    if (!this.isPaymentMethodEnabled('cash')) {
      throw new Error('Cash payments are not enabled');
    }

    const change = amountPaid - totalAmount;
    
    return {
      method: 'cash',
      amount: totalAmount,
      change: change > 0 ? change : 0,
    };
  }

  // Detect card brand based on card number
  private detectCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    
    return 'unknown';
  }

  // Validate card number using Luhn algorithm
  validateCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Validate expiry date
  validateExpiryDate(month: number, year: number): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    if (month < 1 || month > 12) return false;

    return true;
  }

  // Validate CVC
  validateCVC(cvc: string): boolean {
    return /^\d{3,4}$/.test(cvc);
  }

  // Format card number for display
  formatCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const groups = cleanNumber.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleanNumber;
  }

  // Get available payment methods
  getAvailablePaymentMethods(): PaymentMethod[] {
    return this.paymentConfig?.paymentMethods || ['cash'];
  }
}

export const paymentService = new PaymentService();
export default paymentService; 