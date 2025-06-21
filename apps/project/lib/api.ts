//const BASE_URL = 'https://api.example.com';
const BASE_URL = 'http://localhost:3000/api';

import { Product, Order, Settings } from '../types';

// API Client class to handle authentication
class APIClient {
  private userId?: string;
  private token?: string;

  setAuth( token?: string) {    
    this.token = token;
  }

  private async fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json'
    };
    
    // Add any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    // Add user ID to headers if available
    //if (this.userId) {
      //headers['X-User-ID'] = this.userId;
    //}

    // Add JWT token to Authorization header if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      headers,
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.fetchJSON<Product[]>(`${BASE_URL}/products`);
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
    return this.fetchJSON<Order[]>(`${BASE_URL}/orders`);
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
export function configureAPI(token?: string) {
  console.log('Configuring API with token:', token);
  apiClient.setAuth( token);
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
