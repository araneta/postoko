import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { taxRatesTable, storeInfoTable, productsTable } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
export default class TaxRatesController {
    // Create tax rate
    static async createTaxRate(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { name, rate, isDefault, isActive = true } = req.body;
        // Validate required fields
        if (!name || rate === undefined || rate === null) {
            return res.status(400).json({ message: 'Missing required fields: name, rate' });
        }
        // Validate rate is between 0 and 100
        const rateNum = parseFloat(rate.toString());
        if (rateNum < 0 || rateNum > 100) {
            return res.status(400).json({ message: 'Tax rate must be between 0 and 100' });
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
            // If setting as default, unset other defaults
            if (isDefault) {
                await db.update(taxRatesTable)
                    .set({ isDefault: false })
                    .where(and(eq(taxRatesTable.storeInfoId, storeInfoId), eq(taxRatesTable.isDefault, true)));
            }
            // Create tax rate
            const newTaxRate = await db.insert(taxRatesTable).values({
                storeInfoId,
                name: name.trim(),
                rate: rateNum,
                isDefault: isDefault || false,
                isActive: isActive,
                createdAt: new Date()
            }).returning();
            res.status(201).json(newTaxRate[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating tax rate' });
        }
    }
    // Get all tax rates for store
    static async getTaxRates(req, res) {
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
            const taxRates = await db.select()
                .from(taxRatesTable)
                .where(eq(taxRatesTable.storeInfoId, storeInfoId))
                .orderBy(taxRatesTable.rate);
            res.status(200).json(taxRates);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching tax rates' });
        }
    }
    // Get tax rate by ID
    static async getTaxRateById(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id } = req.params;
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            const taxRate = await db.select()
                .from(taxRatesTable)
                .where(and(eq(taxRatesTable.id, parseInt(id)), eq(taxRatesTable.storeInfoId, storeInfoId)));
            if (taxRate.length === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }
            res.status(200).json(taxRate[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching tax rate' });
        }
    }
    // Update tax rate
    static async updateTaxRate(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id } = req.params;
        const { name, rate, isDefault, isActive } = req.body;
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            // Verify tax rate exists and belongs to user's store
            const taxRate = await db.select()
                .from(taxRatesTable)
                .where(and(eq(taxRatesTable.id, parseInt(id)), eq(taxRatesTable.storeInfoId, storeInfoId)));
            if (taxRate.length === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }
            // Validate rate if provided
            if (rate !== undefined && rate !== null) {
                const rateNum = parseFloat(rate.toString());
                if (rateNum < 0 || rateNum > 100) {
                    return res.status(400).json({ message: 'Tax rate must be between 0 and 100' });
                }
            }
            const updateData = {};
            if (name)
                updateData.name = name.trim();
            if (rate !== undefined && rate !== null)
                updateData.rate = parseFloat(rate.toString());
            if (isActive !== undefined)
                updateData.isActive = isActive;
            // If setting as default, unset other defaults
            if (isDefault === true) {
                await db.update(taxRatesTable)
                    .set({ isDefault: false })
                    .where(and(eq(taxRatesTable.storeInfoId, storeInfoId), eq(taxRatesTable.isDefault, true)));
                updateData.isDefault = true;
            }
            else if (isDefault === false) {
                updateData.isDefault = false;
            }
            const updatedTaxRate = await db.update(taxRatesTable)
                .set(updateData)
                .where(eq(taxRatesTable.id, parseInt(id)))
                .returning();
            res.status(200).json(updatedTaxRate[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating tax rate' });
        }
    }
    // Delete tax rate
    static async deleteTaxRate(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id } = req.params;
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found' });
            }
            const storeInfoId = storeInfo[0].id;
            // Verify tax rate exists and belongs to user's store
            const taxRate = await db.select()
                .from(taxRatesTable)
                .where(and(eq(taxRatesTable.id, parseInt(id)), eq(taxRatesTable.storeInfoId, storeInfoId)));
            if (taxRate.length === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }
            // Check if any products use this tax rate
            const productsUsingTaxRate = await db.select()
                .from(productsTable)
                .where(eq(productsTable.taxRateId, parseInt(id)));
            if (productsUsingTaxRate.length > 0) {
                return res.status(409).json({
                    message: 'Cannot delete tax rate: it is being used by products',
                    affectedProducts: productsUsingTaxRate.length
                });
            }
            // Delete tax rate
            await db.delete(taxRatesTable)
                .where(eq(taxRatesTable.id, parseInt(id)));
            res.status(200).json({ message: 'Tax rate deleted successfully' });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting tax rate' });
        }
    }
    // Get default tax rate for store
    static async getDefaultTaxRate(req, res) {
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
            const defaultTaxRate = await db.select()
                .from(taxRatesTable)
                .where(and(eq(taxRatesTable.storeInfoId, storeInfoId), eq(taxRatesTable.isDefault, true), eq(taxRatesTable.isActive, true)));
            if (defaultTaxRate.length === 0) {
                return res.status(200).json(null);
            }
            res.status(200).json(defaultTaxRate[0]);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching default tax rate' });
        }
    }
    // Assign tax rate to product
    static async assignTaxRateToProduct(req, res) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { productId, taxRateId, isTaxable } = req.body;
        if (!productId || taxRateId === undefined) {
            return res.status(400).json({ message: 'Missing required fields: productId, taxRateId' });
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
            // Verify tax rate exists and belongs to user's store
            const taxRate = await db.select()
                .from(taxRatesTable)
                .where(and(eq(taxRatesTable.id, parseInt(taxRateId)), eq(taxRatesTable.storeInfoId, storeInfoId)));
            if (taxRate.length === 0) {
                return res.status(404).json({ message: 'Tax rate not found' });
            }
            // Update product with tax rate
            const updatedProduct = await db.update(productsTable)
                .set({
                taxRateId: parseInt(taxRateId),
                isTaxable: isTaxable !== undefined ? isTaxable : true
            })
                .where(eq(productsTable.id, productId))
                .returning();
            res.status(200).json({
                message: 'Tax rate assigned to product successfully',
                product: updatedProduct[0]
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error assigning tax rate to product' });
        }
    }
}
