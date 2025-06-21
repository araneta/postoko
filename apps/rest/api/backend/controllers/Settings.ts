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
        console.log('userId',auth.userId);
        
        
        try {
            const settings = await db.select()
            .from(storeInfoTable)
            .leftJoin(settingsTable, eq(storeInfoTable.id, settingsTable.storeInfoId))
            .where(eq(storeInfoTable.userId, auth.userId));
            if(settings.length === 0){
                return res.status(200).json(null);
            }else{
                return res.status(200).json(settings[0]);
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    }
}