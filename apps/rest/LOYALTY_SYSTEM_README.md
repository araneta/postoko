# Loyalty Points System Documentation

## Overview

The loyalty points system allows customers to earn points from purchases and redeem them for discounts. The system is fully configurable per store and includes transaction tracking.

## Database Schema

### Tables Added

1. **customer_loyalty_points** - Stores customer point balances
2. **loyalty_transactions** - Tracks all point transactions (earned, redeemed, etc.)
3. **loyalty_settings** - Store-specific loyalty program configuration

## API Endpoints

### Customer Loyalty Points

#### Get Customer Points Balance
```
GET /api/loyalty/customers/:customerId/points
```
Returns the current points balance for a customer. Creates a new record if none exists.

**Response:**
```json
{
  "id": 1,
  "customerId": "customer-uuid",
  "points": 150,
  "totalEarned": 500,
  "totalRedeemed": 350,
  "lastUpdated": "2024-01-19T10:30:00Z"
}
```

#### Get Customer Transaction History
```
GET /api/loyalty/customers/:customerId/transactions
```
Returns all loyalty transactions for a customer, ordered by date.

**Response:**
```json
[
  {
    "id": 1,
    "customerId": "customer-uuid",
    "orderId": "order-uuid",
    "type": "earned",
    "points": 50,
    "description": "Earned 50 points from purchase of $50.00",
    "transactionDate": "2024-01-19T10:30:00Z"
  },
  {
    "id": 2,
    "customerId": "customer-uuid",
    "orderId": null,
    "type": "redeemed",
    "points": -100,
    "description": "Redeemed 100 points for $1.00 discount",
    "transactionDate": "2024-01-19T11:00:00Z"
  }
]
```

### Point Operations

#### Earn Points from Purchase
```
POST /api/loyalty/earn
```
Awards points to a customer based on purchase amount.

**Request Body:**
```json
{
  "customerId": "customer-uuid",
  "orderId": "order-uuid",
  "amount": "50.00"
}
```

**Response:**
```json
{
  "loyaltyPoints": {
    "id": 1,
    "customerId": "customer-uuid",
    "points": 150,
    "totalEarned": 500,
    "totalRedeemed": 350,
    "lastUpdated": "2024-01-19T10:30:00Z"
  },
  "transaction": {
    "id": 1,
    "customerId": "customer-uuid",
    "orderId": "order-uuid",
    "type": "earned",
    "points": 50,
    "description": "Earned 50 points from purchase of $50.00",
    "transactionDate": "2024-01-19T10:30:00Z"
  }
}
```

#### Redeem Points for Discount
```
POST /api/loyalty/redeem
```
Redeems points for a discount amount.

**Request Body:**
```json
{
  "customerId": "customer-uuid",
  "pointsToRedeem": 100,
  "orderId": "order-uuid" // optional
}
```

**Response:**
```json
{
  "loyaltyPoints": {
    "id": 1,
    "customerId": "customer-uuid",
    "points": 50,
    "totalEarned": 500,
    "totalRedeemed": 450,
    "lastUpdated": "2024-01-19T11:00:00Z"
  },
  "transaction": {
    "id": 2,
    "customerId": "customer-uuid",
    "orderId": "order-uuid",
    "type": "redeemed",
    "points": -100,
    "description": "Redeemed 100 points for $1.00 discount",
    "transactionDate": "2024-01-19T11:00:00Z"
  },
  "discountAmount": 1.00
}
```

### Store Settings

#### Get Loyalty Settings
```
GET /api/loyalty/settings
```
Returns the current loyalty program settings for the store. Creates default settings if none exist.

**Response:**
```json
{
  "id": 1,
  "storeInfoId": 1,
  "pointsPerDollar": "1.00",
  "redemptionRate": "0.01",
  "minimumRedemption": 100,
  "pointsExpiryMonths": 12,
  "enabled": true
}
```

#### Update Loyalty Settings
```
PUT /api/loyalty/settings
```
Updates the loyalty program settings.

**Request Body:**
```json
{
  "pointsPerDollar": "2.00",
  "redemptionRate": "0.02",
  "minimumRedemption": 50,
  "pointsExpiryMonths": 6,
  "enabled": true
}
```

## Configuration Options

### Loyalty Settings

- **pointsPerDollar**: Number of points earned per dollar spent (default: 1.00)
- **redemptionRate**: Dollar value per point when redeeming (default: $0.01)
- **minimumRedemption**: Minimum points required for redemption (default: 100)
- **pointsExpiryMonths**: Months before points expire (default: 12, null = no expiry)
- **enabled**: Whether the loyalty system is active (default: true)

## Integration Examples

### Frontend Integration

```javascript
// Get customer points
const getCustomerPoints = async (customerId) => {
  const response = await fetch(`/api/loyalty/customers/${customerId}/points`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Earn points from purchase
const earnPoints = async (customerId, orderId, amount) => {
  const response = await fetch('/api/loyalty/earn', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ customerId, orderId, amount })
  });
  return response.json();
};

// Redeem points
const redeemPoints = async (customerId, pointsToRedeem, orderId) => {
  const response = await fetch('/api/loyalty/redeem', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ customerId, pointsToRedeem, orderId })
  });
  return response.json();
};
```

### POS Integration

```javascript
// After completing a sale
const completeSale = async (customerId, orderId, totalAmount) => {
  // 1. Create the order
  const order = await createOrder(orderId, totalAmount);
  
  // 2. Award loyalty points
  if (customerId) {
    const loyaltyResult = await earnPoints(customerId, orderId, totalAmount);
    console.log(`Customer earned ${loyaltyResult.transaction.points} points`);
  }
  
  return order;
};

// Before completing a sale (if customer wants to use points)
const applyLoyaltyDiscount = async (customerId, pointsToRedeem, orderId) => {
  const redemption = await redeemPoints(customerId, pointsToRedeem, orderId);
  return redemption.discountAmount;
};
```

## Error Handling

The API returns appropriate HTTP status codes:

- **400**: Bad Request (missing fields, insufficient points, etc.)
- **401**: Unauthorized (missing or invalid auth token)
- **404**: Not Found (customer, store, or settings not found)
- **500**: Internal Server Error

Error responses include a message field:
```json
{
  "message": "Insufficient points for redemption"
}
```

## Security Features

- All endpoints require authentication via Clerk
- Store ownership verification for all operations
- Customer data isolation per store
- Transaction logging for audit trails

## Performance Considerations

- Database indexes on frequently queried columns
- Efficient point calculations
- Minimal database queries per operation
- Transaction history pagination support (can be added)

## Future Enhancements

Potential features that could be added:

1. **Point Expiration**: Automatic point expiration based on settings
2. **Tier System**: Different earning rates based on customer tier
3. **Promotional Points**: Bonus points for specific products/categories
4. **Point Transfer**: Allow customers to transfer points
5. **Analytics**: Detailed reporting on loyalty program performance
6. **Email Notifications**: Notify customers of point changes
7. **Bulk Operations**: Process multiple customers at once

## Migration

To set up the loyalty system in your database, run the generated migration:

```sql
-- Run the migration file: drizzle/0001_loose_newton_destine.sql
```

The migration creates all necessary tables and indexes for optimal performance. 