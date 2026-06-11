import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import marketsRouter from './routes/markets';
import positionsRouter from './routes/positions';

const app = express();
const PORT = process.env.PORT ?? 4001;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'movex-execution-engine' }));
app.use('/api/markets', marketsRouter);
app.use('/api/positions', positionsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ error: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => console.log(`MoveX execution engine running on :${PORT}`));

export default app;
