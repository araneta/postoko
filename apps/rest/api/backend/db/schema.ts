
import { integer, pgEnum, pgTable, varchar, numeric, text, primaryKey, foreignKey, unique, boolean, timestamp } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { time } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  lastLogin: timestamp({ withTimezone: true }),
  lastIp: varchar({ length: 50 }),
});

export const categoriesTable = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
},(table)=>({
   storeIndex: index("categories_store_idx").on(table.storeInfoId),
}));

export const productsTable = pgTable("products", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  cost: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // Cost for profit margin tracking
  description: text(),
  image: text(),
  stock: integer().notNull(),
  minStock: integer().default(10), // Minimum stock threshold for notifications
  categoryId: integer().notNull().references(() => categoriesTable.id),
  supplierId: varchar({ length: 36 }).references(() => suppliersTable.id),
  barcode: varchar({ length: 255 }),
  taxRateId: integer().references(() => taxRatesTable.id),
  isTaxable: boolean().notNull().default(true),

},(table) => ({
  storeIndex: index("products_store_idx").on(table.storeInfoId),  
}));
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'completed',
  'refunded',
  'cancelled'
]);
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_amount',
  'buy_x_get_y',
  'time_based'
]);
export const ordersTable = pgTable("orders", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  /**total = subtotal
        - discountAmount
        + taxAmount
        + serviceCharge
Never recompute this on the fly.
Always freeze it at checkout. */
  total: numeric({ precision: 10, scale: 2 }).notNull(),
  totalCost: numeric({ precision: 10, scale: 2 }).default('0.00'), //profit = total - totalCost

  
  orderNumber: varchar({ length: 50 }).notNull().default('0.00'),
  subtotal: numeric({ precision: 10, scale: 2 }).notNull(),         // sum of items before discount
  discountType: discountTypeEnum(), 
  discountValue: numeric({ precision: 10, scale: 2 }).default('0.00'),     // 10 (means 10%) or 20000 (fixed)  
  taxAmount: numeric({ precision: 10, scale: 2 }).default('0.00'),
  serviceCharge: numeric({ precision: 10, scale: 2 }).default('0.00'),
  promotionId: varchar({ length: 36 }).references(() => promotionsTable.id),
  
  discountAmount: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // Total discount applied
  //date: varchar({ length: 50 }).notNull(),
  paymentMethod: varchar({ length: 50 }).notNull(),
  status: orderStatusEnum().notNull(),
  customerId: varchar({ length: 36 }).references(() => customersTable.id),

  employeeId: varchar({ length: 36 }).references(() => employeesTable.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

},(table) => ({
  storeIndex: index("orders_store_idx").on(table.storeInfoId),
  dateIndex: index("orders_created_idx").on(table.createdAt),
  uniqueOrderNo: unique().on(table.storeInfoId, table.orderNumber),
}));

export const orderItemsTable = pgTable("order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  productId: varchar({ length: 36 }).notNull().references(() => productsTable.id),
  productName: varchar({ length: 255 }).notNull(),

  quantity: integer().notNull(),
  unitPrice: numeric({ precision: 10, scale: 2 }).notNull(), // <-- NEW
  unitCost: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // <-- Optional, for historical cost

  subtotal: numeric({ precision: 10, scale: 2 }).notNull(),         // // qty × price, sum of items before discount
  //discountType: varchar({ length: 50 }),//'PERCENT' | 'FIXED' | null
  discountType: discountTypeEnum(),
  discountValue: numeric({ precision: 10, scale: 2 }).default('0.00'),    
  discountAmount: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'),  // total discount for this line

  promotionId: varchar({ length: 36 }).references(() => promotionsTable.id),

  finalPrice: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // subtotal - discountAmount
  taxRate: numeric({ precision: 5, scale: 2 }), // freeze %
  taxAmount: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'),

},(table) => ({
  orderIndex: index("order_items_order_idx").on(table.orderId),
  uniqueProductPerOrder: unique().on(table.orderId, table.productId),
  productIndex: index("order_items_product_idx").on(table.productId),

}));

export const currenciesTable = pgTable("currencies", {
  code: varchar({ length: 10 }).primaryKey(),
  symbol: varchar({ length: 10 }).notNull(),
  name: varchar({ length: 50 }).notNull(),
});

