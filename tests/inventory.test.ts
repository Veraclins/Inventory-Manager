import db from '../src/db';
import {
  addItemLot,
  getItemQuantity,
  sellItems,
  cleanup,
  createItem,
  getItems,
} from '../src/controllers/inventory';
import { Request, Response } from 'express';

const mockRequest = (
  body?: { [key: string]: any },
  params?: { [key: string]: string }
) => {
  return { body, params };
};
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const randomID = '7550a8ab-c496-4225-bae2-e0f85fd86742';

afterAll(async () => {
  const deleteItems = db.item.deleteMany();
  const deleteLots = db.lot.deleteMany();

  await db.$transaction([deleteLots, deleteItems]);

  await db.$disconnect();
});

describe('Create inventory item handler', () => {
  it('should create a new inventory item', async () => {
    const req = mockRequest({ name: 'A new item' }) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await createItem(req, res);

    expect(status).toHaveBeenCalledTimes(0);
    expect(json).toBeCalledTimes(1);
  });
  it('should fail if no name is supplied', async () => {
    const req = mockRequest({}) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await createItem(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      name: 'An item needs a name for identification',
    });
  });
});

describe('Get inventory items handler', () => {
  it('should return all items', async () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const json = jest.spyOn(res, 'json');
    await getItems(req, res);

    const result = json.mock.calls[0][0];

    expect(result.length).toEqual(1);
  });
});

