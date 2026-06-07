FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN mkdir -p logs
EXPOSE 4000
CMD ["node", "dist/server.js"]
