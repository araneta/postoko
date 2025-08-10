import { db } from '../db';
import { settingsTable, storeInfoTable, productsTable, customersTable, paymentSettingsTable } from '../db/schema';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import paypal from '@paypal/checkout-server-sdk';
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
function convertToPurchaseUnits(products: Product[]) {
  // Calculate total
  const total = products.reduce((sum, item) => {
    return sum + item.price * (item.quantity ?? 1);
  }, 0);

  // Map products to PayPal item format
  const items = products.map(item => ({
    name: item.name,
    description: item.description,
    unit_amount: {
      currency_code: 'USD',
      value: item.price.toFixed(2), // PayPal expects string, 2 decimal places
    },
    quantity: String(item.quantity ?? 1),
  }));

  return [{
    amount: {
      currency_code: 'USD',
      value: total.toFixed(2),
      breakdown: {
        item_total: {
          currency_code: 'USD',
          value: total.toFixed(2),
        },
      },
    },
    items,
  }];
}

export default class PaypalController {
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
      if (!payment.paypalClientId || !payment.paypalClientSecret) {
        return res.status(400).json({ message: 'Paypal client id or paypal client secret key not found. Please set up your Paypal config first.' });
      }
      const environment = new paypal.core.SandboxEnvironment(payment.paypalClientId, payment.paypalClientSecret);
      const paypalClient = await new paypal.core.PayPalHttpClient(environment);
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: convertToPurchaseUnits(req.body),
      });

      const response = await paypalClient.execute(request);
      res.json({ result: response.result });


    } catch (error: any) {
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


    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }


  }

}