import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '../config/environment';

const serverUrl = config.swaggerUrl;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Execution Engine API',
      version: '1.0.0',
      description: 'API documentation for the Execution Engine - Agent and Strategy management system',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: serverUrl,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Privy authentication token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP status code',
                },
                requestId: {
                  type: 'string',
                  description: 'Unique request identifier',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                },
              },
            },
          },
        },
        Agent: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Agent ID',
            },
            name: {
              type: 'string',
              description: 'Agent name',
            },
            type: {
              type: 'string',
              description: 'Agent type (sentiment, technical, fundamental)',
            },
            weightage: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Base weightage for the agent',
            },
            prompt: {
              type: 'string',
              description: 'Agent prompt',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Strategy: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Strategy ID',
            },
            name: {
              type: 'string',
              description: 'Strategy name',
            },
            description: {
              type: 'string',
              description: 'Strategy description',
            },
            agentConfigs: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/UserAgentConfig',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UserAgentConfig: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Config ID',
            },
            votingPower: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Voting power for this agent in the strategy',
            },
            customPrompt: {
              type: 'string',
              description: 'Custom prompt override for this agent',
            },
            agentId: {
              $ref: '#/components/schemas/Agent',
            },
            strategyId: {
              type: 'string',
              description: 'Strategy ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Agents',
        description: 'Agent management endpoints',
      },
      {
        name: 'Strategies',
        description: 'Strategy management endpoints',
      },
      {
        name: 'User Agent Config',
        description: 'User agent configuration endpoints',
      },
      {
        name: 'Users',
        description: 'User endpoints',
      },
      { name: 'Hyperliquid', description: 'Hyperliquid API endpoints (balance, orders)' },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/*/*/.ts',
    './src/routes/*/index.ts',
    './src/controllers/*/*.ts',
    './src/controllers/*/*/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: any): void => {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Execution Engine API Documentation',
  }));
};

export default specs;
