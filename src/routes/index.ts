import { Router } from 'express';
import inventory from './inventory';

const router = Router();

router.use('/inventories', inventory);

export default router;
