import { Request, Response } from 'express';
import {  getAuth,clerkClient,  } from '@clerk/express';
import { asc, between, count, eq, getTableColumns, sql } from 'drizzle-orm';

import { db } from '../db';
import { storeInfoTable, settingsTable, printerSettingsTable, currenciesTable, paymentSettingsTable, employeesTable, rolesTable } from '../db/schema';

export default class SettingsController {
    static async getSettings(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        console.log('userId',auth.userId);
        
        try {            
            // Get store info and settings
            const settings = await db.select()
                .from(storeInfoTable)
                .leftJoin(settingsTable, eq(storeInfoTable.id, settingsTable.storeInfoId))
                .where(eq(storeInfoTable.userId, auth.userId));
            if(settings.length === 0){
                res.status(500).json({ message: 'no settings' });
            } else {
                const settingsData = settings[0];
                if (!settingsData.settings) {
                    // No settings row, just return storeInfo
                    return res.status(200).json({
                        currency: null,
                        printer: null,
                        storeInfo: {
                            name: settingsData.store_info.name,
                            address: settingsData.store_info.address,
                            phone: settingsData.store_info.phone,
                            email: settingsData.store_info.email,
                            website: settingsData.store_info.website,
                            taxId: settingsData.store_info.taxId
                        },
                        payment: null
                    });
                }
                // Fetch currency, printer, and payment details
                const [currency] = await db.select().from(currenciesTable).where(eq(currenciesTable.code, settingsData.settings.currencyCode));
                const [printer] = await db.select().from(printerSettingsTable).where(eq(printerSettingsTable.id, settingsData.settings.printerSettingsId));
                const [payment] = await db.select().from(paymentSettingsTable).where(eq(paymentSettingsTable.storeInfoId, settingsData.store_info.id));
                
                return res.status(200).json({
                    currency: currency ? { code: currency.code, symbol: currency.symbol, name: currency.name } : null,
                    printer: printer ? { type: printer.type } : null,
                    storeInfo: {
                        id: settingsData.store_info.id,
                        name: settingsData.store_info.name,
                        address: settingsData.store_info.address,
                        phone: settingsData.store_info.phone,
                        email: settingsData.store_info.email,
                        website: settingsData.store_info.website,
                        taxId: settingsData.store_info.taxId
                    },
                    payment: payment ? {
                        stripePublishableKey: payment.stripePublishableKey || '',
                        stripeSecretKey: payment.stripeSecretKey || '',
                        paypalMode: payment.paypalMode || 'sandbox',
                        paypalClientId: payment.paypalClientId || '',
                        paypalClientSecret: payment.paypalClientSecret || '',
                        paymentMethods: payment.paymentMethods ? JSON.parse(payment.paymentMethods) : ['cash'],
                        enabled: payment.enabled
                    } : null
                });
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching settings' });
        }
    }

    static async saveSettings(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { currency, printer, storeInfo, payment } = req.body;
        try {
            // 1. Upsert storeInfo
            let storeInfoRecord = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            let storeInfoId;
            if (storeInfoRecord.length === 0) {
                const inserted = await db.insert(storeInfoTable).values({
                    userId: auth.userId,
                    name: storeInfo.name || '',
                    address: storeInfo.address || '',
                    phone: storeInfo.phone || '',
                    email: storeInfo.email || '',
                    website: storeInfo.website || '',
                    taxId: storeInfo.taxId || ''
                }).returning();
                storeInfoId = inserted[0].id;
            } else {
                const updated = await db.update(storeInfoTable)
                    .set({
                        name: storeInfo.name || '',
                        address: storeInfo.address || '',
                        phone: storeInfo.phone || '',
                        email: storeInfo.email || '',
                        website: storeInfo.website || '',
                        taxId: storeInfo.taxId || ''
                    })
                    .where(eq(storeInfoTable.userId, auth.userId))
                    .returning();
                storeInfoId = updated[0].id;
            }

            // 2. Upsert printer settings
            let printerSettingsId;
            if(!printer || !printer.type){
                const insertedPrinter = await db.insert(printerSettingsTable).values({
                    type: 'none'
                }).returning();
                printerSettingsId = insertedPrinter[0].id;
            }else{
                let printerRecord = await db.select().from(printerSettingsTable).where(eq(printerSettingsTable.type, printer.type));
            
                if (printerRecord.length === 0) {
                    const insertedPrinter = await db.insert(printerSettingsTable).values({
                        type: printer.type
                    }).returning();
                    printerSettingsId = insertedPrinter[0].id;
                } else {
                    printerSettingsId = printerRecord[0].id;
                }
            }
            

            // 3. Upsert payment settings
            let paymentSettingsRecord = await db.select().from(paymentSettingsTable).where(eq(paymentSettingsTable.storeInfoId, storeInfoId));
            if (paymentSettingsRecord.length === 0) {
                await db.insert(paymentSettingsTable).values({
                    storeInfoId: storeInfoId,
                    stripePublishableKey: payment?.stripePublishableKey || '',
                    stripeSecretKey: payment?.stripeSecretKey || '',
                    paypalMode: payment?.paypalMode || 'sandbox', // default to sandbox
                    paypalClientId: payment?.paypalClientId || '',
                    paypalClientSecret: payment?.paypalClientSecret || '',
                    paymentMethods: JSON.stringify(payment?.paymentMethods || ['cash']),
                    enabled: payment?.enabled !== undefined ? payment.enabled : false
                });
            } else {
                await db.update(paymentSettingsTable)
                    .set({
                        stripePublishableKey: payment?.stripePublishableKey || '',
                        stripeSecretKey: payment?.stripeSecretKey || '',
                        paypalMode: payment?.paypalMode || 'sandbox', // default to sandbox
                        paypalClientId: payment?.paypalClientId || '',
                        paypalClientSecret: payment?.paypalClientSecret || '',
                        paymentMethods: JSON.stringify(payment?.paymentMethods || ['cash']),
                        enabled: payment?.enabled !== undefined ? payment.enabled : false
                    })
                    .where(eq(paymentSettingsTable.storeInfoId, storeInfoId));
            }

            // 4. Ensure currency exists in currenciesTable
            let currencyRecord = await db.select().from(currenciesTable).where(eq(currenciesTable.code, currency.code));
            if (currencyRecord.length === 0) {
                await db.insert(currenciesTable).values({
                    code: currency.code,
                    symbol: currency.symbol,
                    name: currency.name
                });
            }

            // 5. Upsert settings
            let settingsRecord = await db.select().from(settingsTable).where(eq(settingsTable.storeInfoId, storeInfoId));
            let settingsResult;
            if (settingsRecord.length === 0) {
                settingsResult = await db.insert(settingsTable).values({
                    currencyCode: currency.code,
                    printerSettingsId: printerSettingsId,
                    storeInfoId: storeInfoId
                }).returning();
            } else {
                settingsResult = await db.update(settingsTable)
                    .set({
                        currencyCode: currency.code,
                        printerSettingsId: printerSettingsId
                    })
                    .where(eq(settingsTable.storeInfoId, storeInfoId))
                    .returning();
            }

            return res.status(200).json(settingsResult[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error saving settings' });
        }
    }
}