import { Response } from 'express';
import { Agent } from '../../models/agent.model';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: List all base agents
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all agents
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
 *                   weightage:
 *                     type: number
 *                   prompt:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
export const getAllAgents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const agents = await Agent.find({}).sort({ createdAt: -1 });

    const agentsResponse = agents.map(agent => ({
      _id: agent._id,
      name: agent.name,
      type: agent.type,
      prompt: agent.prompt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    }));

    logger.info('Retrieved all agents', {
      count: agents.length,
      userId: req.user?.id,
    });

    res.status(200).json(agentsResponse);
  } catch (error) {
    logger.error('Error retrieving agents', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    throw error;
  }
};
