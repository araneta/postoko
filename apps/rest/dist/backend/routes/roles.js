import express from 'express';
import { RolesController } from '../controllers/Employees';
import { requireAuth } from '@clerk/express';
const router = express.Router();
router.get('', requireAuth(), RolesController.getRoles);
router.get('/seed-default', RolesController.seedDefaultRoles);
router.get('/promote-me-admin', requireAuth(), RolesController.promoteMeAdmin);
export default router;
