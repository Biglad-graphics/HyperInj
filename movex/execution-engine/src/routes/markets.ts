import { Router, Request, Response } from 'express';
import { getMarkPrice } from '../services/movement';

const router = Router();

const SUPPORTED_MARKETS = [
  { symbol: 'BTC/USD-PERP', baseAsset: 'BTC', maxLeverage: 20 },
  { symbol: 'ETH/USD-PERP', baseAsset: 'ETH', maxLeverage: 20 },
  { symbol: 'MOVE/USD-PERP', baseAsset: 'MOVE', maxLeverage: 10 },
];

router.get('/', async (_req: Request, res: Response) => {
  const markets = await Promise.all(
    SUPPORTED_MARKETS.map(async (m) => ({
      ...m,
      markPrice: await getMarkPrice(m.symbol),
    })),
  );
  res.json({ markets });
});

router.get('/:symbol/price', async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const markPrice = await getMarkPrice(decodeURIComponent(symbol));
  res.json({ symbol, markPrice });
});

export default router;
