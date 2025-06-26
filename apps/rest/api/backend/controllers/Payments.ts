import { Request, Response } from 'express';
import Stripe from 'stripe';
// Get decimal multiplier for currency (for Stripe API)
const getCurrencyMultiplier = (currency) => {
  // Zero-decimal currencies (no cents)
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'ISK', 'BIF', 'DJF', 'GNF', 'KMF', 'MGA', 'PAB', 'STD', 'VUV', 'XAF', 'XOF', 'XPF'];
  
  const currencyCode = currency.toUpperCase();
  return zeroDecimalCurrencies.includes(currencyCode) ? 1 : 100;
};
export default class PaymentsController{
	

    static async  createIntent(req: Request, res: Response){
        try {
            const { amount, currency = 'usd', config } = req.body;
        
            if (!amount || amount <= 0) {
              return res.status(400).json({ error: 'Invalid amount' });
            }
        
            if (!config || !config.enabled) {
              return res.status(400).json({ error: 'Payment processing is not enabled' });
            }
			const stripe = new Stripe(config.stripeSecretKey);
			const multiplier = getCurrencyMultiplier(currency);
			console.log('amount',amount);
            // Create payment intent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(amount * multiplier), // Convert to smallest currency unit
              currency: currency,
              automatic_payment_methods: {
                enabled: true,
              },
            });
        
            res.json({
              id: paymentIntent.id,
              amount: paymentIntent.amount / multiplier, // Convert back to original unit
              currency: paymentIntent.currency,
              status: paymentIntent.status,
              client_secret: paymentIntent.client_secret,
            });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ error: 'Failed to create payment intent: '+error.raw.message });
        }
    }
    
    static async confirm(req: Request, res: Response){
		try {
			const { paymentIntentId, paymentMethodId, config, currency = 'usd' } = req.body;

			if (!paymentIntentId) {
			  return res.status(400).json({ error: 'Payment intent ID is required' });
			}

			if (!config || !config.enabled) {
			  return res.status(400).json({ error: 'Payment processing is not enabled' });
			}

			const stripe = new Stripe(config.stripeSecretKey);
			const multiplier = getCurrencyMultiplier(currency);
			// Confirm the payment intent
			const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
			  payment_method: paymentMethodId,
			});

			res.json({
			  id: paymentIntent.id,
			  status: paymentIntent.status,
			  amount: paymentIntent.amount / multiplier, // Convert back to original unit
			  currency: paymentIntent.currency,
			});
		} catch (error) {
			console.error('Error confirming payment:', error);
			res.status(500).json({ error: 'Failed to confirm payment: '+error.raw.message  });
		}
	}
	
	static async processCard(req:Request, res:Response){
		try {
			const { cardNumber, expiryMonth, expiryYear, cvc, amount, config, currency = 'usd' } = req.body;

			// Basic validation
			if (!cardNumber || !expiryMonth || !expiryYear || !cvc || !amount) {
			  return res.status(400).json({ error: 'Missing required fields' });
			}

			if (!config || !config.enabled) {
			  return res.status(400).json({ error: 'Payment processing is not enabled' });
			}

			const stripe = new Stripe(config.stripeSecretKey);
			const multiplier = getCurrencyMultiplier(currency);
			
			// In a real implementation, you would use Stripe's payment methods API
			// For demo purposes, we'll simulate a successful payment
			const paymentIntent = await stripe.paymentIntents.create({
			  amount: Math.round(amount * multiplier),
			  currency: currency,
			  payment_method_data: {
				type: 'card',
				card: {
				  number: cardNumber,
				  exp_month: expiryMonth,
				  exp_year: expiryYear,
				  cvc: cvc,
				},
			  },
			  confirm: true,
			});

			res.json({
			  success: true,
			  transactionId: paymentIntent.id,
			  amount: paymentIntent.amount  / multiplier,
			  status: paymentIntent.status,
			  cardLast4: cardNumber.slice(-4),
			});
		} catch (error) {
			console.error('Error processing card payment:', error);
			res.status(500).json({ error: 'Payment processing failed: '+error.raw.message  });
		}
	}
	
	static async processWallet(req:Request, res:Response){
		try {
			const { walletType, amount, config, currency = 'usd' } = req.body;

			if (!walletType || !amount) {
			  return res.status(400).json({ error: 'Missing required fields' });
			}

			if (!config || !config.enabled) {
			  return res.status(400).json({ error: 'Payment processing is not enabled' });
			}

			const stripe = new Stripe(config.stripeSecretKey);
			const multiplier = getCurrencyMultiplier(currency);
			
			// In a real implementation, you would integrate with the specific wallet
			// For demo purposes, we'll simulate a successful payment
			const paymentIntent = await stripe.paymentIntents.create({
			  amount: Math.round(amount * multiplier),
			  currency: currency,
			  payment_method_types: ['card'], // Digital wallets typically use card networks
			  confirm: true,
			});

			res.json({
			  success: true,
			  transactionId: paymentIntent.id,
			  amount: paymentIntent.amount / multiplier,
			  status: paymentIntent.status,
			  walletType: walletType,
			});
		} catch (error) {
			console.error('Error processing wallet payment:', error);
			res.status(500).json({ error: 'Wallet payment processing failed: '+error.raw.message  });
		}
	}
}
