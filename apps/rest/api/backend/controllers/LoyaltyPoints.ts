import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { db } from '../db';
import { customerLoyaltyPointsTable, loyaltyTransactionsTable, loyaltySettingsTable, customersTable, storeInfoTable, ordersTable } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export default class LoyaltyPointsController {
    // Get customer's loyalty points balance
    static async getCustomerPoints(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const customerId = req.params.customerId;
        
        try {
            // Get store info to verify ownership
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            
            if (storeInfo.length === 0) {
                return res.status(404).json({ message: 'Store not found' });
            }

            // Get customer's loyalty points
            const loyaltyPoints = await db.select()
                .from(customerLoyaltyPointsTable)
                .where(eq(customerLoyaltyPointsTable.customerId, customerId));

            if (loyaltyPoints.length === 0) {
                // Create loyalty points record if it doesn't exist
                const newLoyaltyPoints = await db.insert(customerLoyaltyPointsTable)
                    .values({
                        customerId,
                        points: 0,
                        totalEarned: 0,
                        totalRedeemed: 0
                    })
                    .returning();
                return res.status(200).json(newLoyaltyPoints[0]);
            }

            res.status(200).json(loyaltyPoints[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching loyalty points' });
        }
    }

    // Get customer's loyalty transaction history
    static async getCustomerTransactions(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const customerId = req.params.customerId;
        
        try {
            const transactions = await db.select()
                .from(loyaltyTransactionsTable)
                .where(eq(loyaltyTransactionsTable.customerId, customerId))
                .orderBy(desc(loyaltyTransactionsTable.transactionDate));

            res.status(200).json(transactions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching loyalty transactions' });
        }
    }

    // Earn points from a purchase
    static async earnPoints(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { customerId, orderId, amount } = req.body;
        
        if (!customerId || !orderId || !amount) {
            return res.status(400).json({ message: 'Missing required fields: customerId, orderId, amount' });
        }

        try {
            // Get store loyalty settings
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            
            if (storeInfo.length === 0) {
                return res.status(404).json({ message: 'Store not found' });
            }

            const loyaltySettings = await db.select()
                .from(loyaltySettingsTable)
                .where(eq(loyaltySettingsTable.storeInfoId, storeInfo[0].id));

            if (loyaltySettings.length === 0) {
                return res.status(400).json({ message: 'Loyalty system not configured for this store' });
            }

            const settings = loyaltySettings[0];
            if (!settings.enabled) {
                return res.status(400).json({ message: 'Loyalty system is disabled for this store' });
            }

            // Calculate points to earn
            const pointsToEarn = Math.floor(parseFloat(amount) * parseFloat(settings.pointsPerDollar.toString()));

            // Get or create customer loyalty points record
            let loyaltyPoints = await db.select()
                .from(customerLoyaltyPointsTable)
                .where(eq(customerLoyaltyPointsTable.customerId, customerId));

            if (loyaltyPoints.length === 0) {
                const newLoyaltyPoints = await db.insert(customerLoyaltyPointsTable)
                    .values({
                        customerId,
                        points: pointsToEarn,
                        totalEarned: pointsToEarn,
                        totalRedeemed: 0
                    })
                    .returning();
                loyaltyPoints = newLoyaltyPoints;
            } else {
                // Update existing loyalty points
                const updatedLoyaltyPoints = await db.update(customerLoyaltyPointsTable)
                    .set({
                        points: loyaltyPoints[0].points + pointsToEarn,
                        totalEarned: loyaltyPoints[0].totalEarned + pointsToEarn,
                        lastUpdated: new Date()
                    })
                    .where(eq(customerLoyaltyPointsTable.customerId, customerId))
                    .returning();
                loyaltyPoints = updatedLoyaltyPoints;
            }

            // Create transaction record
            const transaction = await db.insert(loyaltyTransactionsTable)
                .values({
                    customerId,
                    orderId,
                    type: 'earned',
                    points: pointsToEarn,
                    description: `Earned ${pointsToEarn} points from purchase of $${amount}`
                })
                .returning();

            res.status(200).json({
                loyaltyPoints: loyaltyPoints[0],
                transaction: transaction[0]
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error earning loyalty points' });
        }
    }

    // Redeem points for discount
    static async redeemPoints(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { customerId, pointsToRedeem, orderId } = req.body;
        
        if (!customerId || !pointsToRedeem) {
            return res.status(400).json({ message: 'Missing required fields: customerId, pointsToRedeem' });
        }

        try {
            // Get store loyalty settings
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            
            if (storeInfo.length === 0) {
                return res.status(404).json({ message: 'Store not found' });
            }

            const loyaltySettings = await db.select()
                .from(loyaltySettingsTable)
                .where(eq(loyaltySettingsTable.storeInfoId, storeInfo[0].id));

            if (loyaltySettings.length === 0) {
                return res.status(400).json({ message: 'Loyalty system not configured for this store' });
            }

            const settings = loyaltySettings[0];
            if (!settings.enabled) {
                return res.status(400).json({ message: 'Loyalty system is disabled for this store' });
            }

            // Check minimum redemption requirement
            if (pointsToRedeem < settings.minimumRedemption) {
                return res.status(400).json({ 
                    message: `Minimum redemption is ${settings.minimumRedemption} points` 
                });
            }

            // Get customer's current points
            const loyaltyPoints = await db.select()
                .from(customerLoyaltyPointsTable)
                .where(eq(customerLoyaltyPointsTable.customerId, customerId));

            if (loyaltyPoints.length === 0) {
                return res.status(404).json({ message: 'Customer loyalty record not found' });
            }

            if (loyaltyPoints[0].points < pointsToRedeem) {
                return res.status(400).json({ message: 'Insufficient points for redemption' });
            }

            // Calculate discount amount
            const discountAmount = pointsToRedeem * parseFloat(settings.redemptionRate.toString());

            // Update loyalty points
            const updatedLoyaltyPoints = await db.update(customerLoyaltyPointsTable)
                .set({
                    points: loyaltyPoints[0].points - pointsToRedeem,
                    totalRedeemed: loyaltyPoints[0].totalRedeemed + pointsToRedeem,
                    lastUpdated: new Date()
                })
                .where(eq(customerLoyaltyPointsTable.customerId, customerId))
                .returning();

            // Create transaction record
            const transaction = await db.insert(loyaltyTransactionsTable)
                .values({
                    customerId,
                    orderId: orderId || null,
                    type: 'redeemed',
                    points: -pointsToRedeem,
                    description: `Redeemed ${pointsToRedeem} points for $${discountAmount.toFixed(2)} discount`
                })
                .returning();

            res.status(200).json({
                loyaltyPoints: updatedLoyaltyPoints[0],
                transaction: transaction[0],
                discountAmount: discountAmount
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error redeeming loyalty points' });
        }
    }

    // Get or create loyalty settings for store
    static async getLoyaltySettings(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            
            if (storeInfo.length === 0) {
                return res.status(404).json({ message: 'Store not found' });
            }

            const loyaltySettings = await db.select()
                .from(loyaltySettingsTable)
                .where(eq(loyaltySettingsTable.storeInfoId, storeInfo[0].id));

            if (loyaltySettings.length === 0) {
                // Create default loyalty settings
                const defaultSettings = await db.insert(loyaltySettingsTable)
                    .values({
                        storeInfoId: storeInfo[0].id,
                        pointsPerDollar: '1.00',
                        redemptionRate: '0.01',
                        minimumRedemption: 100,
                        pointsExpiryMonths: 12,
                        enabled: true
                    })
                    .returning();
                return res.status(200).json(defaultSettings[0]);
            }

            res.status(200).json(loyaltySettings[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching loyalty settings' });
        }
    }

    // Update loyalty settings
    static async updateLoyaltySettings(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { pointsPerDollar, redemptionRate, minimumRedemption, pointsExpiryMonths, enabled } = req.body;

        try {
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));
            
            if (storeInfo.length === 0) {
                return res.status(404).json({ message: 'Store not found' });
            }

            const loyaltySettings = await db.select()
                .from(loyaltySettingsTable)
                .where(eq(loyaltySettingsTable.storeInfoId, storeInfo[0].id));

            if (loyaltySettings.length === 0) {
                return res.status(404).json({ message: 'Loyalty settings not found' });
            }

            const updatedSettings = await db.update(loyaltySettingsTable)
                .set({
                    pointsPerDollar: pointsPerDollar || loyaltySettings[0].pointsPerDollar,
                    redemptionRate: redemptionRate || loyaltySettings[0].redemptionRate,
                    minimumRedemption: minimumRedemption || loyaltySettings[0].minimumRedemption,
                    pointsExpiryMonths: pointsExpiryMonths || loyaltySettings[0].pointsExpiryMonths,
                    enabled: enabled !== undefined ? enabled : loyaltySettings[0].enabled
                })
                .where(eq(loyaltySettingsTable.storeInfoId, storeInfo[0].id))
                .returning();

            res.status(200).json(updatedSettings[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating loyalty settings' });
        }
    }
} 