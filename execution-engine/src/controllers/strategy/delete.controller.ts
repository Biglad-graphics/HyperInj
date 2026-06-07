import { Request, Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import logger from '../../utils/logger';

export const deleteStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    const deleted = await Strategy.findByIdAndDelete(strategyId);
    if (!deleted) { res.status(404).json({ error: 'Strategy not found' }); return; }
    res.json({ message: 'Strategy deleted' });
  } catch (err: any) {
    logger.error('Error deleting strategy', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
