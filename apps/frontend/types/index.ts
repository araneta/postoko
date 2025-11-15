export interface User {

  "id": string;
  "name": string;
  "email": string;
  "lastLogin": string;
  "lastIp": string;

}
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
  paypalMode?: 'sandbox' | 'live';
  paypalClientSecret?: string;
  paypalClientId?: string;
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
  employee?: Employee; // Added for POS employee authentication
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

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Employee {
  id: string;
  storeInfoId: number;
  name: string;
  email: string;
  roleId: number;
  role?: Role;
  createdAt: string;
  deletedAt?: string;
  pin?: string; // PIN for employee authentication
}

export interface StripeSessionData {
  session_id: string;
  url: string;
}
export interface StripeSessionDetails {
  id: string;
  object: "checkout.session";
  adaptive_pricing: {
    enabled: boolean;
  };
  after_expiration: null;
  allow_promotion_codes: null;
  amount_subtotal: number;
  amount_total: number;
  automatic_tax: {
    enabled: boolean;
    liability: null;
    provider: null;
    status: null;
  };
  billing_address_collection: null;
  cancel_url: string;
  client_reference_id: string | null;
  client_secret: string | null;
  collected_information: null;
  consent: null;
  consent_collection: null;
  created: number;
  currency: string;
  currency_conversion: null;
  custom_fields: any[]; // define structure if known
  custom_text: {
    after_submit: null;
    shipping_address: null;
    submit: null;
    terms_of_service_acceptance: null;
  };
  customer: string | null;
  customer_creation: "if_required" | string;
  customer_details: {
    address: {
      city: string | null;
      country: string;
      line1: string | null;
      line2: string | null;
      postal_code: string | null;
      state: string | null;
    };
    email: string;
    name: string;
    phone: string | null;
    tax_exempt: "none" | string;
    tax_ids: any[]; // define structure if known
  } | null;
  customer_email: string | null;
  discounts: any[];
  expires_at: number;
  invoice: string | null;
  invoice_creation: {
    enabled: boolean;
    invoice_data: {
      account_tax_ids: null;
      custom_fields: null;
      description: null;
      footer: null;
      issuer: null;
      metadata: Record<string, string>;
      rendering_options: null;
    };
  };
  livemode: boolean;
  locale: string | null;
  metadata: Record<string, string>;
  mode: "payment" | string;
  origin_context: null;
  payment_intent: string;
  payment_link: string | null;
  payment_method_collection: "if_required" | string;
  payment_method_configuration_details: null;
  payment_method_options: {
    card: {
      request_three_d_secure: "automatic" | string;
    };
  };
  payment_method_types: string[];
  payment_status: "paid" | string;
  permissions: null;
  phone_number_collection: {
    enabled: boolean;
  };
  presentment_details: {
    presentment_amount: number;
    presentment_currency: string;
  };
  recovered_from: null;
  saved_payment_method_options: null;
  setup_intent: null;
  shipping_address_collection: null;
  shipping_cost: null;
  shipping_options: any[];
  status: "complete" | string;
  submit_type: string | null;
  subscription: string | null;
  success_url: string;
  total_details: {
    amount_discount: number;
    amount_shipping: number;
    amount_tax: number;
  };
  ui_mode: "hosted" | string;
  url: string | null;
  wallet_options: null;
}


export interface PayPalOrdersCreateRequest {
  order_id: string;
  url: string;
};


export interface OrdersGetRequest {
  id: string;
  intent: "CAPTURE" | "AUTHORIZE";
  status: string;
  purchase_units: PurchaseUnit[];
  create_time: string;
  links: PaypalLink[];
}

export interface PurchaseUnit {
  reference_id: string;
  amount: Amount;
  payee: Payee;
  items: PaypalItem[];
}

export interface Amount {
  currency_code: string;
  value: string;
  breakdown: {
    item_total: {
      currency_code: string;
      value: string;
    };
  };
}

export interface Payee {
  email_address: string;
  merchant_id: string;
  display_data: {
    brand_name: string;
  };
}

export interface PaypalItem {
  name: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
  quantity: string;
}

export interface PaypalLink {
  href: string;
  rel: string;
  method: string;
}

export interface EmployeePINLoginResponse {
  message: string
  employee: Employee
}

export interface EmployeeSales {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  totalSales: string;
  orderCount: number;
  averageOrderValue: string;
  totalProfit: string;
  profitMargin: number;
}

export interface EmployeePerformance extends EmployeeSales {
  period: string;
  rank?: number;
}

export interface EmployeeSalesDetail {
  orderId: string;
  date: string;
  total: string;
  profit: string;
  items: CartItem[];
}

