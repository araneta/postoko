import express from 'express';
import PaymentsController from '../controllers/Payments';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.post('/create-intent',requireAuth(), PaymentsController.createIntent);
router.post('/confirm',requireAuth(), PaymentsController.confirm);
router.post('/process-card',requireAuth(), PaymentsController.processCard);
router.post('/process-wallet',requireAuth(), PaymentsController.processWallet);

export default router;
