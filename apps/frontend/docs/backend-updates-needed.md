# Backend Updates for Enhanced Supplier Tracking

## Database Schema Updates

### 1. Update Suppliers Table

Add these columns to your existing `suppliers` table:

```sql
-- Add new columns to suppliers table
ALTER TABLE suppliers 
ADD COLUMN website VARCHAR(500),
ADD COLUMN tax_id VARCHAR(100),
ADD COLUMN payment_terms VARCHAR(100),
ADD COLUMN credit_limit DECIMAL(10,2),
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN notes TEXT,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### 2. Create Supplier Orders Table (Optional - for advanced tracking)

```sql
CREATE TABLE supplier_orders (
    id VARCHAR(255) PRIMARY KEY,
    supplier_id VARCHAR(255) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE TABLE supplier_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES supplier_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## API Endpoint Updates

### 1. Update Existing Supplier Endpoints

Your current endpoints will automatically work with the new fields, but you may want to add validation:

```javascript
// POST /api/suppliers
// PUT /api/suppliers/:id
// Validation example (Express.js with Joi or similar)
const supplierSchema = {
  name: Joi.string().required(), // Company name
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  website: Joi.string().uri().optional(),
  taxId: Joi.string().optional(),
  paymentTerms: Joi.string().optional(),
  creditLimit: Joi.number().positive().optional(),
  currency: Joi.string().length(3).default('USD'),
  rating: Joi.number().integer().min(1).max(5).optional(),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
  notes: Joi.string().optional()
};
```

### 2. Add New Supplier Analytics Endpoints (Optional)

```javascript
// GET /api/suppliers/:id/analytics
app.get('/api/suppliers/:id/analytics', async (req, res) => {
  const { id } = req.params;
  
  // Get supplier products and calculate metrics
  const products = await db.query('SELECT * FROM products WHERE supplier_id = ?', [id]);
  const orders = await db.query('SELECT * FROM supplier_orders WHERE supplier_id = ?', [id]);
  
  const analytics = {
    totalProducts: products.length,
    totalInventoryValue: products.reduce((sum, p) => sum + (p.cost * p.stock), 0),
    totalOrders: orders.length,
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length : 0,
    lowStockProducts: products.filter(p => p.min_stock && p.stock <= p.min_stock),
    outOfStockProducts: products.filter(p => p.stock === 0)
  };
  
  res.json(analytics);
});

// GET /api/suppliers/:id/orders
app.get('/api/suppliers/:id/orders', async (req, res) => {
  const { id } = req.params;
  const orders = await db.query(`
    SELECT so.*, 
           JSON_ARRAYAGG(
             JSON_OBJECT(
               'productId', soi.product_id,
               'productName', soi.product_name,
               'quantity', soi.quantity,
               'unitCost', soi.unit_cost,
               'totalCost', soi.total_cost
             )
           ) as items
    FROM supplier_orders so
    LEFT JOIN supplier_order_items soi ON so.id = soi.order_id
    WHERE so.supplier_id = ?
    GROUP BY so.id
    ORDER BY so.order_date DESC
  `, [id]);
  
  res.json(orders);
});
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
1. **Phase 1**: Add new columns with default values
2. **Phase 2**: Update your API to handle new fields
3. **Phase 3**: Add supplier orders functionality (optional)

### Option 2: All at Once
1. Run the database migration
2. Update API validation
3. Deploy and test

## Sample Migration Script

```javascript
// migration-001-enhance-suppliers.js
exports.up = async function(knex) {
  // Add new columns to suppliers table
  await knex.schema.alterTable('suppliers', function(table) {
    table.string('website', 500);
    table.string('tax_id', 100);
    table.string('payment_terms', 100);
    table.decimal('credit_limit', 10, 2);
    table.string('currency', 10).defaultTo('USD');
    table.integer('rating').checkBetween([1, 5]);
    table.enum('status', ['active', 'inactive', 'pending']).defaultTo('active');
    table.text('notes');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
  
  // Create supplier_orders table (optional)
  await knex.schema.createTable('supplier_orders', function(table) {
    table.string('id').primary();
    table.string('supplier_id').notNullable();
    table.date('order_date').notNullable();
    table.date('expected_delivery');
    table.date('actual_delivery');
    table.enum('status', ['pending', 'shipped', 'delivered', 'cancelled']).defaultTo('pending');
    table.decimal('total_amount', 10, 2).notNullable();
    table.text('notes');
    table.timestamps(true, true);
    
    table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('CASCADE');
  });
  
  await knex.schema.createTable('supplier_order_items', function(table) {
    table.increments('id').primary();
    table.string('order_id').notNullable();
    table.string('product_id').notNullable();
    table.string('product_name').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unit_cost', 10, 2).notNullable();
    table.decimal('total_cost', 10, 2).notNullable();
    
    table.foreign('order_id').references('id').inTable('supplier_orders').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('supplier_order_items');
  await knex.schema.dropTableIfExists('supplier_orders');
  
  await knex.schema.alterTable('suppliers', function(table) {
    table.dropColumn('website');
    table.dropColumn('tax_id');
    table.dropColumn('payment_terms');
    table.dropColumn('credit_limit');
    table.dropColumn('currency');
    table.dropColumn('rating');
    table.dropColumn('status');
    table.dropColumn('notes');
    table.dropColumn('updated_at');
  });
};
```

## Testing the Updates

### 1. Test with Existing Data
Your current suppliers should continue to work with null values for new fields.

### 2. Test New Supplier Creation
```javascript
// Test creating a supplier with new fields
const newSupplier = {
  name: "Acme Corp", // Company name
  email: "sales@acme.com", // Company email or main contact email
  phone: "555-0123",
  website: "https://acme.com",
  paymentTerms: "Net 30",
  creditLimit: 50000,
  rating: 4,
  status: "active",
  notes: "Reliable supplier for office supplies"
};
```

### 3. Test Analytics Endpoints
```javascript
// Test supplier analytics
fetch('/api/suppliers/supplier-123/analytics')
  .then(res => res.json())
  .then(data => console.log('Analytics:', data));
```

## Backward Compatibility

The frontend is designed to be backward compatible:
- New fields are optional
- Default values are provided
- Existing functionality continues to work
- Enhanced features gracefully degrade if backend doesn't support them

## Priority Order

1. **High Priority**: Add new columns to suppliers table
2. **Medium Priority**: Update API validation and responses
3. **Low Priority**: Add supplier orders tracking (advanced feature)

Your enhanced supplier tracking will work immediately with just the database schema updates!