//const BASE_URL = 'https://api.example.com';
const BASE_URL = 'http://localhost:3000/api';

import { Product, Order, Settings } from '../types';
import { safeToNumber, safeToInteger } from '../utils/formatters';

// API Client class to handle authentication
class APIClient {
  private getToken?: () => Promise<string | null | undefined>;

  setAuth(getToken?: () => Promise<string | null | undefined>) {
    this.getToken = getToken;
  }

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

  // Products
  async getProducts(): Promise<Product[]> {
    const products = await this.fetchJSON<Product[]>(`${BASE_URL}/products`);
    // Normalize the data to ensure price and stock are numbers
    return products.map(product => ({
      ...product,
      price: safeToNumber(product.price),
      stock: safeToInteger(product.stock),
    }));
  }

  async addProduct(product: Product): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(product: Product): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const orders = await this.fetchJSON<Order[]>(`${BASE_URL}/orders`);
    // Normalize the data to ensure totals and item prices are numbers
    return orders.map(order => ({
      ...order,
      total: safeToNumber(order.total),
      items: order.items.map(item => ({
        ...item,
        price: safeToNumber(item.price),
        stock: safeToInteger(item.stock),
      })),
    }));
  }

  async addOrder(order: Order): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.fetchJSON<Settings>(`${BASE_URL}/settings`);
  }

  async updateSettings(settings: Settings): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Authentication
  async login(email: string): Promise<{ id: string }> {
    return this.fetchJSON<{ id: string }>(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}

// Create a singleton instance
const apiClient = new APIClient();

// Export the client and a function to configure it
export { apiClient };

// Helper function to configure the API client with auth
export function configureAPI(getToken?: () => Promise<string | null | undefined>) {
  console.log('Configuring API with getToken function');
  apiClient.setAuth(getToken);
}

// Export individual functions for backward compatibility (optional)
export const getProducts = () => apiClient.getProducts();
export const addProduct = (product: Product) => apiClient.addProduct(product);
export const updateProduct = (product: Product) => apiClient.updateProduct(product);
export const deleteProduct = (id: string) => apiClient.deleteProduct(id);
export const getOrders = () => apiClient.getOrders();
export const addOrder = (order: Order) => apiClient.addOrder(order);
export const getSettings = () => apiClient.getSettings();
export const updateSettings = (settings: Settings) => apiClient.updateSettings(settings);
export const login = (email: string) => apiClient.login(email); 