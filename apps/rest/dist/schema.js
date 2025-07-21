"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeesTable = exports.rolesTable = exports.loyaltySettingsTable = exports.loyaltyTransactionsTable = exports.customerLoyaltyPointsTable = exports.customerPurchasesTable = exports.customersTable = exports.settingsTable = exports.paymentSettingsTable = exports.printerSettingsTable = exports.storeInfoTable = exports.currenciesTable = exports.orderItemsTable = exports.ordersTable = exports.productsTable = exports.usersTable = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.usersTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)({ length: 255 }).primaryKey(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    lastLogin: (0, pg_core_1.timestamp)(),
    lastIp: (0, pg_core_1.varchar)({ length: 50 }),
});
exports.productsTable = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.varchar)({ length: 36 }).primaryKey(),
    storeInfoId: (0, pg_core_1.integer)().notNull().references(function () { return exports.storeInfoTable.id; }),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    price: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
    cost: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull().default('0.00'), // Cost for profit margin tracking
    description: (0, pg_core_1.text)(),
    image: (0, pg_core_1.text)(),
    stock: (0, pg_core_1.integer)().notNull(),
    minStock: (0, pg_core_1.integer)().default(10), // Minimum stock threshold for notifications
    category: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    barcode: (0, pg_core_1.varchar)({ length: 255 }),
});
exports.ordersTable = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.varchar)({ length: 36 }).primaryKey(),
    storeInfoId: (0, pg_core_1.integer)().notNull().references(function () { return exports.storeInfoTable.id; }),
    total: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
    date: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    paymentMethod: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    status: (0, pg_core_1.varchar)({ length: 20 }).notNull(), // 'completed' | 'refunded'
});
exports.orderItemsTable = (0, pg_core_1.pgTable)("order_items", {
    orderId: (0, pg_core_1.varchar)({ length: 36 }).notNull().references(function () { return exports.ordersTable.id; }),
    productId: (0, pg_core_1.varchar)({ length: 36 }).notNull().references(function () { return exports.productsTable.id; }),
    quantity: (0, pg_core_1.integer)().notNull(),
    // Composite primary key
}, function (table) { return ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.orderId, table.productId] })
}); });
exports.currenciesTable = (0, pg_core_1.pgTable)("currencies", {
    code: (0, pg_core_1.varchar)({ length: 10 }).primaryKey(),
    symbol: (0, pg_core_1.varchar)({ length: 10 }).notNull(),
    name: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
});
exports.storeInfoTable = (0, pg_core_1.pgTable)("store_info", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.varchar)({ length: 255 }).notNull().references(function () { return exports.usersTable.id; }),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    address: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    email: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    website: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    taxId: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
});
exports.printerSettingsTable = (0, pg_core_1.pgTable)("printer_settings", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    type: (0, pg_core_1.varchar)({ length: 20 }).notNull(), // 'none'
});
exports.paymentSettingsTable = (0, pg_core_1.pgTable)("payment_settings", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    storeInfoId: (0, pg_core_1.integer)().notNull().references(function () { return exports.storeInfoTable.id; }),
    stripePublishableKey: (0, pg_core_1.varchar)({ length: 255 }),
    stripeSecretKey: (0, pg_core_1.varchar)({ length: 255 }),
    paymentMethods: (0, pg_core_1.text)().notNull(), // JSON array of payment methods
    enabled: (0, pg_core_1.boolean)().notNull().default(true),
});
exports.settingsTable = (0, pg_core_1.pgTable)("settings", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    currencyCode: (0, pg_core_1.varchar)({ length: 10 }).notNull().references(function () { return exports.currenciesTable.code; }),
    printerSettingsId: (0, pg_core_1.integer)().notNull().references(function () { return exports.printerSettingsTable.id; }),
    storeInfoId: (0, pg_core_1.integer)().references(function () { return exports.storeInfoTable.id; }),
});
exports.customersTable = (0, pg_core_1.pgTable)("customers", {
    id: (0, pg_core_1.varchar)({ length: 36 }).primaryKey(),
    storeInfoId: (0, pg_core_1.integer)().notNull().references(function () { return exports.storeInfoTable.id; }),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    phone: (0, pg_core_1.varchar)({ length: 50 }),
    address: (0, pg_core_1.varchar)({ length: 255 }),
    createdAt: (0, pg_core_1.timestamp)().notNull().defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)(), // Soft delete field
});
exports.customerPurchasesTable = (0, pg_core_1.pgTable)("customer_purchases", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    customerId: (0, pg_core_1.varchar)({ length: 36 }).notNull().references(function () { return exports.customersTable.id; }),
    orderId: (0, pg_core_1.varchar)({ length: 36 }).notNull().references(function () { return exports.ordersTable.id; }),
    purchaseDate: (0, pg_core_1.timestamp)().notNull().defaultNow(),
});
exports.customerLoyaltyPointsTable = (0, pg_core_1.pgTable)("customer_loyalty_points", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    customerId: (0, pg_core_1.varchar)({ length: 36 }).notNull().references(function () { return exports.customersTable.id; }),
    points: (0, pg_core_1.integer)().notNull().default(0),
    totalEarned: (0, pg_core_1.integer)().notNull().default(0),
    totalRedeemed: (0, pg_core_1.integer)().notNull().default(0),
    lastUpdated: (0, pg_core_1.timestamp)().notNull().defaultNow(),
});
exports.loyaltyTransactionsTable = (0, pg_core_1.pgTable)("loyalty_transactions", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    customerId: (0, pg_core_1.varchar)({ length: 36 }).notNull().references(function () { return exports.customersTable.id; }),
    orderId: (0, pg_core_1.varchar)({ length: 36 }).references(function () { return exports.ordersTable.id; }),
    type: (0, pg_core_1.varchar)({ length: 20 }).notNull(), // 'earned' | 'redeemed' | 'expired' | 'adjusted'
    points: (0, pg_core_1.integer)().notNull(),
    description: (0, pg_core_1.text)(),
    transactionDate: (0, pg_core_1.timestamp)().notNull().defaultNow(),
});
exports.loyaltySettingsTable = (0, pg_core_1.pgTable)("loyalty_settings", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    storeInfoId: (0, pg_core_1.integer)().notNull().references(function () { return exports.storeInfoTable.id; }),
    pointsPerDollar: (0, pg_core_1.numeric)({ precision: 5, scale: 2 }).notNull().default('1.00'),
    redemptionRate: (0, pg_core_1.numeric)({ precision: 5, scale: 2 }).notNull().default('0.01'), // $0.01 per point
    minimumRedemption: (0, pg_core_1.integer)().notNull().default(100), // Minimum points needed for redemption
    pointsExpiryMonths: (0, pg_core_1.integer)().default(12), // Points expire after X months
    enabled: (0, pg_core_1.boolean)().notNull().default(true),
});
exports.rolesTable = (0, pg_core_1.pgTable)("roles", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 50 }).notNull().unique(),
    description: (0, pg_core_1.text)(),
});
exports.employeesTable = (0, pg_core_1.pgTable)("employees", {
    id: (0, pg_core_1.varchar)({ length: 36 }).primaryKey(),
    storeInfoId: (0, pg_core_1.integer)().notNull().references(function () { return exports.storeInfoTable.id; }),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)({ length: 255 }).notNull(), // hashed password
    roleId: (0, pg_core_1.integer)().notNull().references(function () { return exports.rolesTable.id; }),
    createdAt: (0, pg_core_1.timestamp)().notNull().defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)(), // Soft delete
});
