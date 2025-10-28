// Routes for Inventory CRUD
import { Router } from 'express';
import {
  listInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listLowStockInventory,
} from '../controllers/inventoryController.js';

const router = Router();

router.get('/', listInventory);
router.get('/low-stock', listLowStockInventory);
router.get('/:id', getInventoryItem);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;

