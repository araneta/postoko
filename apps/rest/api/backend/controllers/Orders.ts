import { db } from '../db/index.js';
import { ordersTable, orderItemsTable, storeInfoTable, productsTable, customersTable, 
     employeesTable, promotionsTable, promotionUsageTable, discountCodesTable } from '../db/schema.js';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq, desc, and, inArray, sql, isNull, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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
                .orderBy(desc(ordersTable.createdAt))
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
                            category: row.product.categoryId,
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

        const { 
            items, 
            total, 
            subtotal, 
            totalCost = 0,
            discountAmount = 0,
            discountType = null,
            discountValue = 0,
            taxAmount = 0,
            serviceCharge = 0,
            discountCode,
            paymentMethod, 
            status, 
            customer, 
            employee 
        } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0 || !total || !subtotal || !paymentMethod || !status || !employee) {
            return res.status(400).json({ 
                message: 'Missing required fields: items (array), total, subtotal, paymentMethod, status, employee' 
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

            // Validate customer
            if (customer) {
                const customerData = await db.select()
                .from(customersTable)
                .where(and(eq(customersTable.storeInfoId, storeInfoId), eq(customersTable.id, customer.id)));
                if (customerData.length === 0) {
                    return res.status(400).json({ message: 'Customer not found' });
                }
            }

            // Validate employee
            const employeeData = await db.select()
            .from(employeesTable)
            .where(and(eq(employeesTable.storeInfoId, storeInfoId), eq(employeesTable.id, employee.id)));
            if (employeeData.length === 0) {
                return res.status(400).json({ message: 'Employee not found' });
            }

            // Validate discount code if provided
            let promotionId = null;
            console.log('discountCode',discountCode);
            if (discountCode && discountAmount > 0) {
                const [discountCodeData] = await db.select({
                    code: discountCodesTable.code,
                    promotion: promotionsTable
                })
                .from(discountCodesTable)
                .innerJoin(promotionsTable, eq(discountCodesTable.promotionId, promotionsTable.id))
                .where(and(
                    eq(discountCodesTable.code, discountCode.toUpperCase()),
                    eq(discountCodesTable.isActive, true),
                    eq(promotionsTable.storeInfoId, storeInfoId),
                    eq(promotionsTable.isActive, true),
                    isNull(promotionsTable.deletedAt)
                ));

                if (!discountCodeData) {
                    return res.status(400).json({ message: 'Invalid discount code' });
                }

                const promotion = discountCodeData.promotion;

                // Validate promotion dates
                const now = new Date();
                if (new Date(promotion.startDate) > now || new Date(promotion.endDate) < now) {
                    return res.status(400).json({ message: 'Discount code is not valid for the current date' });
                }

                // Validate minimum purchase
                if (promotion.minimumPurchase && parseFloat(subtotal.toString()) < parseFloat(promotion.minimumPurchase.toString())) {
                    return res.status(400).json({ message: `Minimum purchase of ${promotion.minimumPurchase} required` });
                }

                // Check usage limit
                if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
                    return res.status(400).json({ message: 'Discount code usage limit exceeded' });
                }

                // Check customer usage limit
                if (customer && promotion.customerUsageLimit) {
                    const [customerUsage] = await db.select({ count: sql<number>`count(*)` })
                        .from(promotionUsageTable)
                        .where(and(
                            eq(promotionUsageTable.promotionId, promotion.id),
                            eq(promotionUsageTable.customerId, customer.id)
                        ));

                    if (customerUsage.count >= promotion.customerUsageLimit) {
                        return res.status(400).json({ message: 'Customer usage limit exceeded for this promotion' });
                    }
                }

                promotionId = promotion.id;
            }
			console.log('promotionId',promotionId);
            // Execute all operations in a transaction
            const result = await db.transaction(async (tx) => {
                // Create order
                const orderId = randomUUID();
                const orderNumber = `ORD-${Date.now()}`;

                // Calculate actual totalCost if not provided
                let calculatedTotalCost = totalCost;
                if (calculatedTotalCost === 0) {
                    calculatedTotalCost = items.reduce((sum, item) => {
                        const product = products.find(p => p.id === item.id);
                        return sum + (parseFloat(product!.cost.toString()) * item.quantity);
                    }, 0);
                }
                // Create the order
                const newOrder = await tx.insert(ordersTable).values({
                    id: orderId,
                    storeInfoId,
                    total: parseFloat(total.toString()),
                    totalCost: calculatedTotalCost,
                    orderNumber,
                    subtotal: parseFloat(subtotal.toString()),
                    discountType: discountType || null,
                    discountValue: parseFloat(discountValue.toString()) || 0,
                    taxAmount: parseFloat(taxAmount.toString()) || 0,
                    serviceCharge: parseFloat(serviceCharge.toString()) || 0,
                    discountAmount: parseFloat(discountAmount.toString()) || 0,
                    paymentMethod,
                    status,
                    customerId: customer?.id || null,
                    employeeId: employee.id,
                    promotionId: promotionId || null,
                }).returning();

                // Create order items
                const orderItems = items.map(item => {
                    const product = products.find(p => p.id === item.id);
                    console.log('product',product);
		            const unitCost = item.cost || parseFloat(product!.cost.toString());
                    const itemSubtotal = (item.quantity * parseFloat(item.price));
                    const itemDiscountAmount = item.discountAmount ? parseFloat(item.discountAmount.toString()) : 0;
                    const finalPrice = itemSubtotal - itemDiscountAmount;
                    return {
                        orderId: orderId,
                        productId: item.id,
			productName: item.productName || product!.name,
                        quantity: item.quantity,
                        unitPrice: parseFloat(item.price.toString()),
                        unitCost,
                        subtotal: itemSubtotal,
                        discountType: item.discountType || null,
                        discountValue: parseFloat(item.discountValue.toString()) || 0,
                        discountAmount: itemDiscountAmount,
                        finalPrice,
                        promotionId: item.promotionId || null,
                    };
                });

                await tx.insert(orderItemsTable).values(orderItems);

                // Record promotion usage if discount was applied
                if (promotionId && discountAmount > 0) {
                    await tx.insert(promotionUsageTable).values({
                        promotionId,
                        customerId: customer?.id || null,
                        orderId: orderId,
                        discountAmount: discountAmount
                    });

                    // Update promotion usage count
                    await tx.update(promotionsTable)
                        .set({ 
                            usageCount: sql`${promotionsTable.usageCount} + 1`,
                            updatedAt: new Date()
                        })
                        .where(eq(promotionsTable.id, promotionId));
                }

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

                // Record promotion usage if applied
                // usageCount increment happens HERE in createOrder
                if (promotionId && discountAmount > 0) {
                    await tx.insert(promotionUsageTable).values({
                        promotionId,
                        customerId: customer?.id || null,
                        orderId,
                        discountAmount: parseFloat(discountAmount.toString()),
                        usedAt: new Date()
                    });

                    // Increment promotion usage count
                    await tx.update(promotionsTable)
                        .set({ 
                            usageCount: sql`${promotionsTable.usageCount} + 1`,
                            updatedAt: new Date()
                        })
                        .where(eq(promotionsTable.id, promotionId));
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
                return res.status(200).json([]);
            }

            const storeInfoId = storeInfo[0].id;

            let groupBySql;
            let formatLabel;

            // Determine grouping based on period
            if (period === 'monthly') {
                groupBySql = sql`DATE_TRUNC('month', ${ordersTable.createdAt})`;
                formatLabel = sql`TO_CHAR(DATE_TRUNC('month', ${ordersTable.createdAt}), 'YYYY-MM')`;
            } else if (period === 'weekly') {
                groupBySql = sql`DATE_TRUNC('week', ${ordersTable.createdAt})`;
                formatLabel = sql`TO_CHAR(DATE_TRUNC('week', ${ordersTable.createdAt}), 'YYYY-IW')`;
            } else {
                // daily (default)
                groupBySql = sql`DATE_TRUNC('day', ${ordersTable.createdAt})`;
                formatLabel = sql`TO_CHAR(DATE_TRUNC('day', ${ordersTable.createdAt}), 'YYYY-MM-DD')`;
            }

            const report = await db.select({
                period: formatLabel,
                totalSales: sql`SUM(${ordersTable.total})`,
                totalRevenue: sql`SUM(${orderItemsTable.finalPrice})`,
                totalCost: sql`SUM(${orderItemsTable.quantity} * ${orderItemsTable.unitCost})`,
                totalDiscount: sql`SUM(${ordersTable.discountAmount})`,
                totalTax: sql`SUM(${ordersTable.taxAmount})`,
                totalServiceCharge: sql`SUM(${ordersTable.serviceCharge})`,
                orderCount: sql`COUNT(DISTINCT ${ordersTable.id})`,
                itemCount: sql`COUNT(${orderItemsTable.id})`,
                averageOrderValue: sql`AVG(${ordersTable.total})`,
                profit: sql`SUM((${orderItemsTable.finalPrice}) - (${orderItemsTable.quantity} * ${orderItemsTable.unitCost}))`
            })
                .from(ordersTable)
                .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
                .where(and(
                    eq(ordersTable.storeInfoId, storeInfoId),
                    eq(ordersTable.status, 'completed')
                ))
                .groupBy(groupBySql)
                .orderBy(groupBySql);

            // Format the response with calculated fields
            const formattedReport = report.map(row => ({
                period: row.period,
                totalSales: Number(row.totalSales || 0),
                totalRevenue: Number(row.totalRevenue || 0),
                totalCost: Number(row.totalCost || 0),
                totalDiscount: Number(row.totalDiscount || 0),
                totalTax: Number(row.totalTax || 0),
                totalServiceCharge: Number(row.totalServiceCharge || 0),
                profit: Number(row.profit || 0),
                profitMargin: Number(row.totalRevenue) > 0 
                    ? ((Number(row.profit || 0) / Number(row.totalRevenue)) * 100).toFixed(2)
                    : 0,
                orderCount: Number(row.orderCount),
                itemCount: Number(row.itemCount),
                averageOrderValue: Number(row.averageOrderValue || 0),
                averageItemPrice: Number(row.itemCount) > 0
                    ? (Number(row.totalRevenue || 0) / Number(row.itemCount)).toFixed(2)
                    : 0
            }));

            res.status(200).json(formattedReport);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching sales report' });
        }
    }


    static async getBestSellers(req: Request, res: Response) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }

            const { limit = 10, period = 'all' } = req.query;
            const limitNum = parseInt(limit as string) || 10;

            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;

            let whereCondition = and(
                eq(ordersTable.storeInfoId, storeInfoId),
                eq(ordersTable.status, 'completed')
            );

            // Add date filtering if period is specified
            if (period !== 'all') {
                const now = new Date();
                let startDate: Date;
                
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
                
                whereCondition = and(
                    whereCondition,
                    gte(ordersTable.createdAt, startDate)
                );
            }

            const bestSellers = await db.select({
                productId: orderItemsTable.productId,
                productName: orderItemsTable.productName,
                totalQuantity: sql`SUM(${orderItemsTable.quantity})`,
                totalRevenue: sql`SUM(${orderItemsTable.finalPrice})`,
                averagePrice: sql`AVG(${orderItemsTable.unitPrice})`
            })
                .from(orderItemsTable)
                .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
                .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                .where(whereCondition)
                .groupBy(orderItemsTable.productId, orderItemsTable.productName)
                .orderBy(sql`SUM(${orderItemsTable.quantity}) DESC`)
                .limit(limitNum);

            res.status(200).json(bestSellers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching best sellers' });
        }
    }

    static async getPeakHours(req: Request, res: Response) {
        try {
            const auth = getAuth(req);
            if (!auth.userId) {
                return res.status(401).send('Unauthorized');
            }

            const { days = 30 } = req.query;
            const daysNum = parseInt(days as string) || 30;

            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysNum);

            const peakHours = await db.select({
                hour: sql`EXTRACT(HOUR FROM ${ordersTable.createdAt})`,
                orderCount: sql`COUNT(*)`,
                totalSales: sql`SUM(${ordersTable.total})`,
                averageOrderValue: sql`AVG(${ordersTable.total})`
            })
                .from(ordersTable)
                .where(and(
                    eq(ordersTable.storeInfoId, storeInfoId),
                    eq(ordersTable.status, 'completed'),
                    gte(ordersTable.createdAt, startDate)
                ))
                .groupBy(sql`EXTRACT(HOUR FROM ${ordersTable.createdAt})`)
                .orderBy(sql`EXTRACT(HOUR FROM ${ordersTable.createdAt})`);

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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching peak hours' });
        }
    }

    static async getProfitMargin(req: Request, res: Response) {
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
            let startDate: Date;
            
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

            // Get profit margin data from order items for accuracy
            const profitData = await db.select({
                totalRevenue: sql`SUM(${orderItemsTable.finalPrice})`,
                totalCost: sql`SUM(${orderItemsTable.quantity} * ${orderItemsTable.unitCost})`,
                totalProfit: sql`SUM((${orderItemsTable.finalPrice}) - (${orderItemsTable.quantity} * ${orderItemsTable.unitCost}))`,
                orderCount: sql`COUNT(DISTINCT ${ordersTable.id})`,
                averageOrderValue: sql`AVG(${ordersTable.total})`
            })
                .from(orderItemsTable)
                .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
                .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
                .where(and(
                    eq(ordersTable.storeInfoId, storeInfoId),
                    eq(ordersTable.status, 'completed'),
                    gte(ordersTable.createdAt, startDate)
                ));

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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching profit margin' });
        }
    }
}
