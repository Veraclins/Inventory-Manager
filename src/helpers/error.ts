import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const errorRequestHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  return res.status(err.status || 500).json({
    message: err.message || 'Something went wrong. Please try again.',
  });
};
