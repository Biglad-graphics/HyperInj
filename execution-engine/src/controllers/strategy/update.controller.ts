import { Request, Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import logger from '../../utils/logger';

export const updateStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const { name, description, risk, agents, status, cryptoAsset, timeframe } = req.body;
    const strategy = await Strategy.findByIdAndUpdate(
      strategyId,
      { name, description, risk, agents, status, cryptoAsset, timeframe, updatedAt: new Date() },
      { new: true }
    );
    if (!strategy) { res.status(404).json({ error: 'Strategy not found' }); return; }
    res.json({ message: 'Strategy updated', strategy });
  } catch (err: any) {
    logger.error('Error updating strategy', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
