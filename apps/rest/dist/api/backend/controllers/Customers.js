import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { customersTable, storeInfoTable, ordersTable, orderItemsTable, productsTable, customerLoyaltyPointsTable } from '../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';
export default class CustomersController {
    static async getCustomers(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;
            const customers = await db.select().from(customersTable)
                .where(and(eq(customersTable.storeInfoId, storeInfoId), sql `${customersTable.deletedAt} IS NULL`));
            res.status(200).json(customers);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching customers' });
        }
    }
    static async createCustomer(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id, name, email, phone, address } = req.body;
        if (!id || !name || !email) {
            return res.status(400).json({ message: 'Missing required fields: id, name, email' });
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }
            const storeInfoId = storeInfo[0].id;
            const newCustomer = await db.insert(customersTable).values({
                id,
                storeInfoId,
                name,
                email,
                phone: phone || '',
                address: address || '',
            }).returning();
            res.status(201).json(newCustomer[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating customer' });
        }
    }
    static async updateCustomer(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const customerId = req.params.id;
        const { name, email, phone, address } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Missing required fields: name, email' });
        }
        try {
            const updatedCustomer = await db.update(customersTable)
                .set({ name, email, phone: phone || '', address: address || '' })
                .where(eq(customersTable.id, customerId))
                .returning();
            if (updatedCustomer.length === 0) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            res.status(200).json(updatedCustomer[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating customer' });
        }
    }
    static async deleteCustomer(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const customerId = req.params.id;
        try {
            // Soft delete: set deletedAt to now
            const deletedCustomer = await db.update(customersTable)
                .set({ deletedAt: new Date() })
                .where(eq(customersTable.id, customerId))
                .returning();
            if (deletedCustomer.length === 0) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            res.status(200).json({ message: 'Customer deleted (soft)', customer: deletedCustomer[0] });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting customer' });
        }
    }
    static async getCustomerPurchases(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const customerId = req.params.id;
        try {
            // Get all purchases for this customer with order details and items
            const purchasesWithItems = await db.select({
                purchaseId: customerPurchasesTable.id,
                orderId: customerPurchasesTable.orderId,
                purchaseDate: customerPurchasesTable.purchaseDate,
                order: ordersTable,
                orderItem: orderItemsTable,
                product: productsTable
            })
                .from(customerPurchasesTable)
                .leftJoin(ordersTable, eq(customerPurchasesTable.orderId, ordersTable.id))
                .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
                .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                .where(eq(customerPurchasesTable.customerId, customerId));
            // Get customer's loyalty points
            const loyaltyPoints = await db.select()
                .from(customerLoyaltyPointsTable)
                .where(eq(customerLoyaltyPointsTable.customerId, customerId));
            // Group the results by purchase/order
            const purchasesMap = new Map();
            purchasesWithItems.forEach(row => {
                const purchaseId = row.purchaseId;
                if (!purchasesMap.has(purchaseId)) {
                    purchasesMap.set(purchaseId, {
                        purchaseId: row.purchaseId,
                        orderId: row.orderId,
                        purchaseDate: row.purchaseDate,
                        order: {
                            ...row.order,
                            items: []
                        }
                    });
                }
                // Add item if it exists (order might not have items)
                if (row.orderItem && row.product) {
                    const existingItem = purchasesMap.get(purchaseId).order.items.find((item) => item.id === row.orderItem.productId);
                    if (!existingItem) {
                        purchasesMap.get(purchaseId).order.items.push({
                            id: row.orderItem.productId,
                            storeInfoId: row.product.storeInfoId,
                            name: row.product.name,
                            price: row.product.price,
                            description: row.product.description,
                            image: row.product.image,
                            stock: row.product.stock,
                            category: row.product.categoryId,
                            barcode: row.product.barcode,
                            quantity: row.orderItem.quantity
                        });
                    }
                }
            });
            const purchases = Array.from(purchasesMap.values());
            // Include loyalty points in response
            const response = {
                purchases,
                loyaltyPoints: loyaltyPoints.length > 0 ? loyaltyPoints[0] : {
                    customerId,
                    points: 0,
                    totalEarned: 0,
                    totalRedeemed: 0,
                    lastUpdated: new Date()
                }
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching customer purchases' });
        }
    }
}
