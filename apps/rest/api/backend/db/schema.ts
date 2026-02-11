import { integer, pgTable, varchar, numeric, text, primaryKey, foreignKey, unique, boolean, timestamp } from "drizzle-orm/pg-core";
export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  lastLogin: timestamp(),
  lastIp: varchar({ length: 50 }),
});

export const categoriesTable = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
});

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
});

export const ordersTable = pgTable("orders", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  total: numeric({ precision: 10, scale: 2 }).notNull(),
  subtotal: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // Subtotal before discounts
  discountAmount: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // Total discount applied
  date: varchar({ length: 50 }).notNull(),
  paymentMethod: varchar({ length: 50 }).notNull(),
  status: varchar({ length: 20 }).notNull(), // 'completed' | 'refunded'
  employeeId: varchar({ length: 36 }).references(() => employeesTable.id),
});

export const orderItemsTable = pgTable("order_items", {
  //id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  productId: varchar({ length: 36 }).notNull().references(() => productsTable.id),
  quantity: integer().notNull(),
  unitPrice: numeric({ precision: 10, scale: 2 }).notNull(), // <-- NEW
  unitCost: numeric({ precision: 10, scale: 2 }).notNull().default('0.00'), // <-- Optional, for historical cost
  // Composite primary key
}, (table) => ({
  pk: primaryKey({ columns: [table.orderId, table.productId] })
}));

export const currenciesTable = pgTable("currencies", {
  code: varchar({ length: 10 }).primaryKey(),
  symbol: varchar({ length: 10 }).notNull(),
  name: varchar({ length: 50 }).notNull(),
});

export const storeInfoTable = pgTable("store_info", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull().references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  website: varchar({ length: 255 }).notNull(),
  taxId: varchar({ length: 50 }).notNull(),
});

export const printerSettingsTable = pgTable("printer_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: varchar({ length: 20 }).notNull(), // 'none'
});

export const paymentSettingsTable = pgTable("payment_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  stripePublishableKey: varchar({ length: 255 }),
  stripeSecretKey: varchar({ length: 255 }),
  paypalClientId: varchar({ length: 255 }),
  paypalClientSecret: varchar({ length: 255 }),
  paypalMode: varchar({ length: 20 }).notNull().default("sandbox"), // default to sandbox

  paymentMethods: text().notNull(), // JSON array of payment methods
  enabled: boolean().notNull().default(true),
});

export const settingsTable = pgTable("settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  currencyCode: varchar({ length: 10 }).notNull().references(() => currenciesTable.code),
  printerSettingsId: integer().notNull().references(() => printerSettingsTable.id),
  storeInfoId: integer().references(() => storeInfoTable.id),
});

export const customersTable = pgTable("customers", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 50 }),
  address: varchar({ length: 255 }),
  createdAt: timestamp().notNull().defaultNow(),
  deletedAt: timestamp(), // Soft delete field
});

export const customerPurchasesTable = pgTable("customer_purchases", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: varchar({ length: 36 }).notNull().references(() => customersTable.id),
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  purchaseDate: timestamp().notNull().defaultNow(),
});

export const customerLoyaltyPointsTable = pgTable("customer_loyalty_points", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: varchar({ length: 36 }).notNull().references(() => customersTable.id),
  points: integer().notNull().default(0),
  totalEarned: integer().notNull().default(0),
  totalRedeemed: integer().notNull().default(0),
  lastUpdated: timestamp().notNull().defaultNow(),
});

export const loyaltyTransactionsTable = pgTable("loyalty_transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: varchar({ length: 36 }).notNull().references(() => customersTable.id),
  orderId: varchar({ length: 36 }).references(() => ordersTable.id),
  type: varchar({ length: 20 }).notNull(), // 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points: integer().notNull(),
  description: text(),
  transactionDate: timestamp().notNull().defaultNow(),
});

export const loyaltySettingsTable = pgTable("loyalty_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  pointsPerDollar: numeric({ precision: 5, scale: 2 }).notNull().default('1.00'),
  redemptionRate: numeric({ precision: 5, scale: 2 }).notNull().default('0.01'), // $0.01 per point
  minimumRedemption: integer().notNull().default(100), // Minimum points needed for redemption
  pointsExpiryMonths: integer().default(12), // Points expire after X months
  enabled: boolean().notNull().default(true),
});

export const rolesTable = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull().unique(),
  description: text(),
});

export const employeesTable = pgTable("employees", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(), // hashed password
  roleId: integer().notNull().references(() => rolesTable.id),
  createdAt: timestamp().notNull().defaultNow(),
  deletedAt: timestamp(), // Soft delete
});


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
  

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  deletedAt: timestamp(), // Soft delete field
});

export const promotionsTable = pgTable("promotions", {
  id: varchar({ length: 36 }).primaryKey(),
  storeInfoId: integer().notNull().references(() => storeInfoTable.id),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  type: varchar({ length: 20 }).notNull(), // 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'time_based'
  discountValue: numeric({ precision: 10, scale: 2 }).notNull(), // Percentage (0-100) or fixed amount
  minimumPurchase: numeric({ precision: 10, scale: 2 }).default('0.00'), // Minimum order amount
  maximumDiscount: numeric({ precision: 10, scale: 2 }), // Maximum discount cap for percentage discounts
  startDate: timestamp().notNull(),
  endDate: timestamp().notNull(),
  usageLimit: integer(), // Total usage limit (null = unlimited)
  usageCount: integer().notNull().default(0), // Current usage count
  customerUsageLimit: integer().default(1), // Per-customer usage limit
  isActive: boolean().notNull().default(true),
  applicableToCategories: text(), // JSON array of category IDs
  applicableToProducts: text(), // JSON array of product IDs
  
  // BOGO specific fields
  buyQuantity: integer(), // Buy X items
  getQuantity: integer(), // Get Y items (free or discounted)
  getDiscountType: varchar({ length: 20 }), // 'free' | 'percentage' | 'fixed_amount'
  getDiscountValue: numeric({ precision: 10, scale: 2 }), // Discount for the "get" items
  
  // Time-based promotion fields
  timeBasedType: varchar({ length: 20 }), // 'daily' | 'weekly' | 'specific_dates'
  activeDays: text(), // JSON array of days (0=Sunday, 1=Monday, etc.) for weekly
  activeTimeStart: varchar({ length: 8 }), // HH:MM:SS format
  activeTimeEnd: varchar({ length: 8 }), // HH:MM:SS format
  specificDates: text(), // JSON array of specific dates for 'specific_dates' type
  
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  deletedAt: timestamp(), // Soft delete
});

export const promotionUsageTable = pgTable("promotion_usage", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promotionId: varchar({ length: 36 }).notNull().references(() => promotionsTable.id),
  customerId: varchar({ length: 36 }).references(() => customersTable.id),
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  discountAmount: numeric({ precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp().notNull().defaultNow(),
});

export const discountCodesTable = pgTable("discount_codes", {
  id: varchar({ length: 36 }).primaryKey(),
  promotionId: varchar({ length: 36 }).notNull().references(() => promotionsTable.id),
  code: varchar({ length: 50 }).notNull().unique(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
});