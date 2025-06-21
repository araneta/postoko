# BoltexPOS - Point of Sale System

A modern point of sale system built with React Native, Expo, and Clerk authentication.

## Authentication Flow

The application now properly initializes the store only after successful user authentication. Here's how it works:

### Store Initialization
- The store is initialized only when a user successfully logs in
- The Clerk user ID is passed to the store initialization
- All API requests include the user ID in the `X-User-ID` header for authentication
- When a user signs out, the store is cleared to prevent data leakage

### Key Changes Made

1. **API Layer (`lib/api.ts`)**:
   - Modified all API functions to accept an optional `userId` parameter
   - Added `X-User-ID` header to all requests when user ID is provided
   - Updated fetch helper to properly handle headers

2. **Store (`store/useStore.ts`)**:
   - Added `userId` state to store the current user ID
   - Modified `initializeStore` to accept and store the user ID
   - Updated all API calls to use the stored user ID
   - Added `clearStore` function to reset state on sign out

3. **Layout (`app/_layout.tsx`)**:
   - Modified to initialize store only after successful authentication
   - Added logic to clear store when user signs out
   - Uses Clerk's `useUser()` hook to get the user ID

### Usage

The store will automatically:
- Initialize with user data when a user signs in
- Include the user ID in all API requests
- Clear all data when the user signs out

No additional configuration is needed - the authentication flow is handled automatically by the layout component.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for web
npm run build:web

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## API Endpoints

All API endpoints now support user authentication via the `X-User-ID` header:

- `GET /api/products` - Get user's products
- `POST /api/products` - Add a product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create an order
- `GET /api/settings` - Get user's settings
- `PUT /api/settings` - Update user's settings 