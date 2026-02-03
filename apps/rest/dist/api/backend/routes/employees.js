import express from 'express';
import EmployeesController from '../controllers/Employees.js';
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
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, today]
 *           default: month
 *         description: Time period for sales data
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by specific employee ID (optional)
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
 *                   employeeId:
 *                     type: string
 *                   employeeName:
 *                     type: string
 *                   employeeRole:
 *                     type: string
 *                   totalSales:
 *                     type: number
 *                   orderCount:
 *                     type: number
 *                   averageOrderValue:
 *                     type: number
 *                   totalProfit:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
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
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, today]
 *           default: month
 *         description: Time period for performance comparison
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
 *                   employeeId:
 *                     type: string
 *                   employeeName:
 *                     type: string
 *                   employeeRole:
 *                     type: string
 *                   totalSales:
 *                     type: number
 *                   orderCount:
 *                     type: number
 *                   averageOrderValue:
 *                     type: number
 *                   totalProfit:
 *                     type: number
 *                   profitMargin:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
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
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, today]
 *           default: month
 *         description: Time period for sales details
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of sales records to return
 *     responses:
 *       200:
 *         description: Employee sales details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 sales:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                       total:
 *                         type: number
 *                       date:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *                       itemCount:
 *                         type: number
 *                       profit:
 *                         type: number
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
 */
router.get('/:id/sales', requireAuth(), EmployeesController.getEmployeeSalesDetails);
export default router;
