import { db } from '../db';
import { productsTable } from '../db/schema';
import { Request, Response } from 'express';

export default class ProductsController {
    static async getProducts(req: Request, res: Response) {
        try {
            const products = await db.select().from(productsTable);
            res.status(200).json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    }
}