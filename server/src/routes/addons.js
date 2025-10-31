import { Router } from 'express';
import {
  listAddOns,
  getAddOn,
  createAddOn,
  updateAddOn,
  deleteAddOn
} from '../controllers/addOnController.js';

const router = Router();

router.get('/', listAddOns);
router.get('/:id', getAddOn);
router.post('/', createAddOn);
router.put('/:id', updateAddOn);
router.delete('/:id', deleteAddOn);

export default router;

