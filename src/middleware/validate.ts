import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { validateZodSchema } from '../helpers/validations';

export const validId = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { id } = request.params;

  const schema = z.object({
    id: z.string().uuid(),
  });

  const { errors } = await validateZodSchema(schema, { id });
  if (errors) {
    return response
      .status(400)
      .json({ message: 'The ID parameter must be a valid UUID.' });
  }
  return next();
};
