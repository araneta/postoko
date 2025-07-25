import { db } from '../db';
import { ordersTable, orderItemsTable, storeInfoTable, productsTable } from '../db/schema';
import { getAuth } from '@clerk/express';
import { eq, desc } from 'drizzle-orm';
export default class OrdersController {
    static async getOrders(req, res) {
        try {
            // Get orders with their items and product details
            const ordersWithItems = await db
                .select({
                order: ordersTable,
                orderItem: orderItemsTable,
                product: productsTable
            })
                .from(ordersTable)
                .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
                .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                .orderBy(desc(ordersTable.date))
                .limit(20);
            // Group the results by order
            const ordersMap = new Map();
            ordersWithItems.forEach(row => {
                const orderId = row.order.id;
                if (!ordersMap.has(orderId)) {
                    ordersMap.set(orderId, {
                        ...row.order,
                        items: []
                    });
                }
                // Add item if it exists (order might not have items)
                if (row.orderItem && row.product) {
                    const existingItem = ordersMap.get(orderId).items.find((item) => item.id === row.orderItem.productId);
                    if (!existingItem) {
                        ordersMap.get(orderId).items.push({
                            id: row.orderItem.productId,
                            storeInfoId: row.product.storeInfoId,
                            name: row.product.name,
                            price: row.product.price,
                            description: row.product.description,
                            image: row.product.image,
                            stock: row.product.stock,
                            category: row.product.category,
                            barcode: row.product.barcode,
                            quantity: row.orderItem.quantity
                        });
                    }
                }
            });
            const orders = Array.from(ordersMap.values());
            res.status(200).json(orders);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching orders' });
        }
    }
    static async createOrder(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id, items, total, date, paymentMethod, status } = req.body;
        // Validate required fields
        if (!id || !items || !Array.isArray(items) || items.length === 0 || !total || !date || !paymentMethod || !status) {
            return res.status(400).json({
                message: 'Missing required fields: id, items (array), total, date, paymentMethod, status'
            });
        }
        try {
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }
            const storeInfoId = storeInfo[0].id;
            // Use a transaction to ensure data consistency
            const result = await db.transaction(async (tx) => {
                // Create the order
                const newOrder = await tx.insert(ordersTable).values({
                    id: id,
                    storeInfoId: storeInfoId,
                    total: total,
                    date: date,
                    paymentMethod: paymentMethod,
                    status: status
                }).returning();
                // Create order items
                const orderItems = items.map(item => ({
                    orderId: id,
                    productId: item.id,
                    quantity: item.quantity
                }));
                await tx.insert(orderItemsTable).values(orderItems);
                return newOrder[0];
            });
            res.status(201).json(result);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating order' });
        }
    }
}
