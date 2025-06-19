const BASE_URL = 'https://api.example.com';

import { Product, Order, Settings } from '../types';

// Helper for fetch with JSON
async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Products
export async function getProducts(): Promise<Product[]> {
  return fetchJSON<Product[]>(`${BASE_URL}/products`);
}

export async function addProduct(product: Product): Promise<void> {
  await fetchJSON(`${BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(product: Product): Promise<void> {
  await fetchJSON(`${BASE_URL}/products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await fetchJSON(`${BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
}

// Orders
export async function getOrders(): Promise<Order[]> {
  return fetchJSON<Order[]>(`${BASE_URL}/orders`);
}

export async function addOrder(order: Order): Promise<void> {
  await fetchJSON(`${BASE_URL}/orders`, {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

// Settings
export async function getSettings(): Promise<Settings> {
  return fetchJSON<Settings>(`${BASE_URL}/settings`);
}

export async function updateSettings(settings: Settings): Promise<void> {
  await fetchJSON(`${BASE_URL}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
} 