# Stripe React Native SDK Integration

This document provides a comprehensive guide to the Stripe payment integration using the official Stripe React Native SDK in your POS application.

## Overview

The Stripe integration provides:
- **Native Card Input**: Secure card input using Stripe's native components
- **Digital Wallet Support**: Apple Pay and Google Pay integration
- **Cash Payments**: Traditional cash payment processing
- **Payment Intent Management**: Server-side payment intent creation and confirmation
- **Multi-currency Support**: Support for various currencies including zero-decimal currencies

## Architecture

### Components

1. **StripeProvider** (`components/StripeProvider.tsx`)
   - Wraps the app with Stripe SDK provider
   - Manages Stripe configuration and initialization
   - Validates payment settings

2. **StripePaymentModal** (`components/StripePaymentModal.tsx`)
   - Main payment interface
   - Native card input using `CardField`
   - Digital wallet payment buttons
   - Cash payment handling

3. **StripeService** (`lib/stripeService.ts`)
   - Payment intent creation and confirmation
   - Payment method validation
   - Currency handling and formatting
   - Configuration management

4. **useStripePayment Hook** (`hooks/useStripePayment.ts`)
   - Manages payment modal state
   - Provides payment completion callbacks
   - Handles payment processing state

## Setup Instructions

### 1. Install Dependencies

The Stripe React Native SDK is already installed in your project:

```json
{
  "dependencies": {
    "@stripe/stripe-react-native": "^0.48.0"
  }
}
```

### 2. Configure Stripe Provider

The `StripeProvider` is automatically configured in `app/_layout.tsx`:

```typescript
import StripeProvider from '../components/StripeProvider';

// In your app layout
<StripeProvider>
  <Stack>
    {/* Your app screens */}
  </Stack>
</StripeProvider>
```

### 3. Configure Payment Settings

In your app settings, configure Stripe API keys:

```typescript
const paymentConfig: PaymentConfig = {
  stripePublishableKey: 'pk_test_your_publishable_key',
  stripeSecretKey: 'sk_test_your_secret_key',
  paymentMethods: ['cash', 'card', 'digital_wallet'],
  enabled: true,
};
```

### 4. Update Merchant Identifier (iOS)

For Apple Pay support, update the merchant identifier in `components/StripeProvider.tsx`:

```typescript
<StripeSDKProvider
  publishableKey={stripePublishableKey}
  merchantIdentifier="merchant.com.yourcompany.pos" // Update this
  urlScheme="your-app-scheme" // Update this
>
```

## Usage

### Basic Payment Flow

```typescript
import { useStripePayment } from '../hooks/useStripePayment';
import StripePaymentModal from '../components/StripePaymentModal';

function POSScreen() {
  const {
    isPaymentModalVisible,
    showPaymentModal,
    hidePaymentModal,
    onPaymentComplete,
  } = useStripePayment();

  const handlePaymentComplete = async (paymentDetails: PaymentDetails[]) => {
    // Process the payment
    const order = await createOrder(paymentDetails);
    onPaymentComplete(paymentDetails);
  };

  return (
    <View>
      <Pressable onPress={() => showPaymentModal(total)}>
        <Text>Complete Sale</Text>
      </Pressable>

      <StripePaymentModal
        visible={isPaymentModalVisible}
        onClose={hidePaymentModal}
        onPaymentComplete={handlePaymentComplete}
        total={total}
        formatPrice={formatPrice}
      />
    </View>
  );
}
```

### Payment Methods

#### 1. Card Payments

The card payment uses Stripe's native `CardField` component:

```typescript
import { CardField, useStripe } from '@stripe/stripe-react-native';

function CardPayment() {
  const { confirmPayment } = useStripe();
  const [cardDetails, setCardDetails] = useState(null);

  const handlePayment = async () => {
    const paymentIntent = await stripeService.createPaymentIntent(amount);
    const { error, paymentIntent: confirmedIntent } = await confirmPayment(
      paymentIntent.client_secret,
      { paymentMethodType: 'Card' }
    );
  };

  return (
    <CardField
      postalCodeEnabled={false}
      placeholders={{ number: "4242 4242 4242 4242" }}
      cardStyle={{
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E0E0E0",
      }}
      style={styles.cardField}
      onCardChange={setCardDetails}
    />
  );
}
```

#### 2. Digital Wallet Payments

Digital wallet payments are handled through the Stripe service:

```typescript
const handleDigitalWalletPayment = async (walletType: 'apple_pay' | 'google_pay') => {
  const payment = await stripeService.processDigitalWalletPayment(walletType, amount);
  onPaymentComplete([payment]);
};
```

#### 3. Cash Payments

Cash payments are processed locally:

```typescript
const handleCashPayment = (amountPaid: number, total: number) => {
  const payment = stripeService.processCashPayment(amountPaid, total);
  onPaymentComplete([payment]);
};
```

## API Reference

### StripeService

#### Methods

- `createPaymentIntent(amount: number, currency?: string)`: Creates a Stripe payment intent
- `confirmPayment(clientSecret: string, paymentMethodId: string)`: Confirms a payment intent
- `processDigitalWalletPayment(walletType, amount)`: Processes digital wallet payments
- `processCashPayment(amountPaid, total)`: Processes cash payments
- `getStripePublishableKey()`: Returns the configured publishable key
- `isPaymentEnabled()`: Checks if payment processing is enabled
- `validatePaymentConfig()`: Validates payment configuration

#### Configuration

