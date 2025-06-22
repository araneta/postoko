import express from 'express';
import ProductsController from '../controllers/Products';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.get('',requireAuth(), ProductsController.getProducts);
router.post('', requireAuth(), ProductsController.createProduct);

export default router;