export const storeInfoTable = pgTable("store_info", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull().references(() => usersTable.id).unique(),
  name: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  website: varchar({ length: 255 }).notNull(),
  taxId: varchar({ length: 50 }).notNull(),
  timezone: varchar({ length: 50 }),
});

export const printerSettingsTable = pgTable("printer_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: varchar({ length: 20 }).notNull(), // 'none'
});

export const paymentSettingsTable = pgTable("payment_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id).unique(),
  stripePublishableKey: varchar({ length: 255 }),
  stripeSecretKey: varchar({ length: 255 }),
  paypalClientId: varchar({ length: 255 }),
  paypalClientSecret: varchar({ length: 255 }),
  paypalMode: varchar({ length: 20 }).notNull().default("sandbox"), // default to sandbox

  paymentMethods: text().notNull(), // JSON array of payment methods
  enabled: boolean().notNull().default(true),
}, (table)=>({
  storeIndex: index("payment_settings_store_idx").on(table.storeInfoId),

}));

export const settingsTable = pgTable("settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  currencyCode: varchar({ length: 10 }).notNull().references(() => currenciesTable.code),
  printerSettingsId: integer().notNull().references(() => printerSettingsTable.id),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id).unique(),
});

export const customersTable = pgTable("customers", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }),
  address: varchar({ length: 255 }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }), // Soft delete field
},
  (table) => ({
    uniqueEmailPerStore: unique().on(table.storeInfoId, table.email),
    storeIndex: index("customer_store_idx").on(table.storeInfoId),  
  }));
/*
export const customerPurchasesTable = pgTable("customer_purchases", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: varchar({ length: 36 }).notNull().references(() => customersTable.id),
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  purchaseDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
});*/

export const customerLoyaltyPointsTable = pgTable("customer_loyalty_points", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: varchar({ length: 36 }).notNull().references(() => customersTable.id).unique(),
  points: integer().notNull().default(0),
  totalEarned: integer().notNull().default(0),
  totalRedeemed: integer().notNull().default(0),
  lastUpdated: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const loyaltyTransactionsTable = pgTable("loyalty_transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: varchar({ length: 36 }).notNull().references(() => customersTable.id),
  orderId: varchar({ length: 36 }).references(() => ordersTable.id),
  type: varchar({ length: 20 }).notNull(), // 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points: integer().notNull(),
  description: text(),
  transactionDate: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table)=>({
  customerIndex: index("loyalty_tx_customer_idx").on(table.customerId),

}));

export const loyaltySettingsTable = pgTable("loyalty_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id).unique(),
  pointsPerDollar: numeric({ precision: 5, scale: 2 }).notNull().default('1.00'),
  redemptionRate: numeric({ precision: 5, scale: 2 }).notNull().default('0.01'), // $0.01 per point
  minimumRedemption: integer().notNull().default(100), // Minimum points needed for redemption
  pointsExpiryMonths: integer().default(12), // Points expire after X months
  enabled: boolean().notNull().default(true),
},(table)=>({
  storeIndex: index("loyalty_settings_store_idx").on(table.storeInfoId),

}));

export const rolesTable = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull().unique(),
  description: text(),
});

export const employeesTable = pgTable("employees", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(), // hashed password
  roleId: integer().notNull().references(() => rolesTable.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }), // Soft delete
},
  (table) => ({
    uniqueEmailPerStore: unique().on(table.storeInfoId, table.email),
    storeIndex: index("employees_store_idx").on(table.storeInfoId),

  }));


export const suppliersTable = pgTable("suppliers", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),  
  email: varchar({ length: 255 }),
  phone: varchar({ length: 20 }),
  address: text(),
  notes: text(),
  website: varchar({ length: 255 }),
  taxId: varchar({ length: 50 }),
  paymentTerms: text(),
  creditLimit: numeric({ precision: 10, scale: 2 }).default('0.00'),
  currency: varchar({ length: 10 }).references(() => currenciesTable.code),
  rating: integer(), // Supplier rating from 1 to 5
  totalOrders: integer().notNull().default(0),
  totalSpent: numeric({ precision: 15, scale: 2 }).notNull().default('0.00'),
  averageDeliveryDays: integer(),
  isActive: boolean().notNull().default(true),
  

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }), // Soft delete field
},(table)=>({
  storeIndex: index("suppliers_store_idx").on(table.storeInfoId),

}));
export const bogoDiscountTypeEnum = pgEnum('bogo_discount_type', [
  'free',
  'percentage',
  'fixed_amount'
]);

