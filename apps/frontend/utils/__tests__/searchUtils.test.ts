import { safeStringIncludes, filterProducts, filterCustomers, filterCategories } from '../searchUtils';

// Mock data for testing
const mockProducts = [
  {
    id: '1',
    name: 'Coca Cola',
    category: 'Beverages',
    categoryId: 'cat-1',
    categoryName: 'Beverages',
    barcode: '123456789'
  },
  {
    id: '2',
    name: 'Chips',
    category: null, // Test null category
    categoryId: 'cat-2',
    categoryName: 'Snacks',
    barcode: '987654321'
  },
  {
    id: '3',
    name: undefined, // Test undefined name
    category: 'Candy',
    categoryId: 'cat-3',
    categoryName: 'Candy',
    barcode: '555666777'
  }
];

const mockCustomers = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: null, email: 'jane@example.com' }, // Test null name
  { id: '3', name: 'Bob Smith', email: undefined } // Test undefined email
];

const mockCategories = [
  { id: '1', name: 'Beverages', description: 'Drinks and refreshments' },
  { id: '2', name: 'Snacks', description: null }, // Test null description
  { id: '3', name: 'Candy', description: undefined } // Test undefined description
];

describe('searchUtils', () => {
  describe('safeStringIncludes', () => {
    it('should return true for matching strings', () => {
      expect(safeStringIncludes('Hello World', 'hello')).toBe(true);
      expect(safeStringIncludes('Hello World', 'WORLD')).toBe(true);
    });

    it('should return false for non-matching strings', () => {
      expect(safeStringIncludes('Hello World', 'xyz')).toBe(false);
    });

    it('should handle null/undefined safely', () => {
      expect(safeStringIncludes(null, 'test')).toBe(false);
      expect(safeStringIncludes(undefined, 'test')).toBe(false);
      expect(safeStringIncludes('test', '')).toBe(false);
    });
  });

  describe('filterProducts', () => {
    it('should filter products by name', () => {
      const result = filterProducts(mockProducts, 'coca');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Coca Cola');
    });

    it('should filter products by category', () => {
      const result = filterProducts(mockProducts, 'beverages');
      expect(result).toHaveLength(1);
      expect(result[0].categoryName).toBe('Beverages');
    });

    it('should filter products by barcode', () => {
      const result = filterProducts(mockProducts, '123456789');
      expect(result).toHaveLength(1);
      expect(result[0].barcode).toBe('123456789');
    });

    it('should handle null/undefined values safely', () => {
      const result = filterProducts(mockProducts, 'test');
      expect(result).toHaveLength(0); // No matches, but no errors
    });

    it('should filter by category ID', () => {
      const result = filterProducts(mockProducts, '', 'cat-1');
      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('cat-1');
    });
  });

  describe('filterCustomers', () => {
    it('should filter customers by name', () => {
      const result = filterCustomers(mockCustomers, 'john');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should filter customers by email', () => {
      const result = filterCustomers(mockCustomers, 'jane@example');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('jane@example.com');
    });

    it('should handle null/undefined values safely', () => {
      const result = filterCustomers(mockCustomers, 'nonexistent');
      expect(result).toHaveLength(0); // No matches, but no errors
    });
  });

  describe('filterCategories', () => {
    it('should filter categories by name', () => {
      const result = filterCategories(mockCategories, 'beverages');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Beverages');
    });

    it('should filter categories by description', () => {
      const result = filterCategories(mockCategories, 'drinks');
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Drinks and refreshments');
    });

    it('should handle null/undefined descriptions safely', () => {
      const result = filterCategories(mockCategories, 'snacks');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Snacks');
    });
  });
});