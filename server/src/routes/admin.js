import { Router } from 'express';
import {
  changeMyPassword,
  createBarista,
  listBaristas,
  updateBaristaStatus,
  salesTrend,
  bestSellers,
} from '../controllers/adminController.js';

const router = Router();

router.patch('/me/password', changeMyPassword);
router.post('/baristas', createBarista);
router.get('/baristas', listBaristas);
router.patch('/baristas/:id/status', updateBaristaStatus);

router.get('/analytics/sales-trend', salesTrend);
router.get('/analytics/best-sellers', bestSellers);

export default router;