```typescript
interface PaymentConfig {
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  paymentMethods: PaymentMethod[];
  enabled: boolean;
}
```

### useStripePayment Hook

#### Return Values

- `isPaymentModalVisible`: Boolean indicating if payment modal is visible
- `showPaymentModal(total)`: Function to show payment modal
- `hidePaymentModal()`: Function to hide payment modal
- `onPaymentComplete(paymentDetails)`: Function to handle payment completion
- `lastPaymentDetails`: Array of last payment details
- `isProcessing`: Boolean indicating if payment is being processed

## Security Features

### Frontend Security
- **Native Card Input**: Card data never touches your server
- **Secure Transmission**: All communication with Stripe is encrypted
- **Token-based Authentication**: Uses Clerk authentication tokens
- **Input Validation**: Comprehensive validation on all inputs

### Backend Security
- **Payment Intent Creation**: Server-side payment intent creation
- **Secret Key Protection**: Secret keys only on server
- **HTTPS Encryption**: All API calls use HTTPS
- **User Isolation**: Payment configuration per user

## Testing

### Test Card Numbers

Use these Stripe test card numbers:

- **Visa**: 4242424242424242
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005
- **Discover**: 6011111111111117
- **Declined**: 4000000000000002

### Test Configuration

1. **Enable Payments**: Set `enabled: true` in payment config
2. **Add Test Keys**: Use Stripe test keys (`pk_test_...`, `sk_test_...`)
3. **Select Methods**: Enable desired payment methods
4. **Test Transactions**: Process test payments

## Error Handling

### Common Errors

1. **Payment Intent Creation Failed**
   ```typescript
   try {
     const paymentIntent = await stripeService.createPaymentIntent(amount);
   } catch (error) {
     console.error('Payment intent creation failed:', error);
   }
   ```

2. **Card Validation Errors**
   ```typescript
   if (!cardDetails?.complete) {
     showAlert('Invalid Card', 'Please enter complete card details.');
     return;
   }
   ```

3. **Payment Confirmation Errors**
   ```typescript
   const { error, paymentIntent } = await confirmPayment(clientSecret, options);
   if (error) {
     throw new Error(error.message);
   }
   ```

### Error Recovery

- **Network Errors**: Automatic retry with exponential backoff
- **Validation Errors**: User-friendly error messages
- **Configuration Errors**: Graceful fallback to cash payments
- **Authentication Errors**: Redirect to login

## Platform-Specific Features

### iOS Features
- **Apple Pay**: Native Apple Pay button and integration
- **Face ID/Touch ID**: Biometric authentication support
- **3D Secure**: Automatic 3D Secure handling

### Android Features
- **Google Pay**: Native Google Pay integration
- **Fingerprint Authentication**: Biometric authentication
- **Material Design**: Native Android UI components

### Web Features
- **Web Components**: Stripe Elements for web
- **Responsive Design**: Mobile-friendly payment interface
- **Cross-browser Support**: Works on all modern browsers

## Performance Optimization

### Best Practices

1. **Lazy Loading**: Load Stripe SDK only when needed
2. **Caching**: Cache payment configuration
3. **Debouncing**: Debounce card input validation
4. **Error Boundaries**: Wrap payment components in error boundaries

### Memory Management

- **Cleanup**: Properly dispose of Stripe instances
- **State Management**: Efficient state updates
- **Event Listeners**: Remove event listeners on unmount

## Troubleshooting

### Common Issues

1. **Stripe Provider Not Initialized**
   - Check if `StripeProvider` wraps your app
   - Verify publishable key is set
   - Check console for initialization errors

2. **Card Field Not Rendering**
   - Ensure `CardField` is within `StripeProvider`
   - Check for styling conflicts
   - Verify platform-specific requirements

3. **Payment Confirmation Fails**
   - Check network connectivity
   - Verify payment intent is valid
   - Check Stripe dashboard for errors

4. **Digital Wallet Not Available**
   - Check device compatibility
   - Verify merchant identifier
   - Check Stripe account settings

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log('Stripe config:', stripeService.getPaymentConfig());
console.log('Payment intent:', paymentIntent);
console.log('Card details:', cardDetails);
```

## Production Deployment

### 1. Update API Keys
Replace test keys with live keys:

```typescript
const paymentConfig = {
  stripePublishableKey: 'pk_live_your_live_key',
  stripeSecretKey: 'sk_live_your_live_key',
  // ... other config
};
```

### 2. SSL Certificate
Ensure HTTPS is enabled for secure payment processing.

### 3. App Store Configuration
- **iOS**: Configure Apple Pay capabilities in Xcode
- **Android**: Add Google Pay configuration to `android/app/src/main/AndroidManifest.xml`

### 4. Webhook Configuration
Set up Stripe webhooks for payment monitoring:

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

### 5. Monitoring
- Set up Stripe dashboard monitoring
- Configure error tracking (Sentry)
- Implement payment analytics

## Support

For technical support:

1. **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
2. **React Native SDK**: [github.com/stripe/stripe-react-native](https://github.com/stripe/stripe-react-native)
3. **Community Support**: [stripe.com/community](https://stripe.com/community)
4. **Error Logs**: Check Sentry for detailed error information

## Future Enhancements

- **Split Payments**: Multiple payment methods per transaction
- **Refunds**: Automated refund processing
- **Subscription Payments**: Recurring payment support
- **International Payments**: Enhanced multi-currency support
- **Offline Payments**: Offline payment processing
- **Analytics**: Payment method analytics and reporting 