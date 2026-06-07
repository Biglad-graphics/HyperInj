import { Request, Response } from 'express';
import { Indicator } from '../../models/indicator.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export const updateIndicator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, description, code, parameters } = req.body;

    const indicator = await Indicator.findById(id);
    if (!indicator) {
      throw new NotFoundError('Indicator not found');
    }

    if (name !== undefined) indicator.name = name;
    if (type !== undefined) indicator.type = type;
    if (description !== undefined) indicator.description = description;
    if (code !== undefined) indicator.code = code;
    if (parameters !== undefined) indicator.parameters = parameters;

    const updated = await indicator.save();

    logger.info('Indicator updated successfully', { indicatorId: id });

    res.status(200).json({
      message: 'Indicator updated successfully',
      indicator: updated,
    });
  } catch (error) {
    logger.error('Error updating indicator', {
      error: error instanceof Error ? error.message : 'Unknown error',
      indicatorId: req.params?.['id'],
    });
    throw error;
  }
};
