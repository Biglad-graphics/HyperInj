import { Response } from 'express';
import { Indicator } from '../../models/indicator.model';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/indicators:
 *   get:
 *     summary: List all indicators
 *     tags: [Indicators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all indicators
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   description:
 *                     type: string
 *                   code:
 *                     type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
export const getAllIndicators = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const indicators = await Indicator.find({}).sort({ createdAt: -1 });

    const indicatorsResponse = indicators.map(indicator => ({
      _id: indicator._id,
      name: indicator.name,
      type: indicator.type,
      description: indicator.description,
      code: indicator.code,
      createdAt: indicator.createdAt,
      updatedAt: indicator.updatedAt,
    }));

    logger.info('Retrieved all indicators', {
      count: indicators.length,
      userId: req.user?.id,
    });

    res.status(200).json(indicatorsResponse);
  } catch (error) {
    logger.error('Error retrieving indicators', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    throw error;
  }
};
