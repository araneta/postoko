import express from 'express';
import EmployeesController from '../controllers/Employees';
import { requireAuth } from '@clerk/express';
const router = express.Router();

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized
 */
router.get('', requireAuth(), EmployeesController.getEmployees);

/**
 * @swagger
 * /api/employees/{id}/validate-pin:
 *   post:
 *     summary: Validate employee PIN
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: PIN validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/validate-pin', requireAuth(), EmployeesController.validateEmployeePin);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
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
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.smith@company.com"
 *               role:
 *                 type: string
 *                 example: "cashier"
 *               pin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('', requireAuth(), EmployeesController.createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', requireAuth(), EmployeesController.updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete an employee
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', requireAuth(), EmployeesController.deleteEmployee);

/**
 * @swagger
 * /api/employees/sales:
 *   get:
 *     summary: Get employee sales data
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Employee sales data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: string
 *                   employee_name:
 *                     type: string
 *                   total_sales:
 *                     type: number
 *                   order_count:
 *                     type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/sales', requireAuth(), EmployeesController.getEmployeeSales);

/**
 * @swagger
 * /api/employees/sales/performance:
 *   get:
 *     summary: Get employee performance comparison
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Employee performance comparison data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: string
 *                   performance_score:
 *                     type: number
 *                   ranking:
 *                     type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/sales/performance', requireAuth(), EmployeesController.getEmployeePerformanceComparison);

/**
 * @swagger
 * /api/employees/{id}/sales:
 *   get:
 *     summary: Get specific employee sales details
 *     tags: [Employees]
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee sales details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee_id:
 *                   type: string
 *                 total_sales:
 *                   type: number
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/sales', requireAuth(), EmployeesController.getEmployeeSalesDetails);

export default router; 