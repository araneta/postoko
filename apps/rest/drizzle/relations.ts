import { relations } from "drizzle-orm/relations";
import { storeInfo, orders, products, users, currencies, settings, printerSettings, paymentSettings, orderItems } from "./schema";

export const ordersRelations = relations(orders, ({one, many}) => ({
	storeInfo: one(storeInfo, {
		fields: [orders.storeInfoId],
		references: [storeInfo.id]
	}),
	orderItems: many(orderItems),
}));

export const storeInfoRelations = relations(storeInfo, ({one, many}) => ({
	orders: many(orders),
	products: many(products),
	user: one(users, {
		fields: [storeInfo.userId],
		references: [users.id]
	}),
	settings: many(settings),
	paymentSettings: many(paymentSettings),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	storeInfo: one(storeInfo, {
		fields: [products.storeInfoId],
		references: [storeInfo.id]
	}),
	orderItems: many(orderItems),
}));

export const usersRelations = relations(users, ({many}) => ({
	storeInfos: many(storeInfo),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	currency: one(currencies, {
		fields: [settings.currencyCode],
		references: [currencies.code]
	}),
	printerSetting: one(printerSettings, {
		fields: [settings.printerSettingsId],
		references: [printerSettings.id]
	}),
	storeInfo: one(storeInfo, {
		fields: [settings.storeInfoId],
		references: [storeInfo.id]
	}),
}));

export const currenciesRelations = relations(currencies, ({many}) => ({
	settings: many(settings),
}));

export const printerSettingsRelations = relations(printerSettings, ({many}) => ({
	settings: many(settings),
}));

export const paymentSettingsRelations = relations(paymentSettings, ({one}) => ({
	storeInfo: one(storeInfo, {
		fields: [paymentSettings.storeInfoId],
		references: [storeInfo.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));