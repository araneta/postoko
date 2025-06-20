import express from 'express';
import ProductsController from '../controllers/Products';
const router = express.Router();


router.get('', ProductsController.getProducts);

export default router;