import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/router.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import errorLogger from './middlewares/errorLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import { seedDatabase } from './repositories/DataSeeder.js';

dotenv.config();

// Inicializar datos semilla en memoria al arrancar la aplicación
seedDatabase();

const app = express();

app.use(express.json());
app.use(cors());
app.use(router);
app.use(notFoundHandler);
app.use(errorLogger);
app.use(errorHandler);

export default app;
