import { Router } from 'express';
import {
  changeMyPassword,
  createBarista,
  listBaristas,
  updateBaristaStatus,
} from '../controllers/adminController.js';

const router = Router();

router.patch('/me/password', changeMyPassword);
router.post('/baristas', createBarista);
router.get('/baristas', listBaristas);
router.patch('/baristas/:id/status', updateBaristaStatus);

export default router;
