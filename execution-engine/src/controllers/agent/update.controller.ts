import { Request, Response } from 'express';
import { Agent } from '../../models/agent.model';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     summary: Update agent (admin only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the agent
 *               type:
 *                 type: string
 *                 description: Type of the agent
 *               weightage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Base weightage for the agent
 *               prompt:
 *                 type: string
 *                 description: Prompt for the agent
 *     responses:
 *       200:
 *         description: Agent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Agent updated successfully"
 *                 agent:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     weightage:
 *                       type: number
 *                     prompt:
 *                       type: string
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
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Agent not found
 *       409:
 *         description: Conflict - Agent name already exists
 */
export const updateAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, weightage, prompt } = req.body;

    const agent = await Agent.findById(id);
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    // Validate weightage if provided
    if (weightage !== undefined && (weightage < 0 || weightage > 1)) {
      throw new ValidationError('Weightage must be between 0 and 1');
    }

    // Check for name conflicts if name is being updated
    if (name && name !== agent.name) {
      const existingAgent = await Agent.findOne({ name, _id: { $ne: id } });
      if (existingAgent) {
        throw new ConflictError('Agent with this name already exists');
      }
    }

    // Update fields
    if (name) agent.name = name;
    if (type) agent.type = type;
    if (prompt) agent.prompt = prompt;
    agent.updatedAt = new Date();

    const updatedAgent = await agent.save();

    logger.info('Agent updated successfully', {
      agentId: updatedAgent._id,
      name: updatedAgent.name,
    });

    res.status(200).json({
      message: 'Agent updated successfully',
      agent: {
        _id: updatedAgent._id,
        name: updatedAgent.name,
        type: updatedAgent.type,
        prompt: updatedAgent.prompt,
        createdAt: updatedAgent.createdAt,
        updatedAt: updatedAgent.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      agentId: req.params?.['id'],
      body: req.body,
    });
    throw error;
  }
};
