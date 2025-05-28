export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
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
  rate: number;
} 