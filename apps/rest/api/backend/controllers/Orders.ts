import { db } from '../db';
import { ordersTable, orderItemsTable, storeInfoTable, productsTable } from '../db/schema';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';

export default class OrdersController {
    static async getOrders(req: Request, res: Response) {
        try {
			const auth = getAuth(req);

			if (!auth.userId) {
				return res.status(401).send('Unauthorized');
			}
			 // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                //return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
                return res.status(200).json(null);
            }

            const storeInfoId = storeInfo[0].id;
            
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
                .where(eq(ordersTable.storeInfoId, storeInfoId))
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
                    const existingItem = ordersMap.get(orderId).items.find(
                        (item: any) => item.id === row.orderItem!.productId
                    );
                    
                    if (!existingItem) {
                        ordersMap.get(orderId).items.push({
                            id: row.orderItem!.productId,
                            storeInfoId: row.product.storeInfoId,
                            name: row.product.name,
                            price: row.product.price,
                            description: row.product.description,
                            image: row.product.image,
                            stock: row.product.stock,
                            category: row.product.category,
                            barcode: row.product.barcode,
                            quantity: row.orderItem!.quantity
                        });
                    }
                }
            });

            const orders = Array.from(ordersMap.values());
            res.status(200).json(orders);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching orders' });
        }
    }

    static async createOrder(req: Request, res: Response) {
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

            // Extract product IDs from items
            const productIds = items.map(item => item.id);

            // Get current product stock information
            const products = await db.select({
                id: productsTable.id,
                name: productsTable.name,
                stock: productsTable.stock
            })
            .from(productsTable)
            .where(
                and(
                    eq(productsTable.storeInfoId, storeInfoId),
                    inArray(productsTable.id, productIds)
                )
            );

            // Validate stock availability
            const stockValidationErrors = [];
            for (const item of items) {
                const product = products.find(p => p.id === item.id);
                if (!product) {
                    stockValidationErrors.push(`Product with ID ${item.id} not found`);
                } else if (product.stock < item.quantity) {
                    stockValidationErrors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                }
            }

            if (stockValidationErrors.length > 0) {
                return res.status(400).json({ 
                    message: 'Stock validation failed', 
                    errors: stockValidationErrors 
                });
            }

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

                // Update product stock
                for (const item of items) {
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        const newStock = product.stock - item.quantity;
                        await tx.update(productsTable)
                            .set({
                                stock: newStock
                            })
                            .where(eq(productsTable.id, item.id));
                    }
                }

                return newOrder[0];
            });

            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating order' });
        }
    }

    static async getAnalytics(req: Request, res: Response) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json(null);
            }
            const storeInfoId = storeInfo[0].id;
            // Total sales
            const [{ totalSales = 0 } = {}] = await db.select({ totalSales: sql`COALESCE(SUM(${ordersTable.total}), 0)` })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')));
            // Number of orders
            const [{ orderCount = 0 } = {}] = await db.select({ orderCount: sql`COUNT(*)` })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')));
            // Top 5 products by quantity sold
            const topProducts = await db.select({
                productId: orderItemsTable.productId,
                quantitySold: sql`SUM(${orderItemsTable.quantity})`
            })
                .from(orderItemsTable)
                .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')))
                .groupBy(orderItemsTable.productId)
                .orderBy(sql`SUM(${orderItemsTable.quantity}) DESC`)
                .limit(5);
            res.status(200).json({ totalSales, orderCount, topProducts });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching analytics' });
        }
    }

    static async getSalesReport(req: Request, res: Response) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }
            const { period = 'daily' } = req.query;
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json(null);
            }
            const storeInfoId = storeInfo[0].id;
            let groupBySql;
            if (period === 'monthly') {
                groupBySql = sql`TO_CHAR(${ordersTable.date}::timestamp, 'YYYY-MM')`;
            } else if (period === 'weekly') {
                groupBySql = sql`TO_CHAR(${ordersTable.date}::timestamp, 'IYYY-IW')`;
            } else {
                groupBySql = sql`TO_CHAR(${ordersTable.date}::timestamp, 'YYYY-MM-DD')`;
            }
            const report = await db.select({
                period: groupBySql,
                totalSales: sql`SUM(${ordersTable.total})`,
                orderCount: sql`COUNT(*)`
            })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')))
                .groupBy(groupBySql)
                .orderBy(groupBySql);
            res.status(200).json(report);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching sales report' });
        }
    }
}
