import express from 'express';
import LoyaltyPointsController from '../controllers/LoyaltyPoints';
import { requireAuth } from '@clerk/express';

const router = express.Router();

/**
 * @swagger
 * /api/loyalty/customers/{customerId}/points:
 *   get:
 *     summary: Get customer loyalty points
 *     tags: [Loyalty]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer loyalty points
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer_id:
 *                   type: string
 *                 total_points:
 *                   type: number
 *                 available_points:
 *                   type: number
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 */
router.get('/customers/:customerId/points', requireAuth(), LoyaltyPointsController.getCustomerPoints);

/**
 * @swagger
 * /api/loyalty/customers/{customerId}/transactions:
 *   get:
 *     summary: Get customer loyalty transactions
 *     tags: [Loyalty]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer loyalty transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [earned, redeemed]
 *                   points:
 *                     type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/customers/:customerId/transactions', requireAuth(), LoyaltyPointsController.getCustomerTransactions);

/**
 * @swagger
 * /api/loyalty/earn:
 *   post:
 *     summary: Earn loyalty points
 *     tags: [Loyalty]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - points
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: "cust_123"
 *               points:
 *                 type: number
 *                 example: 100
 *               order_id:
 *                 type: string
 *                 example: "order_456"
 *     responses:
 *       200:
 *         description: Points earned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/earn', requireAuth(), LoyaltyPointsController.earnPoints);

/**
 * @swagger
 * /api/loyalty/redeem:
 *   post:
 *     summary: Redeem loyalty points
 *     tags: [Loyalty]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - points
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: "cust_123"
 *               points:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Points redeemed successfully
 *       400:
 *         description: Bad request or insufficient points
 *       401:
 *         description: Unauthorized
 */
router.post('/redeem', requireAuth(), LoyaltyPointsController.redeemPoints);

/**
 * @swagger
 * /api/loyalty/settings:
 *   get:
 *     summary: Get loyalty program settings
 *     tags: [Loyalty]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Loyalty program settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points_per_dollar:
 *                   type: number
 *                 redemption_rate:
 *                   type: number
 *                 minimum_redemption:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', requireAuth(), LoyaltyPointsController.getLoyaltySettings);

/**
 * @swagger
 * /api/loyalty/settings:
 *   put:
 *     summary: Update loyalty program settings
 *     tags: [Loyalty]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points_per_dollar:
 *                 type: number
 *                 example: 1
 *               redemption_rate:
 *                 type: number
 *                 example: 0.01
 *               minimum_redemption:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/settings', requireAuth(), LoyaltyPointsController.updateLoyaltySettings);

export default router; 