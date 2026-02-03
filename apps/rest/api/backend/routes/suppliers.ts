import express from 'express';
import SuppliersController from '../controllers/Suppliers';
import { requireAuth } from '@clerk/express';
const router = express.Router();

router.get('', requireAuth(), SuppliersController.getSuppliers);
router.post('', requireAuth(), SuppliersController.createSupplier);
router.put('/:id', requireAuth(), SuppliersController.updateSupplier);
router.delete('/:id', requireAuth(), SuppliersController.deleteSupplier);
export default router;