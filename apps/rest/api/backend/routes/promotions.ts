import { Router } from 'express';
import { PromotionsController } from '../controllers/Promotions.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Promotion:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - discountValue
 *         - startDate
 *         - endDate
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the promotion
 *         storeInfoId:
 *           type: integer
 *           description: Store ID this promotion belongs to
 *         name:
 *           type: string
 *           description: Name of the promotion
 *         description:
 *           type: string
 *           description: Description of the promotion
 *         type:
 *           type: string
 *           enum: [percentage, fixed_amount]
 *           description: Type of discount
 *         discountValue:
 *           type: number
 *           description: Discount value (percentage 0-100 or fixed amount)
 *         minimumPurchase:
 *           type: number
 *           description: Minimum purchase amount required
 *         maximumDiscount:
 *           type: number
 *           description: Maximum discount amount for percentage discounts
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Promotion start date
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Promotion end date
 *         usageLimit:
 *           type: integer
 *           description: Total usage limit (null for unlimited)
 *         customerUsageLimit:
 *           type: integer
 *           description: Per-customer usage limit
 *         isActive:
 *           type: boolean
 *           description: Whether the promotion is active
 *         applicableToCategories:
 *           type: array
 *           items:
 *             type: integer
 *           description: Category IDs this promotion applies to
 *         applicableToProducts:
 *           type: array
 *           items:
 *             type: string
 *           description: Product IDs this promotion applies to
 *         discountCodes:
 *           type: array
 *           items:
 *             type: string
 *           description: Discount codes for this promotion
 */

/**
 * @swagger
 * /api/promotions/detail/{id}:
 *   get:
 *     summary: Get promotion by ID
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promotion'
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.get('/detail/:id', PromotionsController.getPromotionById);

/**
 * @swagger
 * /api/promotions/validate-code:
 *   post:
 *     summary: Validate and calculate discount for a discount code
 *     tags: [Promotions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - storeInfoId
 *               - orderItems
 *             properties:
 *               code:
 *                 type: string
 *                 description: Discount code to validate
 *               storeInfoId:
 *                 type: integer
 *                 description: Store ID
 *               customerId:
 *                 type: string
 *                 description: Customer ID (optional)
 *               orderItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Discount code validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 promotion:
 *                   $ref: '#/components/schemas/Promotion'
 *                 discountAmount:
 *                   type: number
 *                 eligibleItems:
 *                   type: array
 *       400:
 *         description: Invalid discount code or requirements not met
 *       404:
 *         description: Discount code not found
 *       500:
 *         description: Server error
 */
router.post('/validate-code', PromotionsController.validateDiscountCode);

/**
 * @swagger
 * /api/promotions/detail/{id}:
 *   put:
 *     summary: Update a promotion
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       200:
 *         description: Promotion updated successfully
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.put('/detail/:id', PromotionsController.updatePromotion);

/**
 * @swagger
 * /api/promotions/detail/{id}:
 *   delete:
 *     summary: Delete a promotion
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion deleted successfully
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.delete('/detail/:id', PromotionsController.deletePromotion);

/**
 * @swagger
 * /api/promotions/stats/{id}:
 *   get:
 *     summary: Get promotion usage statistics
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promotion:
 *                   $ref: '#/components/schemas/Promotion'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsage:
 *                       type: integer
 *                     totalDiscount:
 *                       type: number
 *                     uniqueCustomers:
 *                       type: integer
 *                     remainingUsage:
 *                       type: integer
 *       404:
 *         description: Promotion not found
 *       500:
 *         description: Server error
 */
router.get('/stats/:id', PromotionsController.getPromotionStats);

/**
 * @swagger
 * /api/promotions/{storeInfoId}:
 *   post:
 *     summary: Create a new promotion
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: storeInfoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       201:
 *         description: Promotion created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/:storeInfoId', PromotionsController.createPromotion);

/**
 * @swagger
 * /api/promotions/{storeInfoId}:
 *   get:
 *     summary: Get all promotions for a store
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: storeInfoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter for active promotions only
 *     responses:
 *       200:
 *         description: List of promotions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Promotion'
 *       500:
 *         description: Server error
 */
router.get('/:storeInfoId', PromotionsController.getPromotions);

export default router;
