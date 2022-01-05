import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const tryCatch =
  (handler: (req: Request, res: Response<any>, next: NextFunction) => any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'P2025') {
        error.status = 404;
        error.message = 'No inventory item with the giving ID found';
        return next(error);
      }
      if (error.message) {
        return next(error.message);
      }
      next(new Error('Something went wrong. Please try again.'));
    }
  };
