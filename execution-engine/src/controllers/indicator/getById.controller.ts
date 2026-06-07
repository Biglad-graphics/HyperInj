import { Request, Response } from 'express';
import { Indicator } from '../../models/indicator.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/indicators/{id}:
 *   get:
 *     summary: Get indicator by ID
 *     tags: [Indicators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Indicator ID
 *     responses:
 *       200:
 *         description: Indicator details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 description:
 *                   type: string
 *                 code:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Indicator not found
 */
export const getIndicatorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const indicator = await Indicator.findById(id);
    if (!indicator) {
      throw new NotFoundError('Indicator not found');
    }

    res.status(200).json({
      _id: indicator._id,
      name: indicator.name,
      type: indicator.type,
      description: indicator.description,
      code: indicator.code,
      createdAt: indicator.createdAt,
      updatedAt: indicator.updatedAt,
    });
  } catch (error) {
    logger.error('Error retrieving indicator', {
      error: error instanceof Error ? error.message : 'Unknown error',
      indicatorId: req.params?.['id'],
    });
    throw error;
  }
};
