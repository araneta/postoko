import {create} from 'zustand';
import {Product, CartItem, Order, Currency, Settings, StoreInfo, PrinterSettings} from '../types';
import {DatabaseService} from '../services/DatabaseService';

interface StoreState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  settings: Settings;
  loading: boolean;
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
  name: 'US Dollar',
};

const defaultSettings: Settings = {
  currency: defaultCurrency,
  printer: {
    type: 'none',
  },
};

export const useStore = create<StoreState>((set, get) => ({
  products: [],
  cart: [],
  orders: [],
  settings: defaultSettings,
  loading: true,

  initializeStore: async () => {
    try {
      await DatabaseService.initDatabase();
      const [products, orders, settings] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getOrders(),
        DatabaseService.getSettings(),
      ]);
      
      // Add some sample products if none exist
      if (products.length === 0) {
        const sampleProducts: Product[] = [
          {
            id: '1',
            name: 'Coffee',
            price: 4.50,
            stock: 100,
            category: 'Beverages',
            description: 'Premium coffee blend',
            image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
          },
          {
            id: '2',
            name: 'Croissant',
            price: 3.25,
            stock: 50,
            category: 'Bakery',
            description: 'Fresh buttery croissant',
            image: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=400',
          },
          {
            id: '3',
            name: 'Sandwich',
            price: 8.99,
            stock: 30,
            category: 'Food',
            description: 'Gourmet sandwich with fresh ingredients',
            image: 'https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=400',
          },
        ];
        
        for (const product of sampleProducts) {
          await DatabaseService.addProduct(product);
        }
        
        set({products: sampleProducts, orders, settings, loading: false});
      } else {
        set({products, orders, settings, loading: false});
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({loading: false});
    }
  },

  addProduct: async product => {
    try {
      await DatabaseService.addProduct(product);
      set(state => ({
        products: [...state.products, product],
      }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async product => {
    try {
      await DatabaseService.updateProduct(product);
      set(state => ({
        products: state.products.map(p => (p.id === product.id ? product : p)),
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async id => {
    try {
      await DatabaseService.deleteProduct(id);
      set(state => ({
        products: state.products.filter(p => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  addToCart: product => {
    set(state => {
      const existingItem = state.cart.find(item => item.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map(item =>
            item.id === product.id
              ? {...item, quantity: item.quantity + 1}
              : item,
          ),
        };
      }
      return {cart: [...state.cart, {...product, quantity: 1}]};
    });
  },

  removeFromCart: productId => {
    set(state => ({
      cart: state.cart.filter(item => item.id !== productId),
    }));
  },

  updateCartItemQuantity: (productId, quantity) => {
    set(state => ({
      cart:
        quantity === 0
          ? state.cart.filter(item => item.id !== productId)
          : state.cart.map(item =>
              item.id === productId ? {...item, quantity} : item,
            ),
    }));
  },

  clearCart: () => {
    set({cart: []});
  },

  createOrder: async paymentMethod => {
    const {cart} = get();
    if (cart.length === 0) return;

    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      date: new Date().toISOString(),
      paymentMethod,
      status: 'completed',
    };

    try {
      await DatabaseService.addOrder(order);
      set(state => ({
        orders: [order, ...state.orders],
        cart: [],
      }));
      return order;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },

  updateCurrency: async currency => {
    try {
      const newSettings = {
        ...get().settings,
        currency,
      };
      await DatabaseService.updateSettings(newSettings);
      set({settings: newSettings});
    } catch (error) {
      console.error('Failed to update currency:', error);
      throw error;
    }
  },

  updatePrinterSettings: async printerSettings => {
    try {
      const newSettings = {
        ...get().settings,
        printer: printerSettings,
      };
      await DatabaseService.updateSettings(newSettings);
      set({settings: newSettings});
    } catch (error) {
      console.error('Failed to update printer settings:', error);
      throw error;
    }
  },

  updateStoreInfo: async storeInfo => {
    try {
      const newSettings = {
        ...get().settings,
        storeInfo,
      };
      await DatabaseService.updateSettings(newSettings);
      set({settings: newSettings});
    } catch (error) {
      console.error('Failed to update store info:', error);
      throw error;
    }
  },

  formatPrice: price => {
    const {settings} = get();
    return `${settings.currency.symbol}${price.toFixed(2)}`;
  },
}));