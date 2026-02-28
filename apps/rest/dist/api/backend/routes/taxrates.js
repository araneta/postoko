import express from 'express';
import TaxRatesController from '../controllers/TaxRates.js';
import { requireAuth } from '@clerk/express';
const router = express.Router();
/**
 * @swagger
 * /api/tax-rates:
 *   get:
 *     summary: Get all tax rates for store
 *     tags: [Tax Rates]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of tax rates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaxRate'
 *       400:
 *         description: Store information not found
 *       401:
 *         description: Unauthorized
 */
router.get('', requireAuth(), TaxRatesController.getTaxRates);
/**
 * @swagger
 * /api/tax-rates:
 *   post:
 *     summary: Create a new tax rate
 *     tags: [Tax Rates]
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - rate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "VAT"
 *               rate:
 *                 type: number
 *                 example: 10.00
 *                 description: Tax rate percentage (0-100)
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tax rate created successfully
 *       400:
 *         description: Missing required fields or invalid rate
 *       401:
 *         description: Unauthorized
 */
router.post('', requireAuth(), TaxRatesController.createTaxRate);
/**
 * @swagger
 * /api/tax-rates/{id}:
 *   get:
 *     summary: Get tax rate by ID
 *     tags: [Tax Rates]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tax Rate ID
 *     responses:
 *       200:
 *         description: Tax rate details
 *       404:
 *         description: Tax rate not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', requireAuth(), TaxRatesController.getTaxRateById);
/**
 * @swagger
 * /api/tax-rates/{id}:
 *   put:
 *     summary: Update a tax rate
 *     tags: [Tax Rates]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tax Rate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rate:
 *                 type: number
 *               isDefault:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tax rate updated successfully
 *       404:
 *         description: Tax rate not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', requireAuth(), TaxRatesController.updateTaxRate);
/**
 * @swagger
 * /api/tax-rates/{id}:
 *   delete:
 *     summary: Delete a tax rate
 *     tags: [Tax Rates]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tax Rate ID
 *     responses:
 *       200:
 *         description: Tax rate deleted successfully
 *       409:
 *         description: Cannot delete - tax rate is being used by products
 *       404:
 *         description: Tax rate not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', requireAuth(), TaxRatesController.deleteTaxRate);
/**
 * @swagger
 * /api/tax-rates/default/get:
 *   get:
 *     summary: Get default tax rate for store
 *     tags: [Tax Rates]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Default tax rate
 *       400:
 *         description: Store information not found
 *       401:
 *         description: Unauthorized
 */
router.get('/default/get', requireAuth(), TaxRatesController.getDefaultTaxRate);
/**
 * @swagger
 * /api/tax-rates/product/assign:
 *   post:
 *     summary: Assign tax rate to product
 *     tags: [Tax Rates]
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
 *               - taxRateId
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "uuid"
 *               taxRateId:
 *                 type: integer
 *                 example: 1
 *               isTaxable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tax rate assigned to product successfully
 *       404:
 *         description: Product or tax rate not found
 *       403:
 *         description: Unauthorized - product does not belong to your store
 *       401:
 *         description: Unauthorized
 */
router.post('/product/assign', requireAuth(), TaxRatesController.assignTaxRateToProduct);
export default router;
