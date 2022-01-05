import { number, z } from 'zod';

export const CreateItem = z.object({
  name: z.string({
    required_error: 'An item needs a name for identification',
  }),
  description: z.string().optional(),
});

export const SellItem = z.object({
  quantity: z.preprocess(
    (val) => Number(val),
    z
      .number({
        required_error: 'You must specify the quantity to sell',
      })
      .int()
      .gt(0, 'Quantity must be a positive integer')
  ),
});

export const AddItemLot = z.object({
  quantity: z.preprocess(
    (val) => Number(val),
    number({
      required_error: 'You must specify the quantity of items in the lot',
    }).gt(0, 'Quantity must be a positive integer')
  ),
  expiry: z.preprocess(
    (val) => Number(val),
    number({
      required_error: 'You must specify the quantity of items in the lot',
    }).gt(
      Date.now(),
      `Expiry must be greater than the current time (>${Date.now()}`
    )
  ),
});
