import { getAuth } from '@clerk/express';
import { db } from '../db';
import { productsTable, storeInfoTable } from '../db/schema';
import { eq } from 'drizzle-orm';
export default class ProductsController {
    static async getProducts(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const products = await db.select().from(productsTable);
            res.status(200).json(products);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    }
    static async createProduct(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id, name, price, stock, category, description } = req.body;
        // Validate required fields
        if (!id || !name || !price || !stock || !category) {
            return res.status(400).json({ message: 'Missing required fields: id, name, price, stock, category' });
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
            // Create the product
            const newProduct = await db.insert(productsTable).values({
                id: id,
                storeInfoId: storeInfoId,
                name: name,
                price: price,
                stock: stock,
                category: category,
                description: description || null
            }).returning();
            res.status(201).json(newProduct[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating product' });
        }
    }
    static async updateProduct(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const productId = req.params.id;
        const { name, price, stock, category, description } = req.body;
        // Validate required fields
        if (!name || !price || !stock || !category) {
            return res.status(400).json({ message: 'Missing required fields: name, price, stock, category' });
        }
        try {
            // Update the product
            const updatedProduct = await db.update(productsTable)
                .set({
                name: name,
                price: price,
                stock: stock,
                category: category,
                description: description || null
            })
                .where(eq(productsTable.id, productId))
                .returning();
            if (updatedProduct.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).json(updatedProduct[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating product' });
        }
    }
}
