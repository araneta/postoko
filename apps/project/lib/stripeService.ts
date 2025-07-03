import { Alert } from 'react-native';
import { PaymentMethod, PaymentDetails, PaymentConfig } from '../types';
import useStore from '../store/useStore';

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  next_action?: any;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

class StripeService {
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

  // Get Stripe publishable key
  getStripePublishableKey(): string | null {
    return this.paymentConfig?.stripePublishableKey || null;
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

  // Create Stripe payment intent for native SDK
  async createPaymentIntent(amount: number, currency?: string): Promise<StripePaymentIntent> {
    if (!this.isPaymentEnabled()) {
      throw new Error('Payment processing is not enabled');
    }

    // Use provided currency, or get from settings, or default to 'usd'
    const paymentCurrency = currency || this.getCurrency();

    try {
      return await this.fetchJSON<StripePaymentIntent>(`${this.baseUrl}/payments/create-intent`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          currency: paymentCurrency,
          config: this.paymentConfig,
        }),
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment intent with payment method
  async confirmPayment(clientSecret: string, paymentMethodId: string): Promise<StripePaymentIntent> {
    if (!this.isPaymentEnabled()) {
      throw new Error('Payment processing is not enabled');
    }

    try {
      return await this.fetchJSON<StripePaymentIntent>(`${this.baseUrl}/payments/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          clientSecret,
          paymentMethodId,
          config: this.paymentConfig,
        }),
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Process digital wallet payment with native SDK
  async processDigitalWalletPayment(walletType: 'apple_pay' | 'google_pay', amount: number): Promise<PaymentDetails> {
    if (!this.isPaymentMethodEnabled('digital_wallet')) {
      throw new Error('Digital wallet payments are not enabled');
    }

    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(amount);
      
      // For digital wallets, we'll use the process-wallet endpoint
      const confirmedPayment = await this.fetchJSON<StripePaymentIntent>(`${this.baseUrl}/payments/process-wallet`, {
        method: 'POST',
        body: JSON.stringify({
          walletType,
          amount,
          currency: this.getCurrency(),
          config: this.paymentConfig,
        }),
      });
      
      const paymentDetails: PaymentDetails = {
        method: 'digital_wallet',
        amount,
        transactionId: confirmedPayment.id,
        walletType,
      };

      return paymentDetails;
    } catch (error) {
      console.error('Error processing digital wallet payment:', error);
      throw error;
    }
  }

  // Process cash payment (no change needed)
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

  // Get available payment methods
  getAvailablePaymentMethods(): PaymentMethod[] {
    return this.paymentConfig?.paymentMethods || ['cash'];
  }

  // Validate payment configuration
  validatePaymentConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.paymentConfig) {
      errors.push('Payment configuration is not set');
      return { isValid: false, errors };
    }

    if (!this.paymentConfig.enabled) {
      errors.push('Payment processing is disabled');
      return { isValid: false, errors };
    }

    if (this.paymentConfig.paymentMethods.length === 0) {
      errors.push('No payment methods are configured');
    }

    if (this.paymentConfig.paymentMethods.includes('card') || this.paymentConfig.paymentMethods.includes('digital_wallet')) {
      if (!this.paymentConfig.stripePublishableKey) {
        errors.push('Stripe publishable key is required for card and digital wallet payments');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Format amount for display
  formatAmount(amount: number): string {
    const currency = this.getCurrency();
    const currencySymbol = useStore.getState().settings?.currency?.symbol || '$';
    
    // For zero-decimal currencies, don't show cents
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'ISK', 'BIF', 'DJF', 'GNF', 'KMF', 'MGA', 'PAB', 'STD', 'VUV', 'XAF', 'XOF', 'XPF'];
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
    
    if (isZeroDecimal) {
      return `${currencySymbol}${amount.toLocaleString()}`;
    }
    
    return `${currencySymbol}${(amount / 100).toFixed(2)}`;
  }

  // Get test card numbers for development
  getTestCardNumbers(): { [key: string]: string } {
    return {
      visa: '4242424242424242',
      mastercard: '5555555555554444',
      amex: '378282246310005',
      discover: '6011111111111117',
      declined: '4000000000000002',
    };
  }
}

export const stripeService = new StripeService();

// Helper function to configure the Stripe service with auth
export function configureStripeService(getToken?: () => Promise<string | null | undefined>) {
  console.log('Configuring Stripe Service with getToken function');
  stripeService.setAuth(getToken);
}

export default stripeService; 