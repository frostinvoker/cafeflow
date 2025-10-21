// Routes for Checkout CRUD
import { Router } from 'express';
import {
  listCheckouts,
  getCheckout,
  createCheckout,
  updateCheckout,
  deleteCheckout
} from '../controllers/checkoutController.js';

const router = Router();

router.get('/', listCheckouts);
router.get('/:id', getCheckout);
router.post('/', createCheckout);
router.put('/:id', updateCheckout);
router.delete('/:id', deleteCheckout);

export default router;

