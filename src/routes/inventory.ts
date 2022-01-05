import { Router } from 'express';
import {
  addItemLot,
  createItem,
  getItemQuantity,
  getItems,
  sellItems,
} from '../controllers/inventory';
import { tryCatch } from '../helpers/try-catch';
import { validId } from '../middleware/validate';

const router = Router();

router.post('/:id/add', validId, tryCatch(addItemLot));
router.get('/:id/quantity', validId, tryCatch(getItemQuantity));
router.post('/:id/sell', validId, tryCatch(sellItems));
router.get('/', tryCatch(getItems));
router.post('/', tryCatch(createItem));

export default router;
