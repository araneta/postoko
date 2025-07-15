# Low Stock Alerts Feature

## Overview

The Low Stock Alerts feature helps prevent lost sales from stockouts by automatically monitoring inventory levels and sending notifications when products fall below their configured thresholds.

## Features

### 1. Automatic Stock Monitoring
- Monitors product stock levels in real-time
- Configurable low stock thresholds per product
- Default threshold of 10 units if not specified

### 2. Push Notifications
- Instant push notifications when stock drops below threshold
- High-priority notifications with sound and vibration
- Works on both iOS and Android devices

### 3. Visual Indicators
- Low stock products are highlighted with orange borders
- Warning icons and "Low Stock" labels on product cards
- Stock levels shown in orange when below threshold

### 4. Alert Management
- Dedicated Alerts tab with badge showing unread count
- Mark individual alerts as read
- Mark all alerts as read functionality
- Alert history with timestamps

### 5. Smart Alert Prevention
- Prevents duplicate alerts for the same product
- Only creates new alerts when stock drops below threshold
- Clears old alerts after 30 days

## How It Works

### 1. Setting Low Stock Thresholds
When adding or editing products, you can set a "Low Stock Threshold" field:
- Leave empty to use default threshold (10 units)
- Set custom threshold based on your business needs
- Threshold is specific to each product

### 2. Automatic Monitoring
The system automatically checks for low stock in these scenarios:
- When the app starts
- When products are added to cart
- After order completion
- When manually refreshing alerts

### 3. Notification System
- Uses Expo Notifications for cross-platform support
- Configures Android notification channels
- Requests notification permissions on first use
- Sends immediate notifications for low stock alerts

### 4. Alert Management
- View all alerts in the dedicated Alerts tab
- Unread alerts are highlighted with orange borders
- Tap alerts to mark them as read
- Use "Mark All Read" to clear all alerts

## Technical Implementation

### Dependencies
```json
{
  "expo-notifications": "~0.20.1",
  "expo-device": "~5.4.0"
}
```

### Key Components

1. **Notification Service** (`lib/notifications.ts`)
   - Handles push notification setup and sending
   - Manages notification permissions
   - Configures notification channels

2. **Stock Alert Service** (`lib/stockAlerts.ts`)
   - Manages stock alert logic
   - Prevents duplicate alerts
   - Handles alert lifecycle

3. **Store Integration** (`store/useStore.ts`)
   - Integrates alerts with Zustand store
   - Updates stock levels after orders
   - Triggers alert checks

4. **UI Components**
   - ProductCard: Shows low stock indicators
   - AlertsScreen: Manages alert display
   - Tab layout: Shows alert badge

### Data Flow

1. **Product Update**: When stock changes (after order completion)
2. **Alert Check**: System checks if stock is below threshold
3. **Alert Creation**: Creates new alert if conditions met
4. **Notification**: Sends push notification immediately
5. **UI Update**: Updates product cards and alert list

## Configuration

### Notification Permissions
The app will request notification permissions on first launch. Users can:
- Allow notifications for full functionality
- Deny notifications (alerts will still work in-app)

### Default Settings
- Default low stock threshold: 10 units
- Alert retention: 30 days
- Notification priority: High
- Sound and vibration: Enabled

## Usage Examples

### Setting Up Low Stock Monitoring

1. **Add a new product**:
   - Go to Products tab
   - Tap "Add Product"
   - Set "Low Stock Threshold" to your desired level
   - Save the product

2. **Edit existing product**:
   - Tap on a product in the Products list
   - Add or modify the "Low Stock Threshold"
   - Save changes

### Managing Alerts

1. **View Alerts**:
   - Tap the Alerts tab
   - See all low stock alerts with timestamps
   - Unread alerts have orange indicators

2. **Mark Alerts as Read**:
   - Tap on an unread alert
   - Alert will be marked as read
   - Badge count will update

3. **Mark All as Read**:
   - Tap "Mark All Read" button
   - All alerts will be marked as read
   - Badge will disappear

### Testing the Feature

1. **Create test scenario**:
   - Add a product with low stock threshold
   - Set current stock above threshold
   - Complete an order that reduces stock below threshold

2. **Verify notifications**:
   - Check for push notification
   - Verify alert appears in Alerts tab
   - Confirm product card shows low stock indicator

## Best Practices

### Threshold Setting
- Set thresholds based on your restocking lead time
- Consider product popularity and sales velocity
- Account for seasonal variations

### Alert Management
- Regularly review and clear old alerts
- Use the "Mark All Read" feature to keep alerts organized
- Monitor the Alerts tab for new low stock situations

### Notification Settings
- Ensure notifications are enabled for critical alerts
- Test notifications on both iOS and Android
- Consider notification timing for your business hours

## Troubleshooting

### Notifications Not Working
1. Check notification permissions in device settings
2. Verify Expo project ID is configured
3. Test on physical device (not simulator)

### Alerts Not Appearing
1. Check if stock is actually below threshold
2. Verify low stock threshold is set on product
3. Try refreshing the Alerts tab

### Duplicate Alerts
- System prevents duplicates automatically
- Old alerts are cleared after 30 days
- Only unread alerts are considered for duplicates

## Future Enhancements

### Planned Features
- Email notifications for low stock alerts
- Customizable notification schedules
- Integration with supplier ordering systems
- Advanced analytics for stock trends

### Potential Improvements
- Bulk threshold setting for product categories
- Predictive stock alerts based on sales history
- Integration with inventory management systems
- Multi-location stock monitoring 