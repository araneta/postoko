# React Native POS System

A modern Point of Sale (POS) system built with React Native, featuring a clean interface and comprehensive functionality for retail businesses.

## Features

### 🛍️ Point of Sale
- **Product Selection**: Browse and add products to cart with beautiful product cards
- **Cart Management**: Add, remove, and adjust quantities with intuitive controls
- **Payment Processing**: Complete sales with cash payment and change calculation
- **Receipt Generation**: Print or display receipts for completed orders

### 📦 Product Management
- **Product CRUD**: Create, read, update, and delete products
- **Product Details**: Name, price, stock, category, description, and images
- **Stock Tracking**: Monitor inventory levels
- **Category Organization**: Organize products by categories

### 📋 Order History
- **Order Tracking**: View all completed orders with detailed information
- **Order Details**: Items, quantities, prices, and payment methods
- **Date/Time Stamps**: Track when orders were completed
- **Status Management**: Monitor order status (completed/refunded)

### ⚙️ Settings
- **Multi-Currency Support**: Support for 11+ currencies with proper formatting
- **Store Information**: Configure store details for receipts
- **System Preferences**: Notifications and backup settings
- **App Information**: Version and about details

## Technical Stack

- **Framework**: React Native 0.73.2
- **Navigation**: React Navigation 6.x with bottom tabs
- **State Management**: Zustand for global state
- **Database**: SQLite for local data persistence
- **Icons**: React Native Vector Icons (Ionicons)
- **Animations**: React Native Reanimated 3.x
- **Gestures**: React Native Gesture Handler

## Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # Business logic and external services
├── store/              # State management
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

### Key Components
- **ProductCard**: Reusable product display component
- **DatabaseService**: SQLite database operations
- **PrinterService**: Receipt printing functionality
- **Store**: Zustand-based state management

## Database Schema

### Products Table
- `id`: Unique identifier
- `name`: Product name
- `price`: Product price
- `stock`: Available quantity
- `category`: Product category
- `description`: Product description
- `image`: Product image URL

### Orders Table
- `id`: Unique identifier
- `items`: JSON array of order items
- `total`: Order total amount
- `date`: Order date/time
- `payment_method`: Payment method used
- `status`: Order status

### Settings Table
- `currency`: Selected currency configuration
- `printer`: Printer settings
- `store_info`: Store information

## Getting Started

### Prerequisites
- Node.js 18+
- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ReactNativePOS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Run the application**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   
   # Start Metro bundler
   npm start
   ```

## Features in Detail

### Modern UI/UX
- **Clean Design**: Modern, professional interface suitable for retail environments
- **Responsive Layout**: Optimized for tablets and phones
- **Intuitive Navigation**: Easy-to-use tab-based navigation
- **Visual Feedback**: Loading states, animations, and user feedback

### Data Persistence
- **Local SQLite Database**: All data stored locally for offline functionality
- **Automatic Initialization**: Database and sample data created on first run
- **Data Integrity**: Proper error handling and data validation

### Extensibility
- **Modular Architecture**: Easy to extend with new features
- **Service Layer**: Clean separation of business logic
- **Type Safety**: Full TypeScript implementation
- **Component Reusability**: Well-structured component hierarchy

## Future Enhancements

- **Barcode Scanning**: Product lookup via barcode
- **Bluetooth Printing**: Physical receipt printer integration
- **Cloud Sync**: Backup and sync across devices
- **Analytics**: Sales reporting and analytics
- **Multi-Payment**: Credit card and digital payment support
- **User Management**: Multiple user accounts and permissions

## Development

### Code Style
- ESLint configuration for code quality
- Prettier for code formatting
- TypeScript for type safety

### Testing
```bash
npm test
```

### Building
```bash
# Android
npm run build

# iOS
# Use Xcode to build and archive
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support and questions, please open an issue in the repository.