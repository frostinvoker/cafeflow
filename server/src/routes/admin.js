import { Router } from 'express';
import {
    bestSellers,
    changeMyPassword,
    createBarista,
    listBaristas,
    salesTrend,
    updateBaristaStatus,
} from '../controllers/adminController.js';

const router = Router();

router.patch('/me/password', changeMyPassword);
router.post('/baristas', createBarista);
router.get('/baristas', listBaristas);
router.patch('/baristas/:id/status', updateBaristaStatus);

router.get('/analytics/sales-trend', salesTrend);
router.get('/analytics/best-sellers', bestSellers);

export default router;
