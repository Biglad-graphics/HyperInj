import { Request, Response } from 'express';
import { Agent } from '../../models/agent.model';
import { NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/agents/{id}:
 *   delete:
 *     summary: Delete agent (admin only)
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
 *         description: Agent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Agent deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Agent not found
 */
export const deleteAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id);
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    await Agent.findByIdAndDelete(id);

    logger.info('Agent deleted successfully', {
      agentId: id,
      name: agent.name,
    });

    res.status(200).json({
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      agentId: req.params?.['id'],
    });
    throw error;
  }
};
