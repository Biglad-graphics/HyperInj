# Execution Engine Server

A production-ready Node.js server built with TypeScript, Express.js, and comprehensive logging capabilities.

## Features

- 🚀 **Production Ready**: Built with TypeScript and follows best practices
- 📊 **Comprehensive Logging**: Winston logger with file rotation and structured logging
- 🛡️ **Security**: Helmet.js, CORS, rate limiting, and input validation
- 🔍 **Health Checks**: Kubernetes-ready health check endpoints
- ⚡ **Performance**: Compression, request/response optimization
- 🐛 **Error Handling**: Comprehensive error handling with request tracking
- 📈 **Monitoring**: Request logging, performance metrics, and uptime tracking

## Project Structure

```
execution-engine/
├── src/
│   ├── config/
│   │   └── environment.ts          # Environment configuration
│   ├── middleware/
│   │   ├── errorHandler.ts         # Error handling middleware
│   │   └── requestLogger.ts        # Request logging middleware
│   ├── routes/
│   │   ├── health.ts               # Health check endpoints
│   │   └── index.ts                # Route definitions
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts               # Custom error classes
│   │   └── logger.ts               # Winston logger configuration
│   └── server.ts                   # Main server file
├── logs/                           # Log files directory
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository and navigate to the execution-engine directory:
```bash
cd execution-engine
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

Run the production server:
```bash
npm start
```

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run build:watch` - Build with file watching
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## API Endpoints

### Health Check Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with memory and CPU usage
- `GET /health/ready` - Readiness probe (for Kubernetes)
- `GET /health/live` - Liveness probe (for Kubernetes)

### API Endpoints

- `GET /` - Server information
- `GET /api/v1` - API v1 endpoint

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |
| `LOG_FILE_MAX_SIZE` | Max size for log files | 20m |
| `LOG_FILE_MAX_FILES` | Max number of log files to keep | 14d |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | CORS origin setting | * |
| `CORS_CREDENTIALS` | CORS credentials setting | true |

## Logging

The server uses Winston for structured logging with the following features:

- **Console Logging**: Colorized output in development
- **File Logging**: Rotating log files in production
- **Request Tracking**: Each request gets a unique ID for tracing
- **Error Logging**: Comprehensive error logging with stack traces
- **Log Rotation**: Daily rotation with size limits

### Log Files

- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Error logs only

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Request validation middleware
- **Error Sanitization**: Sensitive information filtering

## Health Checks

The server provides multiple health check endpoints for monitoring:

- **Basic Health**: Server status and basic information
- **Detailed Health**: Memory usage, CPU usage, and system metrics
- **Readiness Probe**: Check if the server is ready to accept requests
- **Liveness Probe**: Check if the server process is alive

## Error Handling

The server includes comprehensive error handling:

- **Custom Error Classes**: Predefined error types
- **Global Error Handler**: Centralized error handling
- **Request Tracking**: Error correlation with request IDs
- **Graceful Shutdown**: Proper cleanup on termination

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes

The server is ready for Kubernetes deployment with:
- Health check endpoints for probes
- Graceful shutdown handling
- Structured logging for log aggregation

## Monitoring

### Metrics

- Request count and response times
- Memory and CPU usage
- Error rates and types
- Uptime tracking

### Logging

- Structured JSON logs in production
- Request correlation IDs
- Error stack traces
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

MIT License
