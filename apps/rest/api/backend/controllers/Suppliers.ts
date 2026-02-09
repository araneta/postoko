import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { suppliersTable, storeInfoTable } from '../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';

export default class SuppliersController {
    static async getSuppliers(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(200).json([]);
            }
            const storeInfoId = storeInfo[0].id;
            const suppliers = await db.select().from(suppliersTable)
                .where(and(
                    eq(suppliersTable.storeInfoId, storeInfoId),
                    sql`${suppliersTable.deletedAt} IS NULL`
                ));
            res.status(200).json(suppliers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching suppliers' });
        }
    }

    static async createSupplier(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { id, name, email, phone, address, notes, website, taxId, paymentTerms, creditLimit, currency, rating, totalOrders, totalSpent, averageDeliveryDays, isActive } = req.body;
        if (!id || !name || !email) {
            return res.status(400).json({ message: 'Missing required fields: id, name, email' });
        }
        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }
            const storeInfoId = storeInfo[0].id;
            const newSupplier = await db.insert(suppliersTable).values({
                id,
                storeInfoId,
                name,
                email,
                phone: phone || '',
                address: address || '',
                notes: notes || '',
                website: website || '',
                taxId: taxId || '',
                paymentTerms: paymentTerms || '',
                creditLimit: creditLimit || '0.00',
                currency: currency || 'USD',
                rating: rating || 0,
                totalOrders: totalOrders || 0,
                totalSpent: totalSpent || '0.00',
                averageDeliveryDays: averageDeliveryDays || 0,
                isActive: isActive !== undefined ? isActive : true,
            }).returning();
            res.status(201).json(newSupplier[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating supplier' });
        }
    }

    static async updateSupplier(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const supplierId = req.params.id;
        const { name, email, phone, address, notes, website, taxId, paymentTerms, creditLimit, currency, rating, totalOrders, totalSpent, averageDeliveryDays, isActive } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Missing required fields: name, email' });
        }
        try {
            const updatedSupplier = await db.update(suppliersTable)
                .set({ name, email, phone: phone || '', address: address || '', notes: notes || '', website: website || '', taxId: taxId || '', paymentTerms: paymentTerms || '', creditLimit: creditLimit || '0.00', currency: currency || 'USD', rating: rating || 0, totalOrders: totalOrders || 0, totalSpent: totalSpent || '0.00', averageDeliveryDays: averageDeliveryDays || 0, isActive: isActive !== undefined ? isActive : true })
                .where(eq(suppliersTable.id, supplierId))
                .returning();
            if (updatedSupplier.length === 0) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            res.status(200).json(updatedSupplier[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating supplier' });
        }
    }

    static async deleteSupplier(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const supplierId = req.params.id;
        try {
            // Soft delete: set deletedAt to now
            const deletedSupplier = await db.update(suppliersTable)
                .set({ deletedAt: new Date() })
                .where(eq(suppliersTable.id, supplierId))
                .returning();
            if (deletedSupplier.length === 0) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            res.status(200).json({ message: 'Supplier deleted (soft)', supplier: deletedSupplier[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting supplier' });
        }
    }
}
