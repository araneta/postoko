//const BASE_URL = 'https://api.example.com';
const BASE_URL = 'http://localhost:3000/api';

import { Product, Order, Settings, Customer, CustomerPurchase, Employee, Role, CartItem, StripeSessionData, StripeSessionDetails, PayPalOrdersCreateRequest,OrdersGetRequest, EmployeePINLoginResponse } from '../types';
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
      window.alert("Session expired. Please sign in again.");
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
    return (products || []).map(product => ({
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
    if (!Array.isArray(orders)) {
        return [];
    }

    return orders.map(order => ({
      ...order,
      total: safeToNumber(order.total),
      items: (order.items || []).map(item => ({
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

  // Analytics
  async getAnalytics() {
    return this.fetchJSON(`${BASE_URL}/orders/analytics`);
  }

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.fetchJSON(`${BASE_URL}/orders/reports?period=${period}`);
  }

  async getBestSellers(limit: number = 10, period: 'all' | 'week' | 'month' | 'year' = 'all') {
    return this.fetchJSON(`${BASE_URL}/orders/best-sellers?limit=${limit}&period=${period}`);
  }

  async getPeakHours(days: number = 30) {
    return this.fetchJSON(`${BASE_URL}/orders/peak-hours?days=${days}`);
  }

  async getProfitMargin(period: 'week' | 'month' | 'year' = 'month') {
    return this.fetchJSON(`${BASE_URL}/orders/profit-margin?period=${period}`);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.fetchJSON<Customer[]>(`${BASE_URL}/customers`);
  }

  async addCustomer(customer: Customer): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(customer: Customer): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomerPurchases(customerId: string): Promise<CustomerPurchase[]> {
    return this.fetchJSON<CustomerPurchase[]>(`${BASE_URL}/customers/${customerId}/purchases`);
  }

  // Loyalty
  async getCustomerPoints(customerId: string) {
    return this.fetchJSON(`${BASE_URL}/loyalty/customers/${customerId}/points`);
  }

  async getCustomerTransactions(customerId: string) {
    return this.fetchJSON(`${BASE_URL}/loyalty/customers/${customerId}/transactions`);
  }

  async earnPoints({ customerId, orderId, amount }: { customerId: string, orderId: string, amount: string }) {
    return this.fetchJSON(`${BASE_URL}/loyalty/earn`, {
      method: 'POST',
      body: JSON.stringify({ customerId, orderId, amount }),
    });
  }

  async redeemPoints({ customerId, pointsToRedeem, orderId }: { customerId: string, pointsToRedeem: number, orderId?: string }) {
    return this.fetchJSON(`${BASE_URL}/loyalty/redeem`, {
      method: 'POST',
      body: JSON.stringify({ customerId, pointsToRedeem, orderId }),
    });
  }

  async getLoyaltySettings() {
    return this.fetchJSON(`${BASE_URL}/loyalty/settings`);
  }

  async updateLoyaltySettings(settings: any) {
    return this.fetchJSON(`${BASE_URL}/loyalty/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return this.fetchJSON<Employee[]>(`${BASE_URL}/employees`);
  }
  async addEmployee(employee: Partial<Employee> & {  pin?: string }): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/employees`, {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }
  async updateEmployee(employee: Partial<Employee> & { id: string; pin?: string }): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/employees/${employee.id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  }
  async validateEmployeePin(employeeId: string, pin: string): Promise<EmployeePINLoginResponse> {
    
      console.log(`Validating PIN for employee ${employeeId}`);
      const result = await this.fetchJSON<EmployeePINLoginResponse>(`${BASE_URL}/employees/${employeeId}/validate-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      //console.log(`PIN validation result for employee ${employeeId}:`, result.message);
      return result;
    
  }
  async deleteEmployee(id: string): Promise<void> {
    await this.fetchJSON(`${BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
  }
  // Roles (assuming endpoint /api/roles in the future)
  async getRoles(): Promise<Role[]> {
    return this.fetchJSON<Role[]>(`${BASE_URL}/roles`);
  }

  async processCardPaymentStripe(cart:CartItem[]): Promise<StripeSessionData> {
      const data = await this.fetchJSON<StripeSessionData>(`${BASE_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        body: JSON.stringify(cart),
      });
      return data; // Use URL for redirection to Stripe Checkout
    }

    async getStripeSession(sessionID:string): Promise<StripeSessionDetails> {
      const data = await this.fetchJSON<StripeSessionDetails>(`${BASE_URL}/stripe/check-session/${sessionID}`, {
        method: 'GET',        
      });
      return data; // Use URL for redirection to Stripe Checkout
    }

     async processPaypal(cart:CartItem[]): Promise<PayPalOrdersCreateRequest> {
      const data = await this.fetchJSON<PayPalOrdersCreateRequest>(`${BASE_URL}/paypal/create-checkout-session`, {
        method: 'POST',
        body: JSON.stringify(cart),
      });
      return data; // Use URL for redirection to Stripe Checkout
    }

    async getPaypalSession(sessionID:string): Promise<OrdersGetRequest> {
      const data = await this.fetchJSON<OrdersGetRequest>(`${BASE_URL}/paypal/check-session/${sessionID}`, {
        method: 'GET',        
      });
      return data; // Use URL for redirection to Stripe Checkout
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
export const getCustomers = () => apiClient.getCustomers();
export const addCustomer = (customer: Customer) => apiClient.addCustomer(customer);
export const updateCustomer = (customer: Customer) => apiClient.updateCustomer(customer);
export const deleteCustomer = (id: string) => apiClient.deleteCustomer(id);
export const getCustomerPurchases = (customerId: string) => apiClient.getCustomerPurchases(customerId); 

// Loyalty exports
export const getCustomerPoints = (customerId: string) => apiClient.getCustomerPoints(customerId);
export const getCustomerTransactions = (customerId: string) => apiClient.getCustomerTransactions(customerId);
export const earnPoints = (params: { customerId: string, orderId: string, amount: string }) => apiClient.earnPoints(params);
export const redeemPoints = (params: { customerId: string, pointsToRedeem: number, orderId?: string }) => apiClient.redeemPoints(params); 
export const getLoyaltySettings = () => apiClient.getLoyaltySettings();
export const updateLoyaltySettings = (settings: any) => apiClient.updateLoyaltySettings(settings); 

// Employee exports
export const getEmployees = () => apiClient.getEmployees();
export const addEmployee = (employee: Partial<Employee> & { pin?: string }) => apiClient.addEmployee(employee);
export const updateEmployee = (employee: Partial<Employee> & { id: string; pin?: string }) => apiClient.updateEmployee(employee);
export const deleteEmployee = (id: string) => apiClient.deleteEmployee(id);
export const getRoles = () => apiClient.getRoles();
export const validateEmployeePin = (employeeId: string, pin: string) => apiClient.validateEmployeePin(employeeId, pin);

//stripe payment processing
export const processCardPaymentStripe = (cart: CartItem[]) => apiClient.processCardPaymentStripe(cart);
export const getStripeSession = (sessionID: string) => apiClient.getStripeSession(sessionID);          
//paypal payment processing
export const processPaypal = (cart: CartItem[]) => apiClient.processPaypal(cart); // Export the function to process PayPal payments
export const getPaypalSession = (sessionID: string) => apiClient.getPaypalSession(sessionID);          