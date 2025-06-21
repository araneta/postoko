import { Request, Response } from 'express';
import {  getAuth,clerkClient } from '@clerk/express';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default class UsersController {
    static async login(req: Request, res: Response) {
        //const { email } = req.body;
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const userId = auth.userId;
        console.log('userId',userId);
        const clerkuser = await clerkClient.users.getUser(userId);
        console.log('user',clerkuser);
        const emails = clerkuser.emailAddresses;
        if(emails.length === 0){
            return res.status(401).send('Unauthorized');
        }
        const email = emails[0].emailAddress;

        const user = await db.select()
        .from(usersTable).where(eq(usersTable.email, email));
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