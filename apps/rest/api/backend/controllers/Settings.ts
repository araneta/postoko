import { Request, Response } from 'express';
import {  getAuth } from '@clerk/express';
import { asc, between, count, eq, getTableColumns, sql } from 'drizzle-orm';

import { db } from '../db';
import { storeInfoTable, settingsTable } from '../db/schema';

export default class SettingsController {
    static async getSettings(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const products = await db.select()
            .from(storeInfoTable)
            .leftJoin(settingsTable, eq(storeInfoTable.id, settingsTable.storeInfoId))
            .where(eq(storeInfoTable.userId, auth.userId))
            res.status(200).json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    }
}