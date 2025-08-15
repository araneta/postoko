import express from 'express';
import EmployeesController from '../controllers/Employees';
import { requireAuth } from '@clerk/express';
const router = express.Router();

router.get('', requireAuth(), EmployeesController.getEmployees);
router.post('', requireAuth(), EmployeesController.createEmployee);
router.put('/:id', requireAuth(), EmployeesController.updateEmployee);
router.delete('/:id', requireAuth(), EmployeesController.deleteEmployee);

export default router; 