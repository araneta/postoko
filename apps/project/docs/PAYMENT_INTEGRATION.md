# Multiple Payment Methods Integration (SaaS)

## Overview

This POS app now supports multiple payment methods to expand your customer base beyond cash-only transactions. The integration is designed for a SaaS model where each user can configure their own payment settings.

- **Cash Payments** - Traditional cash transactions with change calculation
- **Credit/Debit Cards** - Secure card processing via Stripe
- **Digital Wallets** - Apple Pay, Google Pay, and PayPal support

## Features

### 1. Cash Payments
- Quick amount buttons for common denominations
- Automatic change calculation
- Receipt printing with change details

### 2. Card Payments
- Secure card number input with formatting
- Real-time validation (Luhn algorithm)
- Expiry date and CVC validation
- Stripe integration for processing
- Transaction ID tracking

### 3. Digital Wallets
- Apple Pay support
- Google Pay support
- PayPal integration
- Secure wallet authentication

### 4. Enhanced Receipts
- Detailed payment information
- Transaction IDs
- Card details (masked)
- Wallet type information
- Change calculations

### 5. SaaS Configuration
- Per-user payment settings
- Secure storage of Stripe keys
- Configurable payment methods
- Enable/disable payment processing

## Setup Instructions

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install @stripe/stripe-react-native expo-dev-client

# Backend dependencies
cd server
npm install stripe
```

### 2. Configure Payment Settings

1. **Access Settings**: Go to Settings → Payment Methods in the app
2. **Enable Payments**: Toggle "Enable Payment Processing"
3. **Add Stripe Keys**: Enter your Stripe API keys:
   - Publishable Key (pk_test_...)
   - Secret Key (sk_test_...)
4. **Select Methods**: Choose which payment methods to accept
5. **Save Settings**: Click "Save Settings" to apply changes

### 3. Start the Payment Server

```bash
cd server
npm run payment
```

The server will run on `http://localhost:3000`

## User Configuration

### Payment Settings Structure

Each user's payment configuration is stored in their settings:

```typescript
interface PaymentConfig {
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  paymentMethods: PaymentMethod[];
  enabled: boolean;
}
```

### Available Payment Methods

- `cash` - Cash payments with change calculation
- `card` - Credit/debit card processing
- `digital_wallet` - Digital wallet payments
- `bank_transfer` - Bank transfer payments

### Security Features

- **Encrypted Storage**: Stripe keys are stored securely in the database
- **Per-User Isolation**: Each user has their own payment configuration
- **No Hardcoded Keys**: No environment variables or hardcoded keys
- **Validation**: All payment inputs are validated before processing

## API Endpoints

### Payment Endpoints

- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment intent
- `POST /api/payments/process-card` - Process card payment
- `POST /api/payments/process-wallet` - Process digital wallet payment

### Data Endpoints

- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Add new order
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## Usage

### Processing a Payment

1. **Add items to cart** in the POS interface
2. **Click "Complete Sale"** to open the payment modal
3. **Select payment method**:
   - Cash: Enter amount received, view change
   - Card: Enter card details, expiry, CVC
   - Digital Wallet: Select wallet type
4. **Complete payment** - Transaction is processed and receipt printed

### Payment Validation

The system includes comprehensive validation:

- **Card Numbers**: Luhn algorithm validation
- **Expiry Dates**: Future date validation
- **CVC**: 3-4 digit validation
- **Amounts**: Minimum payment validation
- **Configuration**: Payment method availability check

## Security Features

### Frontend Security
- Card numbers are never stored locally
- CVC is masked during input
- Secure transmission to backend
- Input validation and sanitization
- Payment configuration validation

### Backend Security
- Stripe handles sensitive card data
- No card data stored on server
- HTTPS encryption (in production)
- Per-user payment configuration
- Configuration validation

### SaaS Security
- User isolation for payment settings
- Encrypted storage of API keys
- Role-based access control
- Audit logging for payment changes

## Testing

### Test Card Numbers

Use these Stripe test card numbers:

- **Visa**: 4242424242424242
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005
- **Declined**: 4000000000000002

### Test CVC and Expiry
- **CVC**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)

### Test Configuration

1. **Enable Payments**: Toggle payment processing on
2. **Add Test Keys**: Use Stripe test keys
3. **Select Methods**: Enable cash and card payments
4. **Test Transactions**: Process test payments

## Production Deployment

### 1. Update API Keys
Users should replace test keys with live keys in their settings:

```typescript
// User settings
{
  stripePublishableKey: 'pk_live_your_live_publishable_key',
  stripeSecretKey: 'sk_live_your_live_secret_key',
  paymentMethods: ['cash', 'card', 'digital_wallet'],
  enabled: true
}
```

### 2. SSL Certificate
Ensure HTTPS is enabled for secure payment processing.

### 3. Database Security
- Encrypt sensitive payment configuration
- Implement proper user authentication
- Set up database backups
- Monitor payment configuration changes

### 4. Error Handling
Implement comprehensive error handling and logging.

### 5. Monitoring
Set up Stripe webhooks for payment monitoring and reconciliation.

## Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check user's Stripe API key configuration
   - Verify payment processing is enabled
   - Check network connectivity

2. **Card Validation Errors**
   - Ensure test card numbers are used
   - Verify expiry date is in the future
   - Check CVC format (3-4 digits)

3. **Payment Method Not Available**
   - Check if payment method is enabled in settings
   - Verify payment processing is enabled
   - Check user's payment configuration

4. **Receipt Printing Issues**
   - Check printer connection
   - Verify printer settings
   - Test with web printing first

### Debug Mode

Enable debug logging:

```typescript
// Frontend
console.log('Payment config:', paymentService.getPaymentConfig());
console.log('Available methods:', paymentService.getAvailablePaymentMethods());

// Backend
console.log('User config:', config);
console.log('Payment intent:', paymentIntent);
```

## Support

For technical support:

1. Check the Stripe documentation: [stripe.com/docs](https://stripe.com/docs)
2. Review the payment service logs
3. Test with Stripe's test mode first
4. Contact your payment processor for production issues
5. Check user's payment configuration in settings

## Future Enhancements

- **Split Payments**: Multiple payment methods per transaction
- **Refunds**: Automated refund processing
- **Gift Cards**: Gift card integration
- **Loyalty Programs**: Points and rewards
- **Contactless Payments**: NFC support
- **QR Code Payments**: QR code generation
- **Invoice Generation**: Email receipts
- **Analytics**: Payment method analytics
- **Multi-tenant**: Enhanced SaaS features
- **Payment Templates**: Pre-configured payment setups 