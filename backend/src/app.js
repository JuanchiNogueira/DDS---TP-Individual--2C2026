import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/router.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import errorLogger from './middlewares/errorLogger.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(router);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

export default app;
