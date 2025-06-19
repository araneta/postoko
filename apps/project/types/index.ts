export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  stock: number;
  category: string;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: string;
  status: 'completed' | 'refunded';
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
}

export interface PrinterSettings {
  type: 'none';
}