import { Request, Response } from 'express';
import {  getAuth,clerkClient } from '@clerk/express';
import { db } from '../db';
import { currenciesTable, employeesTable, paymentSettingsTable, printerSettingsTable, rolesTable, settingsTable, storeInfoTable, usersTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default class UsersController {
    static async login(req: Request, res: Response) {
        //const { email } = req.body;
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try{
			const userId = auth.userId;
			console.log('userId',userId);
			const clerkuser = await clerkClient.users.getUser(userId);
			console.log('user',clerkuser);
			const emails = clerkuser.emailAddresses;
			
			if(emails.length === 0){
				return res.status(401).send('Unauthorized');
			}
			const email = emails[0].emailAddress;
			console.log('searching email',email);
			const user = await db.select()
			.from(usersTable).where(eq(usersTable.id, userId));
			if (user.length === 0) {
				//create user
				const newUser = await db.insert(usersTable).values({
					email: email,
					id: userId,//randomUUID(),
					name: email,
					lastLogin: new Date(),
					lastIp: req.ip
				}).returning();
				res.status(200).json(newUser[0]);
			}else{
				const updatedUser = await db.update(usersTable)
					.set({ 
						lastLogin: new Date(),
						lastIp: req.ip
					 })
					.where(eq(usersTable.email, email))
					.returning();
				res.status(200).json(updatedUser[0]);
			}
			// Get store info and settings
			const settings = await db.select()
				.from(storeInfoTable)
				.leftJoin(settingsTable, eq(storeInfoTable.id, settingsTable.storeInfoId))
				.where(eq(storeInfoTable.userId, auth.userId));
			if(settings.length === 0){
				// Insert dummy store info
				
				const insertedStore = await db.insert(storeInfoTable).values({
					userId: auth.userId,
					name: email,
					address: '123 Demo St',
					phone: '1234567890',
					email: email,
					website: 'www.demostore.com',
					taxId: 'TAX123456'
				}).returning();
				const storeInfoId = insertedStore[0].id;

				// Insert dummy printer
				const insertedPrinter = await db.insert(printerSettingsTable).values({
					type: 'thermal'
				}).returning();
				const printerSettingsId = insertedPrinter[0].id;				

				// Insert dummy payment settings
				await db.insert(paymentSettingsTable).values({
					storeInfoId: storeInfoId,
					stripePublishableKey: '',
					stripeSecretKey: '',
					paypalClientId: '',
					paypalClientSecret: '',
					paymentMethods: JSON.stringify(['cash']),
					enabled: false
				});

				// Insert dummy settings
				await db.insert(settingsTable).values({
					currencyCode: 'USD',
					printerSettingsId: printerSettingsId,
					storeInfoId: storeInfoId
				});
					// Get admin roleId
				const roles = await db.select().from(rolesTable).where(eq(rolesTable.name, 'admin'));
				if (roles.length > 0) {
					const roleId = roles[0].id;
					// Get user info from Clerk
					
					await db.insert(employeesTable).values({
						id: auth.userId,
						storeInfoId,
						name:email,
						email,
						password: '', // Not used with Clerk
						roleId,
					});
				}
				
			}
		} catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching user' });
        }
        
    }

    // Example method showing how to get JWT token from getAuth
    static async getJwtToken(req: Request, res: Response) {
        const auth = getAuth(req);
        
        if (!auth.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Method 1: Get the session token (JWT)
        const jwtToken = auth.sessionClaims?.jti; // JWT ID
        const sessionToken = auth.sessionId; // Session ID
        
        // Method 2: Get the full session token from headers
        const bearerToken = req.headers.authorization?.split(' ')[1];
        
        // Method 3: Access session claims which contain JWT payload
        const sessionClaims = auth.sessionClaims;
        
        res.status(200).json({
            userId: auth.userId,
            jwtToken: jwtToken,
            sessionToken: sessionToken,
            bearerToken: bearerToken,
            sessionClaims: sessionClaims
        });
    }
}
