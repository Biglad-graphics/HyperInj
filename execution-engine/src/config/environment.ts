import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Define validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_FILE_MAX_SIZE: Joi.string().default('20m'),
  LOG_FILE_MAX_FILES: Joi.string().default('14d'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(90), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100000),
  CORS_ORIGIN: Joi.string().default('*'),
  CORS_CREDENTIALS: Joi.boolean().default(true),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000), // 30 seconds
  APP_NAME: Joi.string().default('execution-engine'),
  APP_VERSION: Joi.string().default('1.0.0'),
  SWAGGER_SERVER_URL: Joi.string().default('http://localhost:4000'),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration object
export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
  logging: {
    level: envVars.LOG_LEVEL,
    fileMaxSize: envVars.LOG_FILE_MAX_SIZE,
    fileMaxFiles: envVars.LOG_FILE_MAX_FILES,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
    credentials: envVars.CORS_CREDENTIALS,
  },
  healthCheck: {
    interval: envVars.HEALTH_CHECK_INTERVAL,
  },
  app: {
    name: envVars.APP_NAME,
    version: envVars.APP_VERSION,
  },
  swaggerUrl: envVars.SWAGGER_SERVER_URL,
} as const;

export default config;
