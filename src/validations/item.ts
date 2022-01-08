import { z } from 'zod';
import db from '../db';

const ID = z.string().uuid();

export const validateItem = async (id: string) => {
  try {
    const validId = await ID.parseAsync(id);
    const item = await db.item.findUnique({ where: { id: validId } });
    if (!item) return 'No inventory item with the given ID found';
    return '';
  } catch (error) {
    return 'The ID parameter must be a valid inventory item ID';
  }
};
