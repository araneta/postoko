import express from 'express';
import EmployeesController from '../controllers/Employees';
import { requireAuth } from '@clerk/express';
const router = express.Router();

router.get('', requireAuth(), EmployeesController.getEmployees);
router.post('/:id/validate-pin', requireAuth(), EmployeesController.validateEmployeePin);
router.post('', requireAuth(), EmployeesController.createEmployee);
router.put('/:id', requireAuth(), EmployeesController.updateEmployee);
router.delete('/:id', requireAuth(), EmployeesController.deleteEmployee);

// Sales tracking routes
router.get('/sales', requireAuth(), EmployeesController.getEmployeeSales);
router.get('/sales/performance', requireAuth(), EmployeesController.getEmployeePerformanceComparison);
router.get('/:id/sales', requireAuth(), EmployeesController.getEmployeeSalesDetails);

export default router; 