import express from 'express';
import stripeController from '../controllers/Stripe';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.post('/create-checkout-session', requireAuth(), stripeController.createCheckoutSession);
router.get('/check-session', requireAuth(), stripeController.checkSession);

export default router;