export const timeBasedDiscountTypeEnum = pgEnum('time_based_discount_type', [
  'daily',
  'weekly',
  'specific_dates'
]);

export const promotionsTable = pgTable("promotions", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  //type: varchar({ length: 20 }).notNull(), // 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'time_based'
  type: discountTypeEnum().notNull(),
  discountValue: numeric({ precision: 10, scale: 2 }).notNull(), // Percentage (0-100) or fixed amount
  minimumPurchase: numeric({ precision: 10, scale: 2 }).default('0.00'), // Minimum order amount
  maximumDiscount: numeric({ precision: 10, scale: 2 }), // Maximum discount cap for percentage discounts
  startDate: timestamp({ withTimezone: true }).notNull(),
  endDate: timestamp({ withTimezone: true }).notNull(),
  usageLimit: integer(), // Total usage limit (null = unlimited)
  usageCount: integer().notNull().default(0), // Current usage count
  customerUsageLimit: integer().default(1), // Per-customer usage limit
  isActive: boolean().notNull().default(true),
  applicableToCategories: text(), // JSON array of category IDs
  applicableToProducts: text(), // JSON array of product IDs
  
  // BOGO specific fields
  buyQuantity: integer(), // Buy X items
  getQuantity: integer(), // Get Y items (free or discounted)
  getDiscountType: bogoDiscountTypeEnum(), // 'free' | 'percentage' | 'fixed_amount'
  getDiscountValue: numeric({ precision: 10, scale: 2 }), // Discount for the "get" items
  
  // Time-based promotion fields
  timeBasedType: timeBasedDiscountTypeEnum(), // 'daily' | 'weekly' | 'specific_dates'
  activeDays: text(), // JSON array of days (0=Sunday, 1=Monday, etc.) for weekly
  activeTimeStart: varchar({ length: 8 }), // HH:MM:SS format
  activeTimeEnd: varchar({ length: 8 }), // HH:MM:SS format
  //activeTimeStart: time(),
  //activeTimeEnd: time(),

  specificDates: text(), // JSON array of specific dates for 'specific_dates' type
  
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }), // Soft delete
},(table) => ({
  storeIndex: index("promotions_store_idx").on(table.storeInfoId),  
}));

export const promotionUsageTable = pgTable("promotion_usage", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promotionId: varchar({ length: 36 }).notNull().references(() => promotionsTable.id),
  customerId: varchar({ length: 36 }).references(() => customersTable.id),
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  discountAmount: numeric({ precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table)=>({
  promotionIndex: index("promotion_usage_promo_idx").on(table.promotionId),
  customerIndex: index("promotion_usage_customer_idx").on(table.customerId),
  orderIndex: index("promotion_usage_order_idx").on(table.orderId),

}));

export const discountCodesTable = pgTable("discount_codes", {
  id: varchar({ length: 36 }).primaryKey(),
  promotionId: varchar({ length: 36 }).notNull().references(() => promotionsTable.id),
  code: varchar({ length: 50 }).notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
},(table) => ({
  uniqueCodePerPromotion: unique().on(table.promotionId, table.code),
}));

export const taxRatesTable = pgTable("tax_rates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 100 }).notNull(), // VAT, GST, Service Tax
  rate: numeric({ precision: 5, scale: 2 }).notNull(), // 10.00 = 10%
  isDefault: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  storeIndex: index("tax_rates_store_idx").on(table.storeInfoId),
}));

export const inventoryMovementsTable = pgTable("inventory_movements", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: varchar({ length: 36 }).notNull().references(() => productsTable.id),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),

  type: varchar({ length: 20 }).notNull(), 
  // 'sale' | 'purchase' | 'adjustment' | 'return'

  quantity: integer().notNull(), // negative for sale, positive for purchase

  referenceId: varchar({ length: 36 }), // orderId or supplier purchaseId

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIndex: index("inventory_product_idx").on(table.productId),
  storeIndex: index("inventory_store_idx").on(table.storeInfoId),
}));
