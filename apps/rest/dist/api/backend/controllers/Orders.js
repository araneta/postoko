import { db } from '../db/index.js';
import { ordersTable, orderItemsTable, storeInfoTable, productsTable, customersTable, customerPurchasesTable, employeesTable } from '../db/schema.js';
import { getAuth } from '@clerk/express';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
export default class OrdersController {
    static async getOrders(req, res) {
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
                            category: row.product.categoryId,
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
        const { items, total, date, paymentMethod, status, customer, employee } = req.body;
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0 || !total || !date || !paymentMethod || !status || !employee) {
            return res.status(400).json({
                message: 'Missing required fields: items (array), total, date, paymentMethod, status, employee'
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
                stock: productsTable.stock,
                price: productsTable.price,
                cost: productsTable.cost,
            })
                .from(productsTable)
                .where(and(eq(productsTable.storeInfoId, storeInfoId), inArray(productsTable.id, productIds)));
            // Validate stock availability
            const stockValidationErrors = [];
            for (const item of items) {
                const product = products.find(p => p.id === item.id);
                if (!product) {
                    stockValidationErrors.push(`Product with ID ${item.id} not found`);
                }
                else if (product.stock < item.quantity) {
                    stockValidationErrors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                }
            }
            if (stockValidationErrors.length > 0) {
                return res.status(400).json({
                    message: 'Stock validation failed',
                    errors: stockValidationErrors
                });
            }
            //validate customer
            if (customer) {
                const customerData = await db.select()
                    .from(customersTable)
                    .where(and(eq(customersTable.storeInfoId, storeInfoId), eq(customersTable.id, customer.id)));
                if (customerData.length === 0) {
                    return res.status(400).json({ message: 'Customer not found' });
                }
            }
            //validate employee
            const employeeData = await db.select()
                .from(employeesTable)
                .where(and(eq(employeesTable.storeInfoId, storeInfoId), eq(employeesTable.id, employee.id)));
            if (employeeData.length === 0) {
                return res.status(400).json({ message: 'Employee not found' });
            }
            const id = randomUUID(); // Or let Postgres handle this
            // Use a transaction to ensure data consistency
            const result = await db.transaction(async (tx) => {
                // Create the order
                const newOrder = await tx.insert(ordersTable).values({
                    id: id,
                    storeInfoId: storeInfoId,
                    total: total,
                    date: date,
                    paymentMethod: paymentMethod,
                    status: status,
                    employeeId: employee.id,
                }).returning();
                // Create order items
                const orderItems = items.map(item => {
                    const product = products.find(p => p.id === item.id);
                    console.log('product', product);
                    return {
                        orderId: id,
                        productId: item.id,
                        quantity: item.quantity,
                        unitPrice: String(product?.price ?? 0), // ensure string type
                        unitCost: String(product?.cost ?? 0) // ensure string type
                    };
                });
                //create customer purchase
                if (customer) {
                    await tx.insert(customerPurchasesTable).values({
                        customerId: customer.id,
                        orderId: id
                    });
                }
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
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating order' });
        }
    }
    static async getAnalytics(req, res) {
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
            const [{ totalSales = 0 } = {}] = await db.select({ totalSales: sql `COALESCE(SUM(${ordersTable.total}), 0)` })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')));
            // Number of orders
            const [{ orderCount = 0 } = {}] = await db.select({ orderCount: sql `COUNT(*)` })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')));
            // Top 5 products by quantity sold
            const topProducts = await db.select({
                productId: orderItemsTable.productId,
                quantitySold: sql `SUM(${orderItemsTable.quantity})`
            })
                .from(orderItemsTable)
                .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')))
                .groupBy(orderItemsTable.productId)
                .orderBy(sql `SUM(${orderItemsTable.quantity}) DESC`)
                .limit(5);
            res.status(200).json({ totalSales, orderCount, topProducts });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching analytics' });
        }
    }
    static async getSalesReport(req, res) {
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
                groupBySql = sql `TO_CHAR(${ordersTable.date}::timestamp, 'YYYY-MM')`;
            }
            else if (period === 'weekly') {
                groupBySql = sql `TO_CHAR(${ordersTable.date}::timestamp, 'IYYY-IW')`;
            }
            else {
                groupBySql = sql `TO_CHAR(${ordersTable.date}::timestamp, 'YYYY-MM-DD')`;
            }
            const report = await db.select({
                period: groupBySql,
                totalSales: sql `SUM(${ordersTable.total})`,
                orderCount: sql `COUNT(*)`
            })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed')))
                .groupBy(groupBySql)
                .orderBy(groupBySql);
            res.status(200).json(report);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching sales report' });
        }
    }
    static async getBestSellers(req, res) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }
            const { limit = 10, period = 'all' } = req.query;
            const limitNum = parseInt(limit) || 10;
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;
            let whereCondition = and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed'));
            // Add date filtering if period is specified
            if (period !== 'all') {
                const now = new Date();
                let startDate;
                switch (period) {
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    case 'year':
                        startDate = new Date(now.getFullYear(), 0, 1);
                        break;
                    default:
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days default
                }
                whereCondition = and(whereCondition, sql `${ordersTable.date}::timestamp >= ${startDate.toISOString()}`);
            }
            const bestSellers = await db.select({
                productId: orderItemsTable.productId,
                productName: productsTable.name,
                totalQuantity: sql `SUM(${orderItemsTable.quantity})`,
                totalRevenue: sql `SUM(${orderItemsTable.quantity} * ${productsTable.price})`,
                averagePrice: sql `AVG(${productsTable.price})`
            })
                .from(orderItemsTable)
                .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
                .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                .where(whereCondition)
                .groupBy(orderItemsTable.productId, productsTable.name)
                .orderBy(sql `SUM(${orderItemsTable.quantity}) DESC`)
                .limit(limitNum);
            res.status(200).json(bestSellers);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching best sellers' });
        }
    }
    static async getPeakHours(req, res) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }
            const { days = 30 } = req.query;
            const daysNum = parseInt(days) || 30;
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysNum);
            const peakHours = await db.select({
                hour: sql `EXTRACT(HOUR FROM ${ordersTable.date}::timestamp)`,
                orderCount: sql `COUNT(*)`,
                totalSales: sql `SUM(${ordersTable.total})`,
                averageOrderValue: sql `AVG(${ordersTable.total})`
            })
                .from(ordersTable)
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed'), sql `${ordersTable.date}::timestamp >= ${startDate.toISOString()}`))
                .groupBy(sql `EXTRACT(HOUR FROM ${ordersTable.date}::timestamp)`)
                .orderBy(sql `EXTRACT(HOUR FROM ${ordersTable.date}::timestamp)`);
            // Fill in missing hours with zero values
            const hourData = Array.from({ length: 24 }, (_, i) => {
                const existingHour = peakHours.find(h => h.hour === i);
                return {
                    hour: i,
                    orderCount: existingHour?.orderCount || 0,
                    totalSales: existingHour?.totalSales || 0,
                    averageOrderValue: existingHour?.averageOrderValue || 0
                };
            });
            res.status(200).json(hourData);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching peak hours' });
        }
    }
    static async getProfitMargin(req, res) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }
            const { period = 'month' } = req.query;
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json(null);
            }
            const storeInfoId = storeInfo[0].id;
            // Calculate date range based on period
            const now = new Date();
            let startDate;
            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days default
            }
            // Get profit margin data
            const profitData = await db.select({
                totalRevenue: sql `SUM(${orderItemsTable.quantity} * ${orderItemsTable.unitPrice})`,
                totalCost: sql `SUM(${orderItemsTable.quantity} * ${orderItemsTable.unitCost})`,
                totalProfit: sql `SUM(${orderItemsTable.quantity} * (${orderItemsTable.unitPrice} - ${orderItemsTable.unitCost}))`,
                orderCount: sql `COUNT(DISTINCT ${ordersTable.id})`,
                averageOrderValue: sql `AVG(${ordersTable.total})`
            })
                .from(orderItemsTable)
                .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
                .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                .where(and(eq(ordersTable.storeInfoId, storeInfoId), eq(ordersTable.status, 'completed'), sql `${ordersTable.date}::timestamp >= ${startDate.toISOString()}`));
            const data = profitData[0];
            if (!data) {
                return res.status(200).json({
                    totalRevenue: 0,
                    totalCost: 0,
                    totalProfit: 0,
                    profitMargin: 0,
                    orderCount: 0,
                    averageOrderValue: 0
                });
            }
            const profitMargin = Number(data.totalRevenue) > 0
                ? ((Number(data.totalProfit) / Number(data.totalRevenue)) * 100)
                : 0;
            res.status(200).json({
                totalRevenue: Number(data.totalRevenue),
                totalCost: Number(data.totalCost),
                totalProfit: Number(data.totalProfit),
                profitMargin: Number(profitMargin.toFixed(2)),
                orderCount: Number(data.orderCount),
                averageOrderValue: Number(data.averageOrderValue)
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching profit margin' });
        }
    }
}
