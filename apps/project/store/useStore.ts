import { create } from 'zustand';
import { Product, CartItem, Order, Currency, Settings, StoreInfo, PrinterSettings } from '../types';
import * as api from '../lib/api';

interface StoreState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  settings: Settings;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: (paymentMethod: string) => Promise<Order | undefined>;
  updateCurrency: (currency: Currency) => Promise<void>;
  updatePrinterSettings: (printerSettings: PrinterSettings) => Promise<void>;
  updateStoreInfo: (storeInfo: StoreInfo) => Promise<void>;
  formatPrice: (price: number) => string;
  initializeStore: () => Promise<void>;
}

const defaultCurrency: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar'
};

const useStore = create<StoreState>((set, get) => ({
  products: [],
  cart: [],
  orders: [],
  settings: {
    currency: defaultCurrency,
    printer: {
      type: 'none'
    }
  },

  initializeStore: async () => {
    try {
      const [products, orders, settings] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getSettings()
      ]);
      set({ products, orders, settings });
    } catch (error) {
      console.error('Failed to initialize store:', error);
    }
  },

  addProduct: async (product) => {
    try {
      await api.addProduct(product);
      set(state => ({
        products: [...state.products, product]
      }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async (product) => {
    try {
      await api.updateProduct(product);
      set(state => ({
        products: state.products.map(p =>
          p.id === product.id ? product : p
        )
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.deleteProduct(id);
      set(state => ({
        products: state.products.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  addToCart: (product) => {
    set(state => {
      const existingItem = state.cart.find(item => item.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    });
  },

  removeFromCart: (productId) => {
    set(state => ({
      cart: state.cart.filter(item => item.id !== productId)
    }));
  },

  updateCartItemQuantity: (productId, quantity) => {
    set(state => ({
      cart: quantity === 0
        ? state.cart.filter(item => item.id !== productId)
        : state.cart.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  createOrder: async (paymentMethod) => {
    const { cart } = get();
    if (cart.length === 0) return;

    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      date: new Date().toISOString(),
      paymentMethod,
      status: 'completed'
    };

    try {
      await api.addOrder(order);
      set(state => ({
        orders: [order, ...state.orders],
        cart: []
      }));
      return order;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },

  updateCurrency: async (currency: Currency) => {
    try {
      const newSettings = {
        ...get().settings,
        currency
      };
      await api.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update currency:', error);
      throw error;
    }
  },

  updatePrinterSettings: async (printerSettings: PrinterSettings) => {
    try {
      const newSettings = {
        ...get().settings,
        printer: printerSettings
      };
      await api.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update printer settings:', error);
      throw error;
    }
  },

  updateStoreInfo: async (storeInfo: StoreInfo) => {
    try {
      const newSettings = {
        ...get().settings,
        storeInfo
      };
      await api.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update store info:', error);
      throw error;
    }
  },

  formatPrice: (price: number) => {
    const { settings } = get();
    return `${settings.currency.symbol}${price.toFixed(2)}`;
  }
}));

export default useStore;