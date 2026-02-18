import { db } from '../db/index.js';
import { ordersTable, orderItemsTable, storeInfoTable, productsTable, customersTable, 
     employeesTable, promotionsTable, promotionUsageTable, discountCodesTable, taxRatesTable, inventoryMovementsTable } from '../db/schema.js';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq, desc, and, inArray, sql, isNull, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default class OrdersController {
    // Helper: Calculate tax for an item
    static calculateTaxAmount(finalPrice: number, taxRate: number): number {
        return parseFloat((finalPrice * (taxRate / 100)).toFixed(2));
    }

    // Helper: Apply item-level discount
    static calculateItemDiscount(
        subtotal: number,
        discountType: string | null,
        discountValue: number
    ): number {
        if (!discountType || discountValue === 0) {
            return 0;
        }

        if (discountType === 'percentage') {
            return parseFloat((subtotal * (discountValue / 100)).toFixed(2));
        } else if (discountType === 'fixed_amount') {
            return Math.min(parseFloat(discountValue.toString()), subtotal);
        }

        return 0;
    }

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
                        (item: any) => item.productId === row.orderItem!.productId
                    );
                    
                    if (!existingItem) {
                        ordersMap.get(orderId).items.push({
                            productId: row.orderItem!.productId,
                            productName: row.orderItem!.productName,
                            quantity: row.orderItem!.quantity,
                            unitPrice: row.orderItem!.unitPrice,
                            unitCost: row.orderItem!.unitCost,
                            subtotal: row.orderItem!.subtotal,
                            discountType: row.orderItem!.discountType,
                            discountValue: row.orderItem!.discountValue,
                            discountAmount: row.orderItem!.discountAmount,
                            finalPrice: row.orderItem!.finalPrice,
                            taxRate: row.orderItem!.taxRate,
                            taxAmount: row.orderItem!.taxAmount,
                            image: row.product.image,
                            cost: row.product.cost,
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
            const productIds = items.map(item => item.productId);

            // Get current product stock and tax rate information
            const products = await db.select({
                id: productsTable.id,
                name: productsTable.name,
                stock: productsTable.stock,
                price: productsTable.price,
                cost: productsTable.cost,
                taxRateId: productsTable.taxRateId,
                isTaxable: productsTable.isTaxable,
            })
            .from(productsTable)
            .where(
                and(
                    eq(productsTable.storeInfoId, storeInfoId),
                    inArray(productsTable.id, productIds)
                )
            );

            // Get tax rates for taxable products
            const taxRateIds = [...new Set(products.filter(p => p.isTaxable && p.taxRateId).map(p => p.taxRateId))];
            let taxRatesMap = new Map();
            
            if (taxRateIds.length > 0) {
                const taxRates = await db.select()
                    .from(taxRatesTable)
                    .where(inArray(taxRatesTable.id, taxRateIds));
                
                taxRates.forEach(tr => {
                    taxRatesMap.set(tr.id, tr.rate);
                });
            }

            // Validate stock availability
            const stockValidationErrors = [];
            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    stockValidationErrors.push(`Product with ID ${item.productId} not found`);
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

            // Validate customer (optional)
            if (customer && customer.id) {
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

                // Check customer usage limit if customer provided
                if (customer && customer.id && promotion.customerUsageLimit) {
                    const customerUsageCount = await db.select({ count: sql<number>`COUNT(*)` })
                        .from(promotionUsageTable)
                        .where(and(
                            eq(promotionUsageTable.promotionId, promotion.id),
                            eq(promotionUsageTable.customerId, customer.id)
                        ));
                    
                    if (customerUsageCount[0].count >= promotion.customerUsageLimit) {
                        return res.status(400).json({ message: 'Customer has reached usage limit for this promotion' });
                    }
                }

                promotionId = promotion.id;
            }

            // Execute all operations in a transaction
            const result = await db.transaction(async (tx) => {
                // Create order
                const orderId = randomUUID();
                const orderNumber = `ORD-${Date.now()}`;

                // Calculate actual totalCost if not provided
                let calculatedTotalCost = totalCost;
                if (calculatedTotalCost === 0) {
                    calculatedTotalCost = items.reduce((sum, item) => {
                        const product = products.find(p => p.id === item.productId);
                        return sum + (parseFloat(product!.cost.toString()) * item.quantity);
                    }, 0);
                }

                // Insert order
                await tx.insert(ordersTable).values({
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
                });

                // Insert order items with tax calculation
                const orderItemsData = items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const unitCost = item.unitCost || parseFloat(product!.cost.toString());
                    const itemSubtotal = parseFloat(item.subtotal.toString()) || (item.quantity * parseFloat(item.unitPrice.toString()));
                    
                    // Calculate item-level discount
                    const itemDiscountAmount = this.calculateItemDiscount(
                        itemSubtotal,
                        item.discountType,
                        parseFloat(item.discountValue?.toString() || '0')
                    );
                    
                    const finalPrice = itemSubtotal - itemDiscountAmount;
                    
                    // Calculate tax
                    const taxRate = product!.isTaxable && product!.taxRateId 
                        ? taxRatesMap.get(product!.taxRateId) || 0
                        : 0;
                    
                    const itemTaxAmount = this.calculateTaxAmount(finalPrice, taxRate);

                    return {
                        orderId,
                        productId: item.productId,
                        productName: item.productName || product!.name,
                        quantity: item.quantity,
                        unitPrice: parseFloat(item.unitPrice.toString()),
                        unitCost,
                        subtotal: itemSubtotal,
                        discountType: item.discountType || null,
                        discountValue: parseFloat(item.discountValue?.toString() || '0'),
                        discountAmount: itemDiscountAmount,
                        finalPrice,
                        taxRate,
                        taxAmount: itemTaxAmount,
                        promotionId: item.promotionId || null,
                    };
                });

                for (const itemData of orderItemsData) {
                    await tx.insert(orderItemsTable).values(itemData);
                }

                // Record inventory movements and update product stock
                for (const item of items) {
                    const product = products.find(p => p.id === item.productId);
                    
                    // Record movement
                    await tx.insert(inventoryMovementsTable).values({
                        productId: item.productId,
                        storeInfoId,
                        type: 'sale',
                        quantity: -item.quantity,
                        referenceId: orderId,
                        createdAt: new Date()
                    });
                    
                    // Update stock
                    await tx.update(productsTable)
                        .set({ stock: product!.stock - item.quantity })
                        .where(eq(productsTable.id, item.productId));
                }

                // Record promotion usage if applied
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

                return { orderId, orderNumber };
            });

            res.status(201).json({ 
                message: 'Order created successfully',
                orderId: result.orderId,
                orderNumber: result.orderNumber
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating order' });
        }
    }

    // ... rest of the methods remain the same (getOrderById, updateOrderStatus, deleteOrder, etc.)
}
