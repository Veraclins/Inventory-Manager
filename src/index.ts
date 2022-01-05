import express from 'express';
import { errorRequestHandler } from './helpers/error';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.get('/', async (req, res) => {
  res.redirect('/items');
});
app.use(errorRequestHandler);
const port = process.env.PORT || 3000;

const server = app.listen(port, () =>
  console.log('🚀 Server ready at: http://localhost:%d', port)
);
