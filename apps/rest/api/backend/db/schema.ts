import { integer, pgTable, varchar, numeric, text, primaryKey, foreignKey, unique, boolean } from "drizzle-orm/pg-core";
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const productsTable = pgTable("products", {
  id: varchar({ length: 36 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  description: text(),
  image: text(),
  stock: integer().notNull(),
  category: varchar({ length: 255 }).notNull(),
  barcode: varchar({ length: 255 }),
});

export const ordersTable = pgTable("orders", {
  id: varchar({ length: 36 }).primaryKey(),
  total: numeric({ precision: 10, scale: 2 }).notNull(),
  date: varchar({ length: 50 }).notNull(),
  paymentMethod: varchar({ length: 50 }).notNull(),
  status: varchar({ length: 20 }).notNull(), // 'completed' | 'refunded'
});

export const orderItemsTable = pgTable("order_items", {
  orderId: varchar({ length: 36 }).notNull().references(() => ordersTable.id),
  productId: varchar({ length: 36 }).notNull().references(() => productsTable.id),
  quantity: integer().notNull(),
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
  name: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  website: varchar({ length: 255 }).notNull(),
  taxId: varchar({ length: 50 }).notNull(),
});

export const printerSettingsTable = pgTable("printer_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: varchar({ length: 20 }).notNull(), // 'none'
});

export const settingsTable = pgTable("settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  currencyCode: varchar({ length: 10 }).notNull().references(() => currenciesTable.code),
  printerSettingsId: integer().notNull().references(() => printerSettingsTable.id),
  storeInfoId: integer().references(() => storeInfoTable.id),
});
