import Redis from "ioredis";
import { Worker, Queue } from "bullmq";
import * as dotenv from "dotenv";
dotenv.config();

// Read Redis connection from env (for both local and deployed)
const REDIS_URL = process.env["REDIS_URL"] || "redis://127.0.0.1:6379";

// Create a single shared Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Create a worker factory
export const getWorker = (queueName: string, processor: any) => {
  return new Worker(queueName, processor, { connection });
};

// Shared queue for triggers
export const triggerQueue = new Queue("execution", { connection });

// Generic queue getter
export const getQueue = (queueName: string) => {
  return new Queue(queueName, { connection });
};

// Export connection for reuse
export { connection as redis };
