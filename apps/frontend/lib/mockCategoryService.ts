import { Category } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_STORAGE_KEY = 'pos_categories';

/**
 * Mock category service that uses localStorage
 * This is a temporary solution until the backend API is implemented
 */
class MockCategoryService {
  private async getStoredCategories(): Promise<Category[]> {
    try {
      const stored = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load categories from AsyncStorage:', error);
      return [];
    }
  }

  private async saveCategories(categories: Category[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.warn('Failed to save categories to AsyncStorage:', error);
    }
  }

  async getCategories(): Promise<Category[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = await this.getStoredCategories();
    
    // Initialize with sample data if empty
    if (categories.length === 0) {
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
      return sampleCategories;
    }
    
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

  async deleteCategory(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = await this.getStoredCategories();
    const filteredCategories = categories.filter(c => c.id !== id);
    
    if (filteredCategories.length === categories.length) {
      throw new Error('Category not found');
    }
    
    await this.saveCategories(filteredCategories);
  }
}

export const mockCategoryService = new MockCategoryService();