describe('Add item lot handler', () => {
  it('should add an item lot', async () => {
    const item = await db.item.findFirst();
    const now = Date.now();

    const req = mockRequest(
      { expiry: now + 10000, quantity: 10 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledTimes(0);
    expect(json).toHaveBeenCalledWith({});
  });
  it('should fail if Item ID is invalid', async () => {
    const item = await db.item.findFirst();
    const now = Date.now();

    const req = mockRequest(
      { expiry: now + 10000, quantity: 10 },
      { id: (item?.id || '') + 'extra' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: 'The ID parameter must be a valid inventory item ID',
    });
  });
  it('should fail if Item is not in the DB', async () => {
    const now = Date.now();

    const req = mockRequest(
      { expiry: now + 10000, quantity: 10 },
      { id: randomID }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: 'No inventory item with the given ID found',
    });
  });
  it('should fail if quantity is not provided', async () => {
    const item = await db.item.findFirst();
    const now = Date.now();

    const req = mockRequest(
      { expiry: now + 10000 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      quantity: 'You must provide the quantity of items',
    });
  });
  it('should fail if quantity is not a number', async () => {
    const item = await db.item.findFirst();
    const now = Date.now();

    const req = mockRequest(
      { expiry: now + 10000, quantity: 'love' },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      quantity: 'Quantity must be a whole number',
    });
  });
  it('should fail if quantity is not a positive number', async () => {
    const item = await db.item.findFirst();
    const now = Date.now();

    const req = mockRequest(
      { expiry: now + 10000, quantity: -10 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      quantity: 'Quantity must be a positive whole number',
    });
  });
  it('should fail if expiry time is not provided', async () => {
    const item = await db.item.findFirst();
    const req = mockRequest(
      { quantity: 100 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      expiry: 'You must provide the expiry time',
    });
  });
  it('should fail if expiry time is not a number', async () => {
    const item = await db.item.findFirst();

    const req = mockRequest(
      { expiry: 'string', quantity: 20 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      expiry: 'Expiry time must be a whole number',
    });
  });
  it('should fail if expiry time is not in the future', async () => {
    const item = await db.item.findFirst();
    const now = Date.now();

    const req = mockRequest(
      { expiry: now, quantity: 10 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      expiry: 'Expiry must be a future time in milliseconds since epoch',
    });
  });
});
describe('Get Item Quantity handler', () => {
  it('should return all unexpired items quantity and earliest expiry time', async () => {
    const item = await db.item.findFirst();
    await db.lot.deleteMany({ where: { itemId: item?.id } });
    const now = Date.now();

    const expiry = now + 10000;
    const expiry2 = now + 20000;
    const expiry3 = now + 5000;
    const quantity = 10;
    const quantity2 = 20;
    const quantity3 = 30;
    const req1 = mockRequest(
      { expiry, quantity },
      { id: item?.id || '' }
    ) as Request;
    const req2 = mockRequest(
      { expiry: expiry2, quantity: quantity2 },
      { id: item?.id || '' }
    ) as Request;

    const req3 = mockRequest(
      { expiry: expiry3, quantity: quantity3 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req1, res);
    await addItemLot(req2, res);
    await addItemLot(req3, res);
    const req = mockRequest(undefined, { id: item?.id || '' }) as Request;
    await getItemQuantity(req, res);
    const result = json.mock.calls[json.mock.calls.length - 1][0];

    expect(status).toHaveBeenCalledTimes(0);
    expect(result.quantity).toEqual(quantity + quantity2 + quantity3);
    expect(result.validTill).toEqual(expiry3);
  });
  it('should not return expired items quantity or expiry time', async () => {
    const item = await db.item.findFirst();
    await db.lot.deleteMany({ where: { itemId: item?.id } });
    const now = Date.now();

    const expiry = now + 500;
    const expiry2 = now + 20000;
    const expiry3 = now + 1000;
    const quantity = 10;
    const quantity2 = 20;
    const quantity3 = 30;
    const req1 = mockRequest(
      { expiry, quantity },
      { id: item?.id || '' }
    ) as Request;
    const req2 = mockRequest(
      { expiry: expiry2, quantity: quantity2 },
      { id: item?.id || '' }
    ) as Request;
    const req3 = mockRequest(
      { expiry: expiry3, quantity: quantity3 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req1, res);
    await addItemLot(req2, res);
    await addItemLot(req3, res);
    const req = mockRequest(undefined, { id: item?.id || '' }) as Request;
    await new Promise(r => setTimeout(r, 2000));
    await getItemQuantity(req, res);
    const result = json.mock.calls[json.mock.calls.length - 1][0];

    expect(status).toHaveBeenCalledTimes(0);
    expect(result.quantity).toEqual(quantity2);
    expect(result.validTill).toEqual(expiry2);
  });
  it('should return quantity 0 and expiry time null when no valid input found', async () => {
    const item = await db.item.findFirst();
    await db.lot.deleteMany({ where: { itemId: item?.id } });
    const now = Date.now();

    const expiry = now + 500;
    const expiry3 = now + 1000;
    const quantity = 10;
    const quantity3 = 30;
    const req1 = mockRequest(
      { expiry, quantity },
      { id: item?.id || '' }
    ) as Request;
    const req3 = mockRequest(
      { expiry: expiry3, quantity: quantity3 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req1, res);
    await addItemLot(req3, res);
    const req = mockRequest(undefined, { id: item?.id || '' }) as Request;
    await new Promise(r => setTimeout(r, 2000));
    await getItemQuantity(req, res);
    const result = json.mock.calls[json.mock.calls.length - 1][0];

    expect(status).toHaveBeenCalledTimes(0);
    expect(result.quantity).toEqual(0);
    expect(result.validTill).toEqual(null);
  });
  it('should fail if Item is not in the DB', async () => {
    const req = mockRequest(undefined, { id: randomID }) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await getItemQuantity(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: 'No inventory item with the given ID found',
    });
  });
});
describe('Sell Items handler', () => {
  it('should sell a given quantity and adjust the DB record', async () => {
    const item = await db.item.findFirst();
    await db.lot.deleteMany({ where: { itemId: item?.id } });
    const now = Date.now();

    const expiry = now + 10000;
    const expiry2 = now + 20000;
    const expiry3 = now + 5000;
    const quantity = 10;
    const quantity2 = 20;
    const quantity3 = 30;
    const req1 = mockRequest(
      { expiry, quantity },
      { id: item?.id || '' }
    ) as Request;
    const req2 = mockRequest(
      { expiry: expiry2, quantity: quantity2 },
      { id: item?.id || '' }
    ) as Request;

    const req3 = mockRequest(
      { expiry: expiry3, quantity: quantity3 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req1, res);
    await addItemLot(req2, res);
    await addItemLot(req3, res);
    const sellReq = mockRequest(
      { quantity: 40 },
      { id: item?.id || '' }
    ) as Request;
    await sellItems(sellReq, res);

    const req = mockRequest(undefined, { id: item?.id || '' }) as Request;
    await getItemQuantity(req, res);
    const result = json.mock.calls[json.mock.calls.length - 1][0];

    expect(status).toHaveBeenCalledTimes(0);
    expect(result.quantity).toEqual(quantity + quantity2 + quantity3 - 40);
    expect(result.validTill).toEqual(expiry2);
  });
  it('should fail if there is not enough quantity available', async () => {
    const item = await db.item.findFirst();
    await db.lot.deleteMany({ where: { itemId: item?.id } });
    const now = Date.now();

    const expiry = now + 10000;
    const expiry2 = now + 20000;
    const expiry3 = now + 5000;
    const quantity = 10;
    const quantity2 = 20;
    const quantity3 = 30;
    const req1 = mockRequest(
      { expiry, quantity },
      { id: item?.id || '' }
    ) as Request;
    const req2 = mockRequest(
      { expiry: expiry2, quantity: quantity2 },
      { id: item?.id || '' }
    ) as Request;

    const req3 = mockRequest(
      { expiry: expiry3, quantity: quantity3 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await addItemLot(req1, res);
    await addItemLot(req2, res);
    await addItemLot(req3, res);
    const sellReq = mockRequest(
      { quantity: 80 },
      { id: item?.id || '' }
    ) as Request;
    await sellItems(sellReq, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: 'Not enough items available for sale. Only 60 item(s) left',
    });
  });

  it('should fail if Item is not in the DB', async () => {
    const req = mockRequest({ quantity: 10 }, { id: randomID }) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await sellItems(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      message: 'No inventory item with the given ID found',
    });
  });
  it('should fail if quantity is not provided', async () => {
    const item = await db.item.findFirst();

    const req = mockRequest({}, { id: item?.id || '' }) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await sellItems(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      quantity: 'You must provide the quantity of items',
    });
  });
  it('should fail if quantity is not a number', async () => {
    const item = await db.item.findFirst();

    const req = mockRequest(
      { quantity: 'love' },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await sellItems(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      quantity: 'Quantity must be a whole number',
    });
  });
  it('should fail if quantity is not a positive number', async () => {
    const item = await db.item.findFirst();

    const req = mockRequest(
      { quantity: -10 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    const status = jest.spyOn(res, 'status');
    const json = jest.spyOn(res, 'json');
    await sellItems(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      quantity: 'Quantity must be a positive whole number',
    });
  });
});
describe('Data Cleanup', () => {
  it('should delete expired items from the database', async () => {
    const item = await db.item.findFirst();
    await db.lot.deleteMany({ where: { itemId: item?.id } });
    const now = Date.now();

    const expiry = now + 500;
    const expiry2 = now + 20000;
    const expiry3 = now + 1000;
    const quantity = 10;
    const quantity2 = 20;
    const quantity3 = 30;
    const req1 = mockRequest(
      { expiry, quantity },
      { id: item?.id || '' }
    ) as Request;
    const req2 = mockRequest(
      { expiry: expiry2, quantity: quantity2 },
      { id: item?.id || '' }
    ) as Request;
    const req3 = mockRequest(
      { expiry: expiry3, quantity: quantity3 },
      { id: item?.id || '' }
    ) as Request;
    const res = mockResponse() as Response;
    await addItemLot(req1, res);
    await addItemLot(req2, res);
    await addItemLot(req3, res);
    await new Promise(r => setTimeout(r, 2000));
    await cleanup();
    const remainingItems = await db.lot.findMany();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].quantity).toEqual(quantity2);
  });
});
