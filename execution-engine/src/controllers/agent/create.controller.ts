import { Request, Response } from 'express';
import { Agent } from '../../models/agent.model';
import { ValidationError, ConflictError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: Create a new base agent (admin only)
 *     tags: [Agents]
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
 *               - weightage
 *               - prompt
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the agent
 *                 example: "Sentiment Agent"
 *               type:
 *                 type: string
 *                 description: Type of the agent
 *                 example: "sentiment"
 *               prompt:
 *                 type: string
 *                 description: Prompt for the agent
 *                 example: "Analyze crypto sentiment from news and social sources."
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Agent created successfully"
 *                 agent:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
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
 *       409:
 *         description: Conflict - Agent name already exists
 */
export const createAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, prompt } = req.body;

    // Validate required fields
    if (!name || !type === undefined || !prompt) {
      throw new ValidationError('Missing required fields: name, type, weightage, prompt');
    }

    // Check if agent with same name already exists
    const existingAgent = await Agent.findOne({ name });
    if (existingAgent) {
      throw new ConflictError('Agent with this name already exists');
    }

    const agent = new Agent({
      name,
      type,
      prompt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedAgent = await agent.save();

    logger.info('Agent created successfully', {
      agentId: savedAgent._id,
      name: savedAgent.name,
      type: savedAgent.type,
    });

    res.status(201).json({
      message: 'Agent created successfully',
      agent: {
        _id: savedAgent._id,
        name: savedAgent.name,
        type: savedAgent.type,
        prompt: savedAgent.prompt,
        createdAt: savedAgent.createdAt,
        updatedAt: savedAgent.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error creating agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
    });
    throw error;
  }
};
