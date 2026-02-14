import { Request, Response } from 'express';
import {  getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { productsTable, storeInfoTable, categoriesTable } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';


export default class ProductsController {
    static async getProducts(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
			 // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                //return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
                return res.status(200).json(null);
            }

            const storeInfoId = storeInfo[0].id;
            const products = await db.select({
                id: productsTable.id,
                storeInfoId: productsTable.storeInfoId,
                name: productsTable.name,
                price: productsTable.price,
                cost: productsTable.cost,
                description: productsTable.description,
                image: productsTable.image,
                stock: productsTable.stock,
                minStock: productsTable.minStock,
                categoryId: productsTable.categoryId,
                categoryName: categoriesTable.name,
                barcode: productsTable.barcode,
                supplierId: productsTable.supplierId,
            })
            .from(productsTable)
            .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
            .where(eq(productsTable.storeInfoId, storeInfoId));
            res.status(200).json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    }

    static async createProduct(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        const { id, name, price, stock, minStock, categoryId, description, image, barcode, cost, supplierId,  } = req.body;

        // Validate required fields
        if (!id || !name || !price || !stock || !categoryId || !supplierId) {
            return res.status(400).json({ message: 'Missing required fields: id, name, price, stock, categoryId, supplierId' });
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
			// Check if product with the same name already exists in this store
            const existingProduct = await db.select()
                .from(productsTable)
                .where(and(
                    eq(productsTable.storeInfoId, storeInfoId),
                    eq(productsTable.name, name.trim())
                ));

            if (existingProduct.length > 0) {
                return res.status(409).json({ 
                    message: 'Product with this name already exists in your store',
                    details: {
                        existingProductId: existingProduct[0].id,
                        existingProductName: existingProduct[0].name
                    }
                });
            }
            // Create the product
            const newProduct = await db.insert(productsTable).values({
                id: id,
                storeInfoId: storeInfoId,
                name: name,
                price: price,
                cost: cost,
                stock: stock,
                minStock: minStock || 10, // Default to 10 if not provided
                categoryId: categoryId,
                description: description || null,
                image: image||'',
                barcode: barcode||'',
                supplierId: supplierId||'',
            }).returning();

            res.status(201).json(newProduct[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating product' });
        }
    }

    static async updateProduct(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const productId = req.params.id;
        const {  name, price, stock, minStock, categoryId, description, image, barcode, cost, supplierId } = req.body;

        // Validate required fields
        if (!name || !price || !stock || !categoryId) {
            return res.status(400).json({ message: 'Missing required fields: name, price, stock, categoryId' });
        }

        try {
			// Get storeInfoId for the authenticated user
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

            // Check if another product with the same name exists in this store (excluding current product)
            const existingProduct = await db.select()
                .from(productsTable)
                .where(and(
                    eq(productsTable.storeInfoId, storeInfoId),
                    eq(productsTable.name, name.trim())
                ));

            if (existingProduct.length > 0 && existingProduct[0].id !== productId) {
                return res.status(409).json({ 
                    message: 'Product with this name already exists in your store',
                    details: {
                        existingProductId: existingProduct[0].id,
                        existingProductName: existingProduct[0].name
                    }
                });
            }
            
            // Update the product
            const updatedProduct = await db.update(productsTable)
                .set({
                    name: name,
                    price: price,
                    stock: stock,
                    cost: cost,
                    minStock: minStock || 10, // Default to 10 if not provided
                    categoryId: categoryId,
                    description: description || null,
                    image: image||'',
                    barcode: barcode||'',
                    supplierId: supplierId||'',
                })
                .where(eq(productsTable.id, productId))
                .returning();

            if (updatedProduct.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            res.status(200).json(updatedProduct[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating product' });
        }
    }
    
    static async deleteProduct(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        const productId = req.params.id;

        try {
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }

            const storeInfoId = storeInfo[0].id;

            // Verify product belongs to the user's store
            const product = await db.select()
                .from(productsTable)
                .where(eq(productsTable.id, productId));

            if (product.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product[0].storeInfoId !== storeInfoId) {
                return res.status(403).json({ message: 'Unauthorized: Product does not belong to your store' });
            }

            // Delete the product
            await db.delete(productsTable)
                .where(eq(productsTable.id, productId));

            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting product' });
        }
    }

}
