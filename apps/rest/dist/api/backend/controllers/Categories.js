import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { categoriesTable, storeInfoTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
export default class CategoriesController {
    static async getCategories(req, res) {
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
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;
            const categories = await db.select()
                .from(categoriesTable)
                .where(eq(categoriesTable.storeInfoId, storeInfoId));
            res.status(200).json(categories);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching categories' });
        }
    }
    static async createCategory(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { name, description } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Missing required field: name' });
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
            // Create the category
            const newCategory = await db.insert(categoriesTable).values({
                storeInfoId: storeInfoId,
                name: name,
                description: description || null,
            }).returning();
            res.status(201).json(newCategory[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating category' });
        }
    }
    static async updateCategory(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const categoryId = parseInt(req.params.id);
        const { name, description } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Missing required field: name' });
        }
        try {
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found.' });
            }
            const storeInfoId = storeInfo[0].id;
            // Update the category (ensure it belongs to the user's store)
            const updatedCategory = await db.update(categoriesTable)
                .set({
                name: name,
                description: description || null,
            })
                .where(eq(categoriesTable.id, categoryId))
                .returning();
            if (updatedCategory.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json(updatedCategory[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating category' });
        }
    }
    static async deleteCategory(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const categoryId = parseInt(req.params.id);
        try {
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found.' });
            }
            const storeInfoId = storeInfo[0].id;
            // Delete the category (ensure it belongs to the user's store)
            const deletedCategory = await db.delete(categoriesTable)
                .where(eq(categoriesTable.id, categoryId))
                .returning();
            if (deletedCategory.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting category' });
        }
    }
}
