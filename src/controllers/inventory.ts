import { RequestHandler } from 'express';
import db, { PrismaPromise } from '../db';
import { validateZodSchema } from '../helpers/validations';
import {
  AddItemLot,
  CreateItem,
  SellItem,
} from '../helpers/validations/inventory';

export const createItem: RequestHandler = async (req, res, next) => {
  const { name, description } = req.body;

  const { errors } = await validateZodSchema(CreateItem, { name, description });
  if (errors) {
    return res.status(400).json(errors);
  }
  const result = await db.item.create({
    data: { name, description },
  });
  res.json(result);
};

export const getItems: RequestHandler = async (req, res) => {
  const result = await db.item.findMany();
  res.json(result);
};

export const addItemLot: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { expiry, quantity } = req.body;

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

  res.json({});
};

export const getItemQuantity: RequestHandler = async (req, res) => {
  const { id } = req.params;

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
  res.json(result);
};

export const sellItems: RequestHandler = async (req, res) => {
  const { id } = req.params;
  let { quantity } = req.body;

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
      message: `Not enough items available for sale. Only ${totalQuantity} ${
        totalQuantity > 1 ? 'items' : 'item'
      } left`,
    });
  }
  const queries: PrismaPromise<any>[] = [];

  for (const lot of lots) {
    const available = lot.quantity;
    const lotQuantityToSell = Math.min(quantity, available);
    queries.push(
      db.lot.update({
        where: { id: lot.id },
        data: { quantity: available - lotQuantityToSell },
      })
    );
    quantity = quantity - lotQuantityToSell;
    if (!quantity) break;
  }
  await db.$transaction(queries);

  res.json({});
};
