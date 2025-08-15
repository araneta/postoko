import express from 'express';
import LoyaltyPointsController from '../controllers/LoyaltyPoints';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// Customer loyalty points routes
router.get('/customers/:customerId/points', requireAuth(), LoyaltyPointsController.getCustomerPoints);
router.get('/customers/:customerId/transactions', requireAuth(), LoyaltyPointsController.getCustomerTransactions);
router.post('/earn', requireAuth(), LoyaltyPointsController.earnPoints);
router.post('/redeem', requireAuth(), LoyaltyPointsController.redeemPoints);

// Store loyalty settings routes
router.get('/settings', requireAuth(), LoyaltyPointsController.getLoyaltySettings);
router.put('/settings', requireAuth(), LoyaltyPointsController.updateLoyaltySettings);

export default router; 