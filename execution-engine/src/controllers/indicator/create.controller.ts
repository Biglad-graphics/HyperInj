import { Request, Response } from 'express';
import { Indicator } from '../../models/indicator.model';
import { ValidationError, ConflictError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/indicators:
 *   post:
 *     summary: Create a new indicator
 *     tags: [Indicators]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the indicator
 *                 example: "RSI"
 *               type:
 *                 type: string
 *                 enum: ["PRE-DEFINED", "CUSTOM"]
 *                 description: Type of the indicator
 *                 example: "PRE-DEFINED"
 *               description:
 *                 type: string
 *                 description: Description of the indicator
 *                 example: "Relative Strength Index indicator"
 *               code:
 *                 type: object
 *                 description: Code/configuration for custom indicators
 *                 example: {}
 *     responses:
 *       201:
 *         description: Indicator created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Indicator created successfully"
 *                 indicator:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     description:
 *                       type: string
 *                     code:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict - Indicator name already exists
 */
export const createIndicator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, description, code } = req.body;

    // Validate required fields
    if (!name || !type || !description) {
      throw new ValidationError('Missing required fields: name, type, description');
    }

    // Validate type enum
    if (!['PRE-DEFINED', 'CUSTOM'].includes(type)) {
      throw new ValidationError('Type must be either PRE-DEFINED or CUSTOM');
    }

    // Check if indicator with same name already exists
    const existingIndicator = await Indicator.findOne({ name });
    if (existingIndicator) {
      throw new ConflictError('Indicator with this name already exists');
    }

    const indicator = new Indicator({
      name,
      type,
      description,
      code: code || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedIndicator = await indicator.save();

    logger.info('Indicator created successfully', {
      indicatorId: savedIndicator._id,
      name: savedIndicator.name,
      type: savedIndicator.type,
    });

    res.status(201).json({
      message: 'Indicator created successfully',
      indicator: {
        _id: savedIndicator._id,
        name: savedIndicator.name,
        type: savedIndicator.type,
        description: savedIndicator.description,
        code: savedIndicator.code,
        createdAt: savedIndicator.createdAt,
        updatedAt: savedIndicator.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error creating indicator', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    throw error;
  }
};
