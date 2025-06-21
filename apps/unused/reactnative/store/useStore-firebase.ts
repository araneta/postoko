import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, Order, Currency, Settings, StoreInfo, PrinterSettings } from '../types';
import { supabase } from '../lib/supabase';

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
  syncWithCloud: () => Promise<void>;
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

  addProduct: async (product) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('products').insert({
      ...product,
      profile_id: user.id
    });
    if (error) throw error;

    set((state) => {
      const products = [...state.products, product];
      AsyncStorage.setItem('products', JSON.stringify(products));
      return { products };
    });
  },

  updateProduct: async (product) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('products')
      .update(product)
      .eq('id', product.id)
      .eq('profile_id', user.id);
    if (error) throw error;

    set((state) => {
      const products = state.products.map((p) =>
        p.id === product.id ? product : p
      );
      AsyncStorage.setItem('products', JSON.stringify(products));
      return { products };
    });
  },

  deleteProduct: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('products')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id);
    if (error) throw error;

    set((state) => {
      const products = state.products.filter((p) => p.id !== id);
      AsyncStorage.setItem('products', JSON.stringify(products));
      return { products };
    });
  },

  addToCart: (product) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },

  updateCartItemQuantity: (productId, quantity) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  createOrder: async (paymentMethod) => {
    const { cart, orders } = get();
    if (cart.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
      paymentMethod,
      status: 'completed',
    };

    const { error } = await supabase.from('orders').insert({
      profile_id: user.id,
      items: order.items,
      total: order.total,
      payment_method: order.paymentMethod,
      status: order.status
    });
    if (error) throw error;

    set((state) => {
      const newOrders = [...state.orders, order];
      AsyncStorage.setItem('orders', JSON.stringify(newOrders));
      return { orders: newOrders, cart: [] };
    });

    return order;
  },

  updateCurrency: async (currency: Currency) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('profiles')
      .update({
        settings: { ...get().settings, currency }
      })
      .eq('id', user.id);
    if (error) throw error;

    set((state) => {
      const newSettings = { ...state.settings, currency };
      AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  updatePrinterSettings: async (printerSettings: PrinterSettings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('profiles')
      .update({
        settings: { ...get().settings, printer: printerSettings }
      })
      .eq('id', user.id);
    if (error) throw error;

    set((state) => {
      const newSettings = { ...state.settings, printer: printerSettings };
      AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  updateStoreInfo: async (storeInfo: StoreInfo) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('profiles')
      .update({ store_info: storeInfo })
      .eq('id', user.id);
    if (error) throw error;

    set((state) => {
      const newSettings = { ...state.settings, storeInfo };
      AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  formatPrice: (price: number) => {
    const { settings } = get();
    return `${settings.currency.symbol}${price.toFixed(2)}`;
  },

  syncWithCloud: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch and sync products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('profile_id', user.id);
    if (productsError) throw productsError;

    // Fetch and sync orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('profile_id', user.id);
    if (ordersError) throw ordersError;

    // Fetch and sync profile settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    set({
      products,
      orders,
      settings: {
        ...get().settings,
        ...profile.settings,
        storeInfo: profile.store_info
      }
    });

    // Update local storage
    await AsyncStorage.setItem('products', JSON.stringify(products));
    await AsyncStorage.setItem('orders', JSON.stringify(orders));
    await AsyncStorage.setItem('settings', JSON.stringify(profile.settings));
  },
}));

export default useStore;