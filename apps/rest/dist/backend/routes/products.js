import express from 'express';
import ProductsController from '../controllers/Products';
import { requireAuth } from '@clerk/express';
const router = express.Router();
router.get('', requireAuth(), ProductsController.getProducts);
router.post('', requireAuth(), ProductsController.createProduct);
router.put('/:id', requireAuth(), ProductsController.updateProduct);
export default router;
