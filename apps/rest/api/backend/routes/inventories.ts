import express from 'express';
import InventoriesController from '../controllers/Inventories';
import { requireAuth } from '@clerk/express';

const router = express.Router();

/**
 * @swagger
 * /api/inventory/movements:
 *   post:
 *     summary: Record inventory movement
 *     tags: [Inventory]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - type
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "uuid"
 *               type:
 *                 type: string
 *                 enum: [sale, purchase, adjustment, return]
 *                 example: "sale"
 *               quantity:
 *                 type: integer
 *                 example: -5
 *                 description: Negative for sales, positive for purchases
 *               referenceId:
 *                 type: string
 *                 example: "orderId or purchaseId"
 *     responses:
 *       201:
 *         description: Inventory movement recorded successfully
 *       400:
 *         description: Bad request or insufficient stock
 *       404:
 *         description: Product not found
 *       403:
 *         description: Unauthorized
 *       401:
 *         description: Unauthorized
 */
router.post('/movements', requireAuth(), InventoriesController.recordMovement);

/**
 * @swagger
 * /api/inventory/movements/product/{productId}:
 *   get:
 *     summary: Get inventory movements for a product
 *     tags: [Inventory]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of inventory movements with pagination
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.get('/movements/product/:productId', requireAuth(), InventoriesController.getMovementsByProduct);

/**
 * @swagger
 * /api/inventory/movements:
 *   get:
 *     summary: Get inventory movements for store
 *     tags: [Inventory]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, purchase, adjustment, return]
 *         description: Filter by movement type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of inventory movements with pagination
 *       400:
 *         description: Store information not found
 *       401:
 *         description: Unauthorized
 */
router.get('/movements', requireAuth(), InventoriesController.getMovementsByStore);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Inventory]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of low stock products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lowStockCount:
 *                   type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Store information not found
 *       401:
 *         description: Unauthorized
 */
router.get('/low-stock', requireAuth(), InventoriesController.getLowStockProducts);

/**
 * @swagger
 * /api/inventory/summary:
 *   get:
 *     summary: Get inventory summary for store
 *     tags: [Inventory]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary with stock overview and daily movements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stock:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                     totalQuantity:
 *                       type: integer
 *                     totalValue:
 *                       type: number
 *                     lowStockCount:
 *                       type: integer
 *                     outOfStockCount:
 *                       type: integer
 *                 todayMovements:
 *                   type: object
 *                   properties:
 *                     sales:
 *                       type: integer
 *                     purchases:
 *                       type: integer
 *                     returns:
 *                       type: integer
 *                     adjustments:
 *                       type: integer
 *       400:
 *         description: Store information not found
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', requireAuth(), InventoriesController.getStockSummary);

/**
 * @swagger
 * /api/inventory/adjust:
 *   put:
 *     summary: Adjust stock manually
 *     tags: [Inventory]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - newStock
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "uuid"
 *               newStock:
 *                 type: integer
 *                 example: 100
 *               reason:
 *                 type: string
 *                 example: "Physical inventory count"
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Bad request or store not found
 *       404:
 *         description: Product not found
 *       403:
 *         description: Unauthorized
 *       401:
 *         description: Unauthorized
 */
router.put('/adjust', requireAuth(), InventoriesController.adjustStock);

export default router;