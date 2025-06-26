import { PaymentMethod, PaymentDetails, PaymentConfig } from '../types';
import useStore from '../store/useStore';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  next_action?: any; // For handling redirects
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
  private getToken?: () => Promise<string | null | undefined>;

  // Set authentication token getter
  setAuth(getToken?: () => Promise<string | null | undefined>) {
    this.getToken = getToken;
  }

  // Set payment configuration from user settings
  setPaymentConfig(config: PaymentConfig) {
    this.paymentConfig = config;
  }

  // Get payment configuration
  getPaymentConfig(): PaymentConfig | null {
    return this.paymentConfig;
  }

  // Get currency from store settings
  private getCurrency(): string {
    const settings = useStore.getState().settings;
    return settings?.currency?.code || 'usd';
  }

  // Get current currency (public method for external use)
  getCurrentCurrency(): string {
    return this.getCurrency();
  }

  // Get decimal multiplier for currency (for Stripe API)
  private getCurrencyMultiplier(currency: string): number {
    // Zero-decimal currencies (no cents)
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'ISK', 'BIF', 'DJF', 'GNF', 'KMF', 'MGA', 'PAB', 'STD', 'VUV', 'XAF', 'XOF', 'XPF'];
    
    const currencyCode = currency.toUpperCase();
    return zeroDecimalCurrencies.includes(currencyCode) ? 1 : 100;
  }

  // Check if payment is enabled
  isPaymentEnabled(): boolean {
    return this.paymentConfig?.enabled === true;
  }

  // Check if specific payment method is enabled
  isPaymentMethodEnabled(method: PaymentMethod): boolean {
    return this.paymentConfig?.paymentMethods?.includes(method) === true;
  }

  // Private method to handle authenticated fetch requests
  private async fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json'
    };
    
    // Add any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    // Always get the latest token before each request
    if (this.getToken && typeof this.getToken === 'function') {
      try {
        const token = await this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get token:', error);
        // Continue without token if getToken fails
      }
    }

    const res = await fetch(url, {
      headers,
      ...options,
    });

    if (res.status === 401) {
      // Redirect to login page
      window.location.href = "/sign-in";
      // Optionally, return a rejected promise to stop further processing
      return Promise.reject(new Error("Unauthorized"));
    }

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // Initialize Stripe payment intent
  async createPaymentIntent(amount: number, currency?: string): Promise<PaymentIntent> {
    if (!this.isPaymentEnabled()) {
      throw new Error('Payment processing is not enabled');
    }

    // Use provided currency, or get from settings, or default to 'usd'
    const paymentCurrency = currency || this.getCurrency();

    try {
      return await this.fetchJSON<PaymentIntent>(`${this.baseUrl}/payments/create-intent`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amount, // Send original amount, let server handle conversion
          currency: paymentCurrency,
          config: this.paymentConfig,
        }),
      });
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
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(paymentData.amount);
      
      // Confirm the payment intent with card details
      const confirmedPayment = await this.fetchJSON<PaymentIntent>(`${this.baseUrl}/payments/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          paymentMethodId: null, // We'll use card data directly
          cardData: {
            number: paymentData.cardNumber,
            exp_month: paymentData.expiryMonth,
            exp_year: paymentData.expiryYear,
            cvc: paymentData.cvc,
          },
          currency: this.getCurrency(),
          config: this.paymentConfig,
        }),
      });
      
      // Check if payment requires additional action (like 3D Secure)
      if (confirmedPayment.status === 'requires_action' && confirmedPayment.next_action) {
        throw new Error('Payment requires additional authentication. Please try a different card or contact support.');
      }
      
      // Check if payment was successful
      if (confirmedPayment.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${confirmedPayment.status}`);
      }
      
      const paymentDetails: PaymentDetails = {
        method: 'card',
        amount: paymentData.amount,
        transactionId: confirmedPayment.id,
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
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(walletData.amount);
      
      // For digital wallets, we'll use the process-wallet endpoint which handles the confirmation
      const confirmedPayment = await this.fetchJSON<PaymentIntent>(`${this.baseUrl}/payments/process-wallet`, {
        method: 'POST',
        body: JSON.stringify({
          walletType: walletData.walletType,
          amount: walletData.amount,
          currency: this.getCurrency(),
          config: this.paymentConfig,
        }),
      });
      
      const paymentDetails: PaymentDetails = {
        method: 'digital_wallet',
        amount: walletData.amount,
        transactionId: confirmedPayment.id,
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

// Helper function to configure the payment service with auth
export function configurePayment(getToken?: () => Promise<string | null | undefined>) {
  console.log('Configuring Payment Service with getToken function');
  paymentService.setAuth(getToken);
}

export default paymentService; 