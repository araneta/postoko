import express from 'express';
import stripeController from '../controllers/Stripe';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.post('/create-checkout-session', requireAuth(), stripeController.createCheckoutSession);

export default router;
