import { Router } from 'express';
import {
  addItemLot,
  createItem,
  getItemQuantity,
  getItems,
  sellItems,
} from '../controllers/inventory';
import { tryCatch } from '../try-catch';

const router = Router();

router.post('/:id/add', tryCatch(addItemLot));
router.get('/:id/quantity', tryCatch(getItemQuantity));
router.post('/:id/sell', tryCatch(sellItems));
router.get('/', tryCatch(getItems));
router.post('/', tryCatch(createItem));

export default router;
