import { Request, Response } from 'express';
import {  getAuth } from '@clerk/express';
import { db } from '../db';
import { productsTable } from '../db/schema';

export default class ProductsController {
    static async getProducts(req: Request, res: Response) {
        const auth = getAuth(req);

        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            const products = await db.select().from(productsTable);
            res.status(200).json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    }
}