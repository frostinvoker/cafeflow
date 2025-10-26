import { Router } from 'express';
import {
  listMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuItemController.js';

const router = Router();

router.get('/', listMenuItems);
router.get('/:id', getMenuItem);
router.post('/', createMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;

