import express, { NextFunction, Request, Response } from 'express';
import cron from 'node-cron';
import { cleanup } from './controllers/inventory';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.get('*', async (_req, res) => {
  res.json({
    message: 'Welcome to inventory manager',
    availableRoutes: [
      `get: '/'`,
      `post: '/'`,
      `post: '/:id/add'`,
      `get: '/:id/quantity'`,
      `post: '/:id/sell'`,
    ],
  });
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  return res.status(err.status || 500).json({
    message: err.message || 'Something went wrong. Please try again.',
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log('🚀 Server ready at: http://localhost:%d', port);
  cron.schedule('59 23 * * *', cleanup);
});
