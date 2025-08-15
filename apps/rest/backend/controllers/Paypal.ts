import { db } from '../db';
import { settingsTable, storeInfoTable, paymentSettingsTable, currenciesTable } from '../db/schema';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq } from 'drizzle-orm';
import paypal from '@paypal/checkout-server-sdk';

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

function convertToPaypalItems(products: Product[], currencyCode: string) {
  // Import the Category enum from PayPal SDK if available, otherwise use the correct string literal type
  // For most SDKs, valid values are 'PHYSICAL_GOODS' or 'DIGITAL_GOODS'
  return products.map(item => ({
    name: item.name,
    unit_amount: {
      currency_code: currencyCode,
      value: (item.price / 100).toFixed(2), // Convert cents to dollars
    },
    quantity: String(item.quantity || 1),
    category: 'PHYSICAL_GOODS' as 'PHYSICAL_GOODS' | 'DIGITAL_GOODS', // Cast to the correct type
    description: item.description ?? undefined,
    sku: item.barcode ?? undefined,
  }));
}

export default class PaypalController {
  // Create checkout session
  static async createCheckoutSession(req: Request, res: Response) {
    const auth = getAuth(req);
    console.log('PaypalController initialized');
    if (!auth.userId) {
      return res.status(401).send('Unauthorized');
    }

    try {
      // Get store info
      const storeInfo = await db.select()
        .from(storeInfoTable)
        .where(eq(storeInfoTable.userId, auth.userId));

      if (storeInfo.length === 0) {
        return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
      }

      const storeInfoId = storeInfo[0].id;

      // Get store settings
      const storeSettings = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.storeInfoId, storeInfoId));

      if (storeSettings.length === 0) {
        return res.status(400).json({ message: 'Store settings not found. Please set up your store settings first.' });
      }
      const settingsData = storeSettings[0];

      const [currency] = await db.select().from(currenciesTable).where(eq(currenciesTable.code, settingsData.currencyCode));

      // Get payment settings (PayPal)
      const [payment] = await db.select()
        .from(paymentSettingsTable)
        .where(eq(paymentSettingsTable.storeInfoId, settingsData.storeInfoId ?? 0));

      if (!payment.paypalClientId || !payment.paypalClientSecret) {
        return res.status(400).json({ message: 'PayPal client credentials not found. Please set up your PayPal settings first.' });
      }

      // PayPal environment setup
      const environment = new paypal.core.SandboxEnvironment(
        payment.paypalClientId,
        payment.paypalClientSecret
      );
      const client = new paypal.core.PayPalHttpClient(environment);

      // Convert cart items
      const paypalItems = convertToPaypalItems(req.body, currency.code);

      // Calculate total
      const totalAmount = paypalItems.reduce(
        (sum, item) => sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity, 10),
        0
      );

      // Create order
      const requestOrder = new paypal.orders.OrdersCreateRequest();
      requestOrder.prefer('return=representation');
      requestOrder.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.code,
              value: totalAmount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: currency.code,
                  value: totalAmount.toFixed(2),
                },
                discount: {
                  currency_code: currency.code,
                  value: '0.00',
                },
                handling: {
                  currency_code: currency.code,
                  value: '0.00',
                },
                insurance: {
                  currency_code: currency.code,
                  value: '0.00',
                },
                shipping: {
                  currency_code: currency.code,
                  value: '0.00',
                },
                shipping_discount: {
                  currency_code: currency.code,
                  value: '0.00',
                },
                tax_total: {
                  currency_code: currency.code,
                  value: '0.00',
                },
              },
            },
            items: paypalItems,
          },
        ],
        application_context: {
          brand_name: storeInfo[0].name,
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: 'http://localhost:3000/success.html',
          cancel_url: 'http://localhost:3000/cancel.html',
        },
      });

      const order = await client.execute(requestOrder);

      // Find approval URL
      const approvalUrl = order.result.links.find((link: { rel: string; href: string }) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        return res.status(500).json({ message: 'Unable to generate PayPal approval URL' });
      }

      res.json({ url: approvalUrl, order_id: order.result.id });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }

  // Check session (order details)
  static async checkSession(req: Request, res: Response) {
    const auth = getAuth(req);
    console.log('Paypal check session');
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    if (!auth.userId) {
      return res.status(401).send('Unauthorized');
    }

    try {
      // Get store info
      const storeInfo = await db.select()
        .from(storeInfoTable)
        .where(eq(storeInfoTable.userId, auth.userId));

      if (storeInfo.length === 0) {
        return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
      }

      const storeInfoId = storeInfo[0].id;

      // Get payment settings
      const storeSettings = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.storeInfoId, storeInfoId));

      const settingsData = storeSettings[0];
      const [payment] = await db.select()
        .from(paymentSettingsTable)
        .where(eq(paymentSettingsTable.storeInfoId, settingsData.storeInfoId ?? 0));

      if (!payment.paypalClientId || !payment.paypalClientSecret) {
        return res.status(400).json({ message: 'PayPal client credentials not found. Please set up your PayPal settings first.' });
      }

      const environment = new paypal.core.SandboxEnvironment(
        payment.paypalClientId,
        payment.paypalClientSecret
      );
      const client = new paypal.core.PayPalHttpClient(environment);

      const requestGetOrder = new paypal.orders.OrdersGetRequest(orderId);
      const order = await client.execute(requestGetOrder);

      res.json(order.result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
}
