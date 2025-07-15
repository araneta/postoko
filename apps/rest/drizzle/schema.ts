import { pgTable, varchar, integer, foreignKey, numeric, text, unique, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const currencies = pgTable("currencies", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	symbol: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
});

export const printerSettings = pgTable("printer_settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "printer_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	type: varchar({ length: 20 }).notNull(),
});

export const orders = pgTable("orders", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	storeInfoId: integer().notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	date: varchar({ length: 50 }).notNull(),
	paymentMethod: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storeInfoId],
			foreignColumns: [storeInfo.id],
			name: "orders_storeInfoId_store_info_id_fk"
		}),
]);

export const products = pgTable("products", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	storeInfoId: integer().notNull(),
	name: varchar({ length: 255 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	description: text(),
	image: text(),
	stock: integer().notNull(),
	category: varchar({ length: 255 }).notNull(),
	barcode: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.storeInfoId],
			foreignColumns: [storeInfo.id],
			name: "products_storeInfoId_store_info_id_fk"
		}),
]);

export const storeInfo = pgTable("store_info", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "store_info_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	website: varchar({ length: 255 }).notNull(),
	taxId: varchar({ length: 50 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "store_info_userId_users_id_fk"
		}),
	unique("store_info_email_unique").on(table.email),
]);

export const settings = pgTable("settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	currencyCode: varchar({ length: 10 }).notNull(),
	printerSettingsId: integer().notNull(),
	storeInfoId: integer(),
}, (table) => [
	foreignKey({
			columns: [table.currencyCode],
			foreignColumns: [currencies.code],
			name: "settings_currencyCode_currencies_code_fk"
		}),
	foreignKey({
			columns: [table.printerSettingsId],
			foreignColumns: [printerSettings.id],
			name: "settings_printerSettingsId_printer_settings_id_fk"
		}),
	foreignKey({
			columns: [table.storeInfoId],
			foreignColumns: [storeInfo.id],
			name: "settings_storeInfoId_store_info_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	lastLogin: timestamp({ mode: 'string' }),
	lastIp: varchar({ length: 50 }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const paymentSettings = pgTable("payment_settings", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "payment_settings_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	storeInfoId: integer().notNull(),
	stripePublishableKey: varchar({ length: 255 }),
	stripeSecretKey: varchar({ length: 255 }),
	paymentMethods: text().notNull(),
	enabled: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storeInfoId],
			foreignColumns: [storeInfo.id],
			name: "payment_settings_storeInfoId_store_info_id_fk"
		}),
]);

export const orderItems = pgTable("order_items", {
	orderId: varchar({ length: 36 }).notNull(),
	productId: varchar({ length: 36 }).notNull(),
	quantity: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_orderId_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_productId_products_id_fk"
		}),
	primaryKey({ columns: [table.orderId, table.productId], name: "order_items_orderId_productId_pk"}),
]);
