import { Request, Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import logger from '../../utils/logger';

export const getUserStrategies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const strategies = await Strategy.find({ userId }).populate('agents.agentId', 'name type').lean();
    res.json(strategies);
  } catch (err: any) {
    logger.error('Error fetching strategies', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
