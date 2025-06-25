import { create } from 'zustand';
import { Product, CartItem, Order, Currency, Settings, StoreInfo, PrinterSettings } from '../types';
import { apiClient, configureAPI } from '../lib/api';
import { safeToFixed } from '../utils/formatters';

interface StoreState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  settings: Settings;
  initializing: boolean;
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
  clearStore: () => void;
  userId?: string;
}

const defaultCurrency: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar'
};

const defaultStoreInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
};

const useStore = create<StoreState>((set, get) => ({
  products: [],
  cart: [],
  orders: [],
  settings: {
    currency: defaultCurrency,
    printer: {
      type: 'none'
    },
    storeInfo: defaultStoreInfo,
  },
  initializing: false,
  userId: undefined,

  initializeStore: async () => {
    const { initializing } = get();
    if (initializing) {
      console.log('Store initialization already in progress, skipping...');
      return;
    }
    
    set({ initializing: true });
    try {
      const [products, orders, settings] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getOrders(),
        apiClient.getSettings()
      ]);
      
      // Add sample products with barcodes for testing if no products exist
      let finalProducts = products;
      if (products.length === 0) {
        const sampleProducts: Product[] = [
          {
            id: '1',
            name: 'Coca Cola 330ml',
            price: 1500,
            description: 'Refreshing carbonated soft drink',
            image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
            stock: 50,
            category: 'Beverages',
            barcode: '1234567890123'
          },
          {
            id: '2',
            name: 'Lay\'s Classic Chips',
            price: 2500,
            description: 'Crispy potato chips',
            image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
            stock: 30,
            category: 'Snacks',
            barcode: '9876543210987'
          },
          {
            id: '3',
            name: 'Nestle Pure Life Water',
            price: 800,
            description: 'Pure spring water',
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
            stock: 100,
            category: 'Beverages',
            barcode: '4567891234567'
          },
          {
            id: '4',
            name: 'Snickers Chocolate Bar',
            price: 1200,
            description: 'Chocolate bar with caramel and peanuts',
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
            stock: 25,
            category: 'Candy',
            barcode: '7891234567890'
          }
        ];
        
        // Add sample products to the API
        for (const product of sampleProducts) {
          try {
            await apiClient.addProduct(product);
          } catch (error) {
            console.warn('Failed to add sample product:', error);
          }
        }
        
        finalProducts = sampleProducts;
      }
      
      set({
        products: finalProducts,
        orders,
        settings: settings
          ? {
              ...settings,
              currency: settings.currency ?? defaultCurrency,
              storeInfo: settings.storeInfo ?? defaultStoreInfo,
            }
          : {
              currency: defaultCurrency,
              printer: { type: 'none' },
              storeInfo: defaultStoreInfo,
            },
        initializing: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ initializing: false });
    }
  },

  addProduct: async (product) => {
    try {
      await apiClient.addProduct(product);
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
      await apiClient.updateProduct(product);
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
      await apiClient.deleteProduct(id);
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
      await apiClient.addOrder(order);
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
      await apiClient.updateSettings(newSettings);
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
      await apiClient.updateSettings(newSettings);
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
      await apiClient.updateSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update store info:', error);
      throw error;
    }
  },

  formatPrice: (price: number) => {
    const { settings } = get();
    return `${settings?.currency?.symbol || '$'} ${safeToFixed(price)}`;
  },

  clearStore: () => {
    set({
      products: [],
      cart: [],
      orders: [],
      settings: {
        currency: defaultCurrency,
        printer: {
          type: 'none'
        },
        storeInfo: defaultStoreInfo,
      },
      initializing: false,
      userId: undefined
    });
  }
}));

export default useStore;
