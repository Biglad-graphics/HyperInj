import { Request, Response } from 'express';
import { Indicator } from '../../models/indicator.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/indicators/{id}:
 *   delete:
 *     summary: Delete indicator
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
 *         description: Indicator deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Indicator deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Indicator not found
 */
export const deleteIndicator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const indicator = await Indicator.findById(id);
    if (!indicator) {
      throw new NotFoundError('Indicator not found');
    }

    await Indicator.findByIdAndDelete(id);

    logger.info('Indicator deleted successfully', {
      indicatorId: id,
      name: indicator.name,
    });

    res.status(200).json({
      message: 'Indicator deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting indicator', {
      error: error instanceof Error ? error.message : 'Unknown error',
      indicatorId: req.params?.['id'],
    });
    throw error;
  }
};
