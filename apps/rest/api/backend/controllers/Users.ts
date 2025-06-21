import { Request, Response } from 'express';
import {  getAuth } from '@clerk/express';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default class UsersController {
    static async login(req: Request, res: Response) {
        const { email, clerkUserId } = req.body;
        const user = await db.select()
        .from(usersTable).where(eq(usersTable.email, email));
        if (user.length === 0) {
            //create user
            const newUser = await db.insert(usersTable).values({
                email: email,
                id: randomUUID(),
                name: email
            });
            res.status(200).json(newUser);
        }else{
            res.status(200).json(user);
        }
        
    }
}