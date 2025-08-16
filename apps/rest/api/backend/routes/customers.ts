import express from 'express';
import CustomersController from '../controllers/Customers';
import { requireAuth } from '@clerk/express';
const router = express.Router();

router.get('', requireAuth(), CustomersController.getCustomers);
router.post('', requireAuth(), CustomersController.createCustomer);
router.put('/:id', requireAuth(), CustomersController.updateCustomer);
router.get('/:id/purchases', requireAuth(), CustomersController.getCustomerPurchases);
router.delete('/:id', requireAuth(), CustomersController.deleteCustomer);

export default router; 