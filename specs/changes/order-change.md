# Orders Controller - Schema Update Summary

## Key Changes Made to Match New POS Schema

### 1. **Date Field Migration**
- **Old:** `ordersTable.date` (varchar)
- **New:** `ordersTable.createdAt` (timestamp)
- **Updated Methods:**
  - `getOrders()` - Line 42
  - `getBestSellers()` - Line 429
  - `getPeakHours()` - Line 478
  - `getProfitMargin()` - Line 551

### 2. **New Order Fields Added to Schema**
The following fields are now supported in order creation:
- `orderNumber` - Unique identifier per store (auto-generated as `ORD-${Date.now()}`)
- `totalCost` - Calculated or provided cost of items sold
- `discountType` - Enum: 'percentage', 'fixed_amount', 'buy_x_get_y', 'time_based'
- `discountValue` - The discount percentage or fixed amount value
- `taxAmount` - Tax applied to order
- `serviceCharge` - Service charge applied to order
- All these are properly handled in `createOrder()` method

### 3. **Order Items Schema Updates**
Enhanced `orderItemsTable` fields now utilized:
- `unitPrice` - Price per unit (frozen at checkout)
- `unitCost` - Cost per unit (for profit tracking)
- `finalPrice` - Subtotal minus discount amount
- `discountType` - Item-level discount type
- `discountValue` - Item-level discount value
- `discountAmount` - Total discount applied to item

### 4. **Removed Unused Import**
- Removed `customerPurchasesTable` (commented out in schema)

### 5. **Enhanced getOrders() Method**
- Now returns complete order item details including:
  - `orderItemId` for tracking
  - `unitPrice` and `unitCost` for calculations
  - `discountType`, `discountValue`, `discountAmount`
  - `finalPrice` (actual amount after discount)
  - `productName` (stored for order history accuracy)

### 6. **Improved createOrder() Method**
- **Stock Validation:** Enhanced to check product availability
- **Order Number Generation:** Auto-generates unique order numbers
- **Cost Calculation:** Automatically calculates totalCost from product costs if not provided
- **Flexible Discounts:** Supports multiple discount types and values
- **Promotion Integration:** Validates promotion codes with:
  - Date range checking
  - Minimum purchase requirements
  - Usage limits (global and per-customer)
  - Automatic promotion usage tracking
- **Comprehensive Item Insertion:** Each order item now includes unit costs for profit calculations

### 7. **New Helper Methods**
Three new methods added for complete order management:

#### `getOrderById(orderId)`
- Retrieves specific order with all items
- Validates store ownership

#### `updateOrderStatus(orderId, status)`
- Updates order status safely
- Validates status enum values
- Supports: 'pending', 'completed', 'refunded', 'cancelled'

#### `deleteOrder(orderId)`
- Soft delete support with stock restoration
- Restores inventory when order is deleted
- Cleans up order items

### 8. **Profit Margin Calculation Fix**
- **Old:** Used `ordersTable.date` (non-existent field)
- **New:** Uses `ordersTable.createdAt` (timestamp)
- **Calculation:** Now accurately uses `finalPrice` and `unitCost` from order items
- Formula: `(totalRevenue - totalCost) / totalRevenue * 100`

### 9. **Best Sellers Query Optimization**
- **Old:** Referenced `ordersTable.date` and `productsTable.price`
- **New:** Uses `ordersTable.createdAt` and `orderItemsTable.finalPrice`
- Better accuracy: Uses actual final prices after discounts

### 10. **Peak Hours Analysis**
- Updated to use `createdAt` instead of `date`
- Uses drizzle-orm's `gte()` helper instead of raw SQL comparisons
- Properly typed timestamp extraction

## Data Type Handling

### Numeric Fields
All numeric fields are properly converted to appropriate types:
```typescript
parseFloat(total.toString())      // For numeric(10,2) fields
parseFloat(item.unitPrice.toString()) // For price fields
```

### Discount Calculations
Supports flexible discount application:
- Percentage-based: discountValue represents percentage (0-100)
- Fixed amount: discountValue represents currency amount
- Order-level and item-level discounts both tracked

### Stock Management
- Validates availability before order creation
- Automatically updates stock upon order creation
- Restores stock if order is deleted

## Required Request Body Updates

### createOrder() endpoint
```json
{
  "items": [
    {
      "productId": "uuid",
      "productName": "Product Name",
      "quantity": 2,
      "unitPrice": 49.99,
      "unitCost": 20.00,
      "subtotal": 99.98,
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 9.99,
      "finalPrice": 89.99
    }
  ],
  "total": 89.99,
  "subtotal": 99.98,
  "totalCost": 40.00,
  "discountAmount": 9.99,
  "discountType": "percentage",
  "discountValue": 10,
  "taxAmount": 0,
  "serviceCharge": 0,
  "paymentMethod": "cash|card|digital",
  "status": "pending|completed|refunded|cancelled",
  "customer": {
    "id": "uuid"
  },
  "employee": {
    "id": "uuid"
  },
  "discountCode": "CODE123" // optional
}
```

## Benefits of These Changes

1. **Audit Trail:** Frozen prices and costs at checkout time
2. **Accurate Reporting:** Profit calculations based on actual line-item costs
3. **Multi-type Discounts:** Support for percentage, fixed, BOGO, and time-based promotions
4. **Flexible Charges:** Can apply tax and service charges separately
5. **Promotion Tracking:** Automatic usage count and limits enforcement
6. **Inventory Control:** Real-time stock management with order reconciliation
7. **Timestamp Accuracy:** Using proper timestamp fields for analytics
8. **Complete Order History:** All pricing information preserved in order items

## Migration Notes

If migrating from old schema:
1. Rename all `date` references to `createdAt`
2. Ensure order items have `unitCost` populated
3. Recalculate `finalPrice` for existing items: `finalPrice = subtotal - discountAmount`
4. Generate `orderNumber` for existing orders if missing
5. Update any API clients to use new request body format
