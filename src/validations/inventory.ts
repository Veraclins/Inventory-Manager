import { z } from 'zod';

const quantity = z.preprocess(
  val => (Number(val) ? Number(val) : val),
  z
    .number({
      required_error: 'You must provide the quantity of items',
      invalid_type_error: 'Quantity must be a whole number',
    })
    .int()
    .gt(0, 'Quantity must be a positive whole number')
);

export const CreateItem = z.object({
  name: z.string({
    required_error: 'An item needs a name for identification',
    invalid_type_error: 'Name must must be a valid string',
  }),
});

export const SellItem = z.object({ quantity });

export const AddItemLot = z.object({
  quantity,
  expiry: z.preprocess(
    val => (Number(val) ? Number(val) : val),
    z
      .number({
        required_error: 'You must provide the expiry time',
        invalid_type_error: 'Expiry time must be a whole number',
      })
      .refine(
        val => val > Date.now(),
        `Expiry must be a future time in milliseconds since epoch`
      )
  ),
});
