import { create } from 'zustand';
import { Product, CartItem, Order, Currency, Settings, StoreInfo, PrinterSettings, PaymentDetails, PaymentConfig, StockAlert, Customer, Employee, Category } from '../types';
import { apiClient, configureAPI } from '../lib/api';
import { safeToFixed } from '../utils/formatters';
import paymentService from '../lib/payment';
import stockAlertService from '../lib/stockAlerts';
import notificationService from '../lib/notifications';

interface StoreState {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  orders: Order[];
  settings: Settings;
  stockAlerts: StockAlert[];
  initializing: boolean;
  authenticatedEmployee: Employee | null;
  employeeAuthTimeout: NodeJS.Timeout | null;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string | number) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: (paymentDetails: PaymentDetails[], customer?: Customer) => Promise<Order | undefined>;
  updateCurrency: (currency: Currency) => Promise<void>;
  updatePrinterSettings: (printerSettings: PrinterSettings) => Promise<void>;
  updateStoreInfo: (storeInfo: StoreInfo) => Promise<void>;
  updatePaymentConfig: (paymentConfig: PaymentConfig) => Promise<void>;
  formatPrice: (price: number) => string;
  initializeStore: () => Promise<void>;
  clearStore: () => void;
  checkLowStockAlerts: () => Promise<void>;
  getStockAlerts: () => StockAlert[];
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  getUnreadAlertCount: () => number;
  setAuthenticatedEmployee: (employee: Employee | null) => void;
  clearEmployeeAuth: () => void;
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

const defaultPaymentConfig: PaymentConfig = {
  stripePublishableKey: '',
  stripeSecretKey: '',
  paypalClientId: '',
  paypalClientSecret: '',
  paymentMethods: ['cash'],
  enabled: false,
};

