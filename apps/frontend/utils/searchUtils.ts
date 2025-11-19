/**
 * Utility functions for safe searching and filtering
 */

/**
 * Safely checks if a string contains a search query (case-insensitive)
 * @param text - The text to search in (can be undefined/null)
 * @param query - The search query
 * @returns boolean indicating if the text contains the query
 */
export function safeStringIncludes(text: string | undefined | null, query: string): boolean {
  if (!text || !query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Safely filters products based on search query
 * @param products - Array of products to filter
 * @param searchQuery - The search query
 * @param selectedCategoryId - Optional category ID to filter by
 * @returns Filtered array of products
 */
export function filterProducts(
  products: any[], 
  searchQuery: string, 
  selectedCategoryId?: string
): any[] {
  return products.filter(product => {
    // Category filter
    const matchesCategory = selectedCategoryId 
      ? product.categoryId === selectedCategoryId 
      : true;
    
    // Search filter
    const matchesSearch = searchQuery
      ? safeStringIncludes(product.name, searchQuery) ||
        safeStringIncludes(product.categoryName, searchQuery) ||
        safeStringIncludes(product.category, searchQuery) ||
        safeStringIncludes(product.barcode, searchQuery)
      : true;
    
    return matchesCategory && matchesSearch;
  });
}

/**
 * Safely filters customers based on search query
 * @param customers - Array of customers to filter
 * @param searchQuery - The search query
 * @returns Filtered array of customers
 */
export function filterCustomers(customers: any[], searchQuery: string): any[] {
  return customers.filter(customer =>
    safeStringIncludes(customer.name, searchQuery) ||
    safeStringIncludes(customer.email, searchQuery)
  );
}

/**
 * Safely filters categories based on search query
 * @param categories - Array of categories to filter
 * @param searchQuery - The search query
 * @returns Filtered array of categories
 */
export function filterCategories(categories: any[], searchQuery: string): any[] {
  return categories.filter(category =>
    safeStringIncludes(category.name, searchQuery) ||
    safeStringIncludes(category.description, searchQuery)
  );
}