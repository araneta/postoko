import { db } from '../db';
import { settingsTable, storeInfoTable, productsTable, customersTable, paymentSettingsTable } from '../db/schema';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import Stripe from 'stripe';
type Product = {
  id: string;
  storeInfoId: number;
  name: string;
  price: number;
  cost: string;
  description: string;
  image: string;
  stock: number;
  minStock: number;
  category: string;
  barcode: string;
  quantity: number;
};

function convertToLineItems(products:Product[]) {
  return products.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        description: item.description,
        images: [item.image],
      },
      unit_amount: item.price, // Stripe expects amount in cents
    },
    quantity: item.quantity || 1,
  }));
}

export default class StripeController {
  // Create checkout session
  
  static async createCheckoutSession(req: Request, res: Response) {
    const auth = getAuth(req);
    console.log('StripeController initialized');
    if (!auth.userId) {
      return res.status(401).send('Unauthorized');
    }

    try {
      // Get storeInfoId for the authenticated user
      const storeInfo = await db.select()
        .from(storeInfoTable)
        .where(eq(storeInfoTable.userId, auth.userId));

      if (storeInfo.length === 0) {
        return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
      }

      const storeInfoId = storeInfo[0].id;

      // Get store info and settings
      const storeSettings = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.storeInfoId, storeInfoId));

      if (storeSettings.length === 0) {
        return res.status(400).json({ message: 'Store settings not found. Please set up your store settings first.' });
      }
      const settingsData = storeSettings[0];
      const [payment] = await db.select().from(paymentSettingsTable).where(eq(paymentSettingsTable.storeInfoId, settingsData.storeInfoId));
      if (!payment.stripeSecretKey) {
        return res.status(400).json({ message: 'Stripe secret key not found. Please set up your Stripe secret key first.' });
      }
      const stripe = new Stripe(payment.stripeSecretKey);

      const linex = convertToLineItems(req.body);
      console.log('linex', linex);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: linex,
        mode: 'payment',
        success_url: 'http://localhost:3000/success.html',
        cancel_url: 'http://localhost:3000/cancel.html',
      });

      res.json({ url: session.url, session_id:session.id }); // preferred: redirect via URL
    } catch (error:any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }


  static async checkSession(req: Request, res: Response) {
    const auth = getAuth(req);
    console.log('check session');
    //const sessionId = req.query.session_id;
	const sessionId = req.params.id;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    if (!auth.userId) {
      return res.status(401).send('Unauthorized');
    }

    try {
      // Get storeInfoId for the authenticated user
      const storeInfo = await db.select()
        .from(storeInfoTable)
        .where(eq(storeInfoTable.userId, auth.userId));

      if (storeInfo.length === 0) {
        return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
      }

      const storeInfoId = storeInfo[0].id;

      // Get store info and settings
      const storeSettings = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.storeInfoId, storeInfoId));

      if (storeSettings.length === 0) {
        return res.status(400).json({ message: 'Store settings not found. Please set up your store settings first.' });
      }
      const settingsData = storeSettings[0];
      const [payment] = await db.select().from(paymentSettingsTable).where(eq(paymentSettingsTable.storeInfoId, settingsData.storeInfoId));
      if (!payment.stripeSecretKey) {
        return res.status(400).json({ message: 'Stripe secret key not found. Please set up your Stripe secret key first.' });
      }
      const stripe = new Stripe(payment.stripeSecretKey);

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json(session);

      
    } catch (error:any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }

    
  }

}
