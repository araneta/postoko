import { Category } from '../types';

// Try to import AsyncStorage, fallback to localStorage for web
let storage: any;
try {
  // React Native
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
} catch (error) {
  // Web fallback
  storage = {
    async getItem(key: string): Promise<string | null> {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors
      }
    }
  };
}

const CATEGORIES_STORAGE_KEY = 'pos_categories';

/**
 * Mock category service that uses localStorage
 * This is a temporary solution until the backend API is implemented
 */
class MockCategoryService {
  private async getStoredCategories(): Promise<Category[]> {
    try {
      const stored = await storage.getItem(CATEGORIES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load categories from storage:', error);
      return [];
    }
  }

  private async saveCategories(categories: Category[]): Promise<void> {
    try {
      await storage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.warn('Failed to save categories to storage:', error);
    }
  }

  async getCategories(): Promise<Category[]> {
    console.log('MockCategoryService: getCategories called');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = await this.getStoredCategories();
    console.log('MockCategoryService: loaded categories from storage:', categories.length);
    
    // Initialize with sample data if empty
    if (categories.length === 0) {
      console.log('MockCategoryService: initializing with sample data');
      const sampleCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Beverages',
          description: 'Drinks and refreshments',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-2',
          name: 'Snacks',
          description: 'Chips, crackers, and light snacks',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cat-3',
          name: 'Candy',
          description: 'Sweets and confectionery',
          createdAt: new Date().toISOString()
        }
      ];
      
      await this.saveCategories(sampleCategories);
      console.log('MockCategoryService: saved sample categories');
      return sampleCategories;
    }
    
    console.log('MockCategoryService: returning existing categories:', categories);
    return categories;
  }

  async addCategory(category: Category): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = await this.getStoredCategories();
    const newCategory = {
      ...category,
      createdAt: category.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    await this.saveCategories(categories);
  }

  async updateCategory(category: Category): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = await this.getStoredCategories();
    const index = categories.findIndex(c => c.id === category.id);
    
    if (index !== -1) {
      categories[index] = {
        ...category,
        updatedAt: new Date().toISOString()
      };
      await this.saveCategories(categories);
    } else {
      throw new Error('Category not found');
    }
  }

  async deleteCategory(id: string | number): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = await this.getStoredCategories();
    const filteredCategories = categories.filter(c => c.id.toString() !== id.toString());
    
    if (filteredCategories.length === categories.length) {
      throw new Error('Category not found');
    }
    
    await this.saveCategories(filteredCategories);
  }
}

export const mockCategoryService = new MockCategoryService();