import express from 'express';
import paypalController from '../controllers/Paypal';
import { requireAuth } from '@clerk/express';
const router = express.Router();
router.post('/create-checkout-session', requireAuth(), paypalController.createCheckoutSession);
router.get('/check-session/:id', requireAuth(), paypalController.checkSession);
export default router;