const useStore = create<StoreState>((set, get) => ({
  products: [],
  categories: [],
  cart: [],
  orders: [],
  settings: {
    currency: defaultCurrency,
    printer: {
      type: 'none'
    },
    storeInfo: defaultStoreInfo,
    payment: defaultPaymentConfig,
  },
  stockAlerts: [],
  initializing: false,
  authenticatedEmployee: null,
  employeeAuthTimeout: null,
  userId: undefined,

  initializeStore: async () => {
    console.log('Initializing store');
    const { initializing } = get();
    if (initializing) {
      console.log('Store initialization already in progress, skipping...');
      return;
    }
    
    set({ initializing: true });
    try {
      const [products, categories, orders, settings] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getCategories(),
        apiClient.getOrders(),
        apiClient.getSettings()
      ]);
      
      // Categories are now handled by the API client (with mock fallback)
      const finalCategories = categories;

      // Add sample products with barcodes for testing if no products exist
      let finalProducts = products;
      if (products.length === 0) {
        // Helper to generate a GUID
        const generateGuid = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        const sampleProducts: Product[] = [
          {
            id: generateGuid(),
            name: 'Coca Cola 330ml',
            price: 1500,
            cost: 1000,
            description: 'Refreshing carbonated soft drink',
            image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
            stock: 50,
            category: 'Beverages',
            categoryId: 'cat-1',
            categoryName: 'Beverages',
            barcode: '1234567890123',
            minStock: 20
          },
          {
            id: generateGuid(),
            name: 'Lay\'s Classic Chips',
            price: 2500,
            cost: 1500,
            description: 'Crispy potato chips',
            image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
            stock: 30,
            category: 'Snacks',
            categoryId: 'cat-2',
            categoryName: 'Snacks',
            barcode: '9876543210987',
            minStock: 15
          },
          {
            id: generateGuid(),
            name: 'Nestle Pure Life Water',
            price: 800,
            cost: 300,
            description: 'Pure spring water',
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
            stock: 100,
            category: 'Beverages',
            categoryId: 'cat-1',
            categoryName: 'Beverages',
            barcode: '4567891234567',
            minStock: 30
          },
          {
            id: generateGuid(),
            name: 'Snickers Chocolate Bar',
            price: 1200,
            cost: 700,
            description: 'Chocolate bar with caramel and peanuts',
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
            stock: 25,
            category: 'Candy',
            categoryId: 'cat-3',
            categoryName: 'Candy',
            barcode: '7891234567890',
            minStock: 10
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
      
      const finalSettings = settings
        ? {
            ...settings,
            currency: settings.currency ?? defaultCurrency,
            storeInfo: settings.storeInfo ?? defaultStoreInfo,
            payment: settings.payment ?? defaultPaymentConfig,
          }
        : {
            currency: defaultCurrency,
            printer: { type: 'none' as const },
            storeInfo: defaultStoreInfo,
            payment: defaultPaymentConfig,
          };

      // Initialize payment service with user's payment configuration
      if (finalSettings.payment) {
        paymentService.setPaymentConfig(finalSettings.payment);
      }
      
      set({
        products: finalProducts,
        categories: finalCategories,
        orders,
        settings: finalSettings,
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

  addCategory: async (category) => {
    try {
      await apiClient.addCategory(category);
      set(state => ({
        categories: [...state.categories, category]
      }));
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  },

  updateCategory: async (category) => {
    try {
      await apiClient.updateCategory(category);
      set(state => ({
        categories: state.categories.map(c =>
          c.id.toString() === category.id.toString() ? category : c
        )
      }));
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await apiClient.deleteCategory(id.toString());
      set(state => ({
        categories: state.categories.filter(c => c.id.toString() !== id.toString())
      }));
    } catch (error) {
      console.error('Failed to delete category:', error);
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

  createOrder: async (paymentDetails: PaymentDetails[], customer?: Customer) => {
    const { cart, products, authenticatedEmployee } = get();
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalPaid = paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);

    // Validate that total payment covers the order total
    if (totalPaid < total) {
      throw new Error('Insufficient payment amount');
    }

    // Determine primary payment method for display
    const primaryPaymentMethod = paymentDetails[0]?.method || 'unknown';

    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
      paymentMethod: primaryPaymentMethod,
      paymentDetails,
      status: 'completed',
      customer, // Add customer to order
      employee: authenticatedEmployee || undefined, // Add employee to order
    };

    try {
      await apiClient.addOrder(order);
      
      // Update product stock levels
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: Math.max(0, product.stock - cartItem.quantity)
          };
        }
        return product;
      });

      // Update products in store
      set(state => ({
        orders: [order, ...state.orders],
        cart: [],
        products: updatedProducts
      }));

      // Check for low stock alerts after order completion
      await stockAlertService.checkAndNotifyLowStock(updatedProducts);
      
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

  updatePaymentConfig: async (paymentConfig: PaymentConfig) => {
    try {
      const newSettings = {
        ...get().settings,
        payment: paymentConfig
      };
      await apiClient.updateSettings(newSettings);
      
      // Update payment service with new configuration
      paymentService.setPaymentConfig(paymentConfig);
      
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update payment config:', error);
      throw error;
    }
  },

  formatPrice: (price: number) => {
    const { settings } = get();
    return `${settings?.currency?.symbol || '$'} ${safeToFixed(price)}`;
  },

  checkLowStockAlerts: async () => {
    const { products } = get();
    const alerts = await stockAlertService.checkAndNotifyLowStock(products);
    set(state => ({
      stockAlerts: [...state.stockAlerts, ...alerts]
    }));
  },

  getStockAlerts: () => {
    return get().stockAlerts;
  },

  markAlertAsRead: (alertId: string) => {
    stockAlertService.markAlertAsRead(alertId);
    set(state => ({
      stockAlerts: state.stockAlerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    }));
  },

  markAllAlertsAsRead: () => {
    stockAlertService.markAllAlertsAsRead();
    set(state => ({
      stockAlerts: state.stockAlerts.map(alert => ({ ...alert, isRead: true }))
    }));
  },

  getUnreadAlertCount: () => {
    return get().stockAlerts.filter(alert => !alert.isRead).length;
  },

  clearStore: () => {
    console.log('Clearing store');
    set({
      products: [],
      categories: [],
      cart: [],
      orders: [],
      settings: {
        currency: defaultCurrency,
        printer: {
          type: 'none'
        },
        storeInfo: defaultStoreInfo,
        payment: defaultPaymentConfig,
      },
      stockAlerts: [],
      initializing: false,
      authenticatedEmployee: null,
      employeeAuthTimeout: null,
      userId: undefined
    });
  },

  setAuthenticatedEmployee: (employee) => {
    console.log('Setting authenticated employee:', employee?.name);
    // Clear any existing timeout
    const { employeeAuthTimeout } = get();
    if (employeeAuthTimeout) {
      clearTimeout(employeeAuthTimeout);
    }
    
    // Set new timeout to clear authentication after 4 hours (Shopify POS default)
    const timeout = setTimeout(() => {
      console.log('Employee authentication timeout');
      set({ authenticatedEmployee: null, employeeAuthTimeout: null });
    }, 4 * 60 * 60 * 1000); // 4 hours
    
    set({ authenticatedEmployee: employee, employeeAuthTimeout: timeout });
  },

  clearEmployeeAuth: () => {
    console.log('Clearing employee authentication');
    const { employeeAuthTimeout } = get();
    if (employeeAuthTimeout) {
      clearTimeout(employeeAuthTimeout);
    }
    set({ authenticatedEmployee: null, employeeAuthTimeout: null });
  }
}));

export default useStore;
