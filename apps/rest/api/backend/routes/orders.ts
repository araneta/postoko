import express from 'express';
import ordersController from '../controllers/Orders';
import { requireAuth } from '@clerk/express';
const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('', requireAuth(),ordersController.getOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
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
 *               - items
 *               - total
 *             properties:
 *               customer_id:
 *                 type: string
 *                 example: "cust_123"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       example: "prod_456"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     price:
 *                       type: number
 *                       example: 99.99
 *               total:
 *                 type: number
 *                 example: 199.98
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, cancelled]
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('', requireAuth(), ordersController.createOrder);

/**
 * @swagger
 * /api/orders/analytics:
 *   get:
 *     summary: Get order analytics
 *     tags: [Orders]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Order analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_orders:
 *                   type: number
 *                 total_revenue:
 *                   type: number
 *                 average_order_value:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', requireAuth(), ordersController.getAnalytics);

/**
 * @swagger
 * /api/orders/reports:
 *   get:
 *     summary: Get sales reports
 *     tags: [Orders]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Sales report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 daily_sales:
 *                   type: array
 *                   items:
 *                     type: object
 *                 monthly_sales:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/reports', requireAuth(), ordersController.getSalesReport);

/**
 * @swagger
 * /api/orders/best-sellers:
 *   get:
 *     summary: Get best selling products
 *     tags: [Orders]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of best selling products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product_id:
 *                     type: string
 *                   product_name:
 *                     type: string
 *                   total_sold:
 *                     type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/best-sellers', requireAuth(), ordersController.getBestSellers);

/**
 * @swagger
 * /api/orders/peak-hours:
 *   get:
 *     summary: Get peak hours analytics
 *     tags: [Orders]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Peak hours data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   hour:
 *                     type: number
 *                   order_count:
 *                     type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/peak-hours', requireAuth(), ordersController.getPeakHours);

/**
 * @swagger
 * /api/orders/profit-margin:
 *   get:
 *     summary: Get profit margin analytics
 *     tags: [Orders]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Profit margin data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_profit:
 *                   type: number
 *                 profit_margin_percentage:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/profit-margin', requireAuth(), ordersController.getProfitMargin);

export default router;