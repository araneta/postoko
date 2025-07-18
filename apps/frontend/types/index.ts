export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number; // Cost for profit margin tracking
  description?: string;
  image?: string;
  stock: number;
  minStock?: number; // Minimum stock threshold for notifications
  category: string;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'digital_wallet' | 'bank_transfer';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  cardLast4?: string;
  cardBrand?: string;
  walletType?: 'apple_pay' | 'google_pay' | 'paypal';
  change?: number;
}

export interface PaymentConfig {
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  paymentMethods: PaymentMethod[];
  enabled: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: string;
  paymentDetails?: PaymentDetails[];
  status: 'completed' | 'refunded' | 'pending';
  customer?: Customer; // Added for POS customer selection
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
}

export interface Settings {
  currency: Currency;
  printer: PrinterSettings;
  storeInfo?: StoreInfo;
  payment?: PaymentConfig;
}

export interface PrinterDevice {
  deviceId: string;
  deviceName: string;
  address?: string;
}

export interface PrinterSettings {
  type: 'none' | 'bluetooth' | 'usb';
  deviceId?: string;
  deviceName?: string;
  address?: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  createdAt: string;
  isRead: boolean;
}

export interface Customer {
  id: string;
  storeInfoId: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface CustomerPurchase {
  purchaseId: number;
  orderId: string;
  purchaseDate: string;
  order: Order;
}