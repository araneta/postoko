import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { inventoryMovementsTable, storeInfoTable, productsTable } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export default class InventoryController {
    // Record inventory movement
    static async recordMovement(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        const { productId, type, quantity, referenceId } = req.body;

        // Validate required fields
        if (!productId || !type || quantity === undefined || quantity === null) {
            return res.status(400).json({ message: 'Missing required fields: productId, type, quantity' });
        }

        // Validate movement type
        const validTypes = ['sale', 'purchase', 'adjustment', 'return'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                message: `Invalid movement type. Must be one of: ${validTypes.join(', ')}` 
            });
        }

        const quantityNum = parseInt(quantity.toString());
        if (quantityNum === 0) {
            return res.status(400).json({ message: 'Quantity cannot be zero' });
        }

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Verify product exists and belongs to user's store
            const product = await db.select()
                .from(productsTable)
                .where(eq(productsTable.id, productId));

            if (product.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product[0].storeInfoId !== storeInfoId) {
                return res.status(403).json({ message: 'Unauthorized: Product does not belong to your store' });
            }

            // Record movement
            const movement = await db.insert(inventoryMovementsTable).values({
                productId,
                storeInfoId,
                type,
                quantity: quantityNum,
                referenceId: referenceId || null,
                createdAt: new Date()
            }).returning();

            // Update product stock
            const newStock = product[0].stock + quantityNum;
            
            // Validate stock won't go negative (except for specific cases)
            if (newStock < 0 && type === 'sale') {
                // Rollback the movement
                await db.delete(inventoryMovementsTable)
                    .where(eq(inventoryMovementsTable.id, movement[0].id));
                
                return res.status(400).json({ 
                    message: 'Insufficient stock for this sale',
                    currentStock: product[0].stock,
                    requestedQuantity: Math.abs(quantityNum)
                });
            }

            // Update product stock in database
            await db.update(productsTable)
                .set({ stock: newStock })
                .where(eq(productsTable.id, productId));

            res.status(201).json({
                message: 'Inventory movement recorded successfully',
                movement: movement[0],
                previousStock: product[0].stock,
                newStock: newStock,
                minStock: product[0].minStock,
                lowStock: newStock <= product[0].minStock
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error recording inventory movement' });
        }
    }

    // Get inventory movements for product
    static async getMovementsByProduct(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        const { productId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const limitNum = Math.min(parseInt(limit as string) || 50, 100);
        const offsetNum = parseInt(offset as string) || 0;

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Verify product exists and belongs to user's store
            const product = await db.select()
                .from(productsTable)
                .where(eq(productsTable.id, productId));

            if (product.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product[0].storeInfoId !== storeInfoId) {
                return res.status(403).json({ message: 'Unauthorized: Product does not belong to your store' });
            }

            // Get movements
            const movements = await db.select()
                .from(inventoryMovementsTable)
                .where(and(
                    eq(inventoryMovementsTable.productId, productId),
                    eq(inventoryMovementsTable.storeInfoId, storeInfoId)
                ))
                .orderBy(desc(inventoryMovementsTable.createdAt))
                .limit(limitNum)
                .offset(offsetNum);

            // Get total count
            const [{ count }] = await db.select({
                count: sql<number>`COUNT(*)`
            })
                .from(inventoryMovementsTable)
                .where(and(
                    eq(inventoryMovementsTable.productId, productId),
                    eq(inventoryMovementsTable.storeInfoId, storeInfoId)
                ));

            res.status(200).json({
                data: movements,
                pagination: {
                    total: Number(count),
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < Number(count)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching inventory movements' });
        }
    }

    // Get inventory movements for store
    static async getMovementsByStore(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        const { type, limit = 100, offset = 0 } = req.query;

        const limitNum = Math.min(parseInt(limit as string) || 100, 500);
        const offsetNum = parseInt(offset as string) || 0;

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Build where condition
            let whereCondition = eq(inventoryMovementsTable.storeInfoId, storeInfoId);
            if (type) {
                whereCondition = and(whereCondition, eq(inventoryMovementsTable.type, type as string));
            }

            // Get movements
            const movements = await db.select({
                id: inventoryMovementsTable.id,
                productId: inventoryMovementsTable.productId,
                type: inventoryMovementsTable.type,
                quantity: inventoryMovementsTable.quantity,
                referenceId: inventoryMovementsTable.referenceId,
                createdAt: inventoryMovementsTable.createdAt,
                productName: productsTable.name,
                productStock: productsTable.stock
            })
                .from(inventoryMovementsTable)
                .leftJoin(productsTable, eq(inventoryMovementsTable.productId, productsTable.id))
                .where(whereCondition)
                .orderBy(desc(inventoryMovementsTable.createdAt))
                .limit(limitNum)
                .offset(offsetNum);

            // Get total count
            const [{ count }] = await db.select({
                count: sql<number>`COUNT(*)`
            })
                .from(inventoryMovementsTable)
                .where(whereCondition);

            res.status(200).json({
                data: movements,
                pagination: {
                    total: Number(count),
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + limitNum < Number(count)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching inventory movements' });
        }
    }

    // Get low stock products
    static async getLowStockProducts(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Get products with stock <= minStock
            const lowStockProducts = await db.select({
                id: productsTable.id,
                name: productsTable.name,
                stock: productsTable.stock,
                minStock: productsTable.minStock,
                price: productsTable.price,
                categoryId: productsTable.categoryId,
                supplierId: productsTable.supplierId,
                stockDeficit: sql<number>`${productsTable.minStock} - ${productsTable.stock}`
            })
                .from(productsTable)
                .where(and(
                    eq(productsTable.storeInfoId, storeInfoId),
                    sql`${productsTable.stock} <= ${productsTable.minStock}`
                ))
                .orderBy(sql`${productsTable.minStock} - ${productsTable.stock} DESC`);

            res.status(200).json({
                lowStockCount: lowStockProducts.length,
                products: lowStockProducts
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching low stock products' });
        }
    }

    // Get stock summary
    static async getStockSummary(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Get total stock value and count
            const [summary] = await db.select({
                totalProducts: sql<number>`COUNT(*)`,
                totalQuantity: sql<number>`SUM(${productsTable.stock})`,
                totalValue: sql<number>`SUM(${productsTable.stock}::numeric * ${productsTable.price}::numeric)`,
                lowStockCount: sql<number>`COUNT(CASE WHEN ${productsTable.stock} <= ${productsTable.minStock} THEN 1 END)`,
                outOfStockCount: sql<number>`COUNT(CASE WHEN ${productsTable.stock} = 0 THEN 1 END)`
            })
                .from(productsTable)
                .where(eq(productsTable.storeInfoId, storeInfoId));

            // Get movement summary for the day
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [movementSummary] = await db.select({
                totalSales: sql<number>`SUM(CASE WHEN ${inventoryMovementsTable.type} = 'sale' THEN ABS(${inventoryMovementsTable.quantity}) ELSE 0 END)`,
                totalPurchases: sql<number>`SUM(CASE WHEN ${inventoryMovementsTable.type} = 'purchase' THEN ${inventoryMovementsTable.quantity} ELSE 0 END)`,
                totalReturns: sql<number>`SUM(CASE WHEN ${inventoryMovementsTable.type} = 'return' THEN ABS(${inventoryMovementsTable.quantity}) ELSE 0 END)`,
                totalAdjustments: sql<number>`SUM(CASE WHEN ${inventoryMovementsTable.type} = 'adjustment' THEN ${inventoryMovementsTable.quantity} ELSE 0 END)`
            })
                .from(inventoryMovementsTable)
                .where(and(
                    eq(inventoryMovementsTable.storeInfoId, storeInfoId),
                    sql`DATE(${inventoryMovementsTable.createdAt}) = DATE(${today})`
                ));

            res.status(200).json({
                stock: {
                    totalProducts: Number(summary.totalProducts),
                    totalQuantity: Number(summary.totalQuantity || 0),
                    totalValue: Number(summary.totalValue || 0),
                    lowStockCount: Number(summary.lowStockCount || 0),
                    outOfStockCount: Number(summary.outOfStockCount || 0)
                },
                todayMovements: {
                    sales: Number(movementSummary.totalSales || 0),
                    purchases: Number(movementSummary.totalPurchases || 0),
                    returns: Number(movementSummary.totalReturns || 0),
                    adjustments: Number(movementSummary.totalAdjustments || 0)
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching stock summary' });
        }
    }

    // Adjust stock manually
    static async adjustStock(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        const { productId, newStock, reason } = req.body;

        if (!productId || newStock === undefined || newStock === null) {
            return res.status(400).json({ message: 'Missing required fields: productId, newStock' });
        }

        const newStockNum = parseInt(newStock.toString());
        if (newStockNum < 0) {
            return res.status(400).json({ message: 'Stock cannot be negative' });
        }

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Verify product exists and belongs to user's store
            const product = await db.select()
                .from(productsTable)
                .where(eq(productsTable.id, productId));

            if (product.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product[0].storeInfoId !== storeInfoId) {
                return res.status(403).json({ message: 'Unauthorized: Product does not belong to your store' });
            }

            const currentStock = product[0].stock;
            const difference = newStockNum - currentStock;

            // Record adjustment movement
            const movement = await db.insert(inventoryMovementsTable).values({
                productId,
                storeInfoId,
                type: 'adjustment',
                quantity: difference,
                referenceId: reason || null,
                createdAt: new Date()
            }).returning();

            // Update product stock
            await db.update(productsTable)
                .set({ stock: newStockNum })
                .where(eq(productsTable.id, productId));

            res.status(200).json({
                message: 'Stock adjusted successfully',
                adjustment: {
                    productId,
                    previousStock: currentStock,
                    newStock: newStockNum,
                    difference: difference,
                    reason: reason || 'Manual adjustment',
                    movement: movement[0]
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error adjusting stock' });
        }
    }
}
