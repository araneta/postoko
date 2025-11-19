# Category Management System

This document describes the complete category management interface for store owners.

## Features Implemented

### 1. Category Management Screen (`/categories`)
- **Category List**: Display all categories with name and description
- **Add Category**: Form with name (required) and description (optional)
- **Edit Category**: Modal form for updating categories
- **Delete Category**: Confirmation dialog for category deletion
- **Search/Filter**: Search categories by name or description

### 2. Product Management Integration
- **Category Dropdown**: CategoryPicker component for product forms
- **Category Display**: Shows category name in ProductCard component
- **Category Filter**: Filter products by category in both Products and POS screens
- **Backward Compatibility**: Maintains existing `category` field while adding new `categoryId` and `categoryName` fields

### 3. API Endpoints Used
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/products` - Get products (now includes categoryId and categoryName)
- `POST /api/products` - Create product (requires categoryId instead of category)
- `PUT /api/products/:id` - Update product (requires categoryId)

## Components Created

### CategoryCard
- Displays category information with name and description
- Includes edit and delete action buttons
- Responsive design with proper styling

### CategoryForm
- Modal form for adding/editing categories
- Form validation (name is required)
- Character limits (name: 50, description: 200)
- Error handling and display

### CategoryPicker
- Dropdown component for selecting categories in product forms
- Uses React Native Picker for native feel
- Handles category selection and updates parent component

### CategoryFilter
- Horizontal scrollable filter chips
- Shows all categories with "All Categories" option
- Visual indication of selected category
- Used in both Products and POS screens

## Navigation Integration

Categories tab is added to the main navigation with appropriate role-based access:
- **Staff**: Can view categories
- **Manager/Admin**: Full category management access
- **Cashier**: No category access (focuses on sales)

## Data Structure

### Category Interface
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Updated Product Interface
```typescript
interface Product {
  // ... existing fields
  category: string; // Kept for backward compatibility
  categoryId?: string; // New field for category ID
  categoryName?: string; // New field for category name display
}
```

## Usage Examples

### Adding a Category
1. Navigate to Categories tab
2. Click "Add Category" button
3. Fill in name (required) and description (optional)
4. Click "Save"

### Editing a Category
1. In Categories screen, click edit icon on category card
2. Modify name or description
3. Click "Update"

### Deleting a Category
1. Click delete icon on category card
2. Confirm deletion in alert dialog

### Using Categories in Products
1. When adding/editing products, use the Category dropdown
2. Select from existing categories
3. Category name will be displayed on product cards

### Filtering Products by Category
1. In Products or POS screen, use the category filter chips
2. Click on a category to filter products
3. Click "All Categories" to show all products

## Search Functionality

Both Products and POS screens include enhanced search that works across:
- Product names
- Category names
- Product barcodes
- Product descriptions

## Sample Data

The system automatically creates sample categories if none exist:
- Beverages
- Snacks  
- Candy

Sample products are also updated to include category information.

## Error Handling

- Form validation with user-friendly error messages
- API error handling with retry suggestions
- Graceful fallbacks for missing category data
- Confirmation dialogs for destructive actions

## Styling

All components follow the existing app design system:
- Consistent color scheme (#007AFF primary, #FF3B30 danger)
- Proper spacing and typography
- Shadow effects and rounded corners
- Responsive layouts for different screen sizes