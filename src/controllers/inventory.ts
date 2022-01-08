import { Request, Response } from 'express';
import db, { PrismaPromise, Lot } from '../db';
import { validateZodSchema } from '../validations';
import { AddItemLot, CreateItem, SellItem } from '../validations/inventory';
import { validateItem } from '../validations/item';

export const createItem = async (req: Request, res: Response) => {
  const { name } = req.body;

  const { errors } = await validateZodSchema(CreateItem, { name });
  if (errors) {
    return res.status(400).json(errors);
  }
  const result = await db.item.create({
    data: { name },
  });
  return res.json(result);
};

export const getItems = async (_req: Request, res: Response) => {
  const result = await db.item.findMany();
  return res.json(result);
};

export const addItemLot = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { expiry, quantity } = req.body;
  const itemError = await validateItem(id);
  if (itemError) {
    return res.status(400).json({ message: itemError });
  }

  const { errors, values } = await validateZodSchema(AddItemLot, {
    expiry,
    quantity,
  });

  if (!values) {
    return res.status(400).json(errors);
  }

  const validTill = new Date(values.expiry);
  await db.lot.create({
    data: {
      validTill,
      quantity: values.quantity,
      item: {
        connect: { id },
      },
    },
  });

  return res.json({});
};

export const getItemQuantity = async (req: Request, res: Response) => {
  const { id } = req.params;

  const itemError = await validateItem(id);
  if (itemError) {
    return res.status(400).json({ message: itemError });
  }

  const now = new Date();
  const lots = await db.lot.findMany({
    where: { itemId: id, validTill: { gt: now }, quantity: { gt: 0 } },
    orderBy: {
      validTill: 'asc',
    },
  });
  let result: {
    quantity: number;
    validTill: number | null;
  };

  if (!lots.length) {
    result = {
      quantity: 0,
      validTill: null,
    };
    return res.json(result);
  }

  result = lots.reduce(
    (prev, curr) => {
      const prevValidity = new Date(prev.validTill).getTime();
      const currValidity = new Date(curr.validTill).getTime();
      return {
        quantity: prev.quantity + curr.quantity,
        validTill: Math.min(prevValidity, currValidity),
      };
    },
    { quantity: 0, validTill: new Date(lots[0].validTill).getTime() }
  );
  return res.json(result);
};

export const sellItems = async (req: Request, res: Response) => {
  const { id } = req.params;
  let { quantity } = req.body;

  const itemError = await validateItem(id);
  if (itemError) {
    return res.status(400).json({ message: itemError });
  }

  const { errors } = await validateZodSchema(SellItem, { quantity });
  if (errors) {
    return res.status(400).json(errors);
  }
  const now = new Date();

  const [lots, aggregate] = await Promise.all([
    db.lot.findMany({
      where: { itemId: id, validTill: { gt: now }, quantity: { gt: 0 } },
      orderBy: {
        validTill: 'asc',
      },
      select: {
        quantity: true,
        id: true,
      },
    }),
    db.lot.aggregate({
      where: { itemId: id, validTill: { gt: now }, quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
  ]);
  const totalQuantity = aggregate._sum.quantity || 0;

  if (quantity > totalQuantity) {
    return res.status(400).json({
      message: `Not enough items available for sale. Only ${totalQuantity} item(s) left`,
    });
  }
  const queries: PrismaPromise<Lot>[] = [];

  for (const lot of lots) {
    const available = lot.quantity;
    const lotQuantityToSell = Math.min(quantity, available);

    queries.push(
      db.lot.update({
        where: { id: lot.id },
        data: { quantity: { decrement: lotQuantityToSell } },
      })
    );
    quantity = quantity - lotQuantityToSell;
    if (!quantity) break;
  }
  await db.$transaction(queries);

  return res.json({});
};

export const cleanup = async () => {
  const now = new Date();
  const [count] = await Promise.all([
    db.lot.count({ where: { validTill: { lt: now } } }),
    db.lot.deleteMany({ where: { validTill: { lt: now } } }),
  ]);
  // eslint-disable-next-line no-console
  console.log('Deleted %d expired inventories', count);
};
