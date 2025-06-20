import { db } from '../db';
import { ordersTable } from '../db/schema';
import { Request, Response } from 'express';

export default class OrdersController {
    static async getOrders(req: Request, res: Response) {
        try {
            const orders = await db.select().from(ordersTable);
            res.status(200).json(orders);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching orders' });
        }
    }
}