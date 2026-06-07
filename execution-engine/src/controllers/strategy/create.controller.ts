import { Request, Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import logger from '../../utils/logger';

export const createStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, name, description, cryptoAsset, timeframe, risk, agents, indicators } = req.body;
    if (!userId || !name) {
      res.status(400).json({ error: 'userId and name are required' });
      return;
    }
    const strategy = new Strategy({ userId, name, description, cryptoAsset, timeframe, risk, agents, indicators });
    const saved = await strategy.save();
    logger.info('Strategy created', { strategyId: saved._id, userId });
    res.status(201).json({ message: 'Strategy created', strategy: saved });
  } catch (err: any) {
    logger.error('Error creating strategy', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
