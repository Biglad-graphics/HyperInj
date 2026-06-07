import { Request, Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import logger from '../../utils/logger';

export const getUserStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, strategyId } = req.params;
    const strategy = await Strategy.findOne({ _id: strategyId, userId }).populate('agents.agentId', 'name type').lean();
    if (!strategy) { res.status(404).json({ error: 'Strategy not found' }); return; }
    res.json(strategy);
  } catch (err: any) {
    logger.error('Error fetching strategy', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
