import { Request, Response } from 'express';
import { Agent } from '../../models/agent.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Get agent by ID
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent details
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
 *                 weightage:
 *                   type: number
 *                 prompt:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Agent not found
 */
export const getAgentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    res.status(200).json({
      _id: agent._id,
      name: agent.name,
      type: agent.type,
      prompt: agent.prompt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    });
  } catch (error) {
    logger.error('Error retrieving agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      agentId: req.params?.['id'],
    });
    throw error;
  }
};
