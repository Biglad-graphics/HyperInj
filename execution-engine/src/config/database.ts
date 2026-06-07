import mongoose from "mongoose";
import logger from "../utils/logger";

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("MongoDB is already connected");
      return;
    }

    const mongoUrl = process.env["NEXT_PUBLIC_MONGO_URL"];

    if (!mongoUrl) {
      logger.error(
        "NEXT_PUBLIC_MONGO_URL is not defined in environment variables"
      );
      throw new Error("MongoDB connection URL is not configured");
    }

    try {
      await mongoose.connect(mongoUrl, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;

      logger.info("MongoDB connected successfully", {
        host: mongoose.connection.host,
        database: mongoose.connection.name,
      });

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        logger.error("MongoDB connection error", { error: error.message });
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("MongoDB disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("MongoDB reconnected");
        this.isConnected = true;
      });
    } catch (error: any) {
      logger.error("Failed to connect to MongoDB", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info("MongoDB disconnected successfully");
    } catch (error: any) {
      logger.error("Error disconnecting from MongoDB", {
        error: error.message,
      });
      throw error;
    }
  }

  public getConnectionState(): boolean {
    return this.isConnected;
  }

  public async healthCheck(): Promise<{
    status: string;
    isConnected: boolean;
    readyState: number;
    host?: string;
    database?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();

    try {
      // Perform a simple ping to check database connectivity
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        isConnected: this.isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        responseTime,
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        isConnected: this.isConnected,
        readyState: mongoose.connection.readyState,
      };
    }
  }
}

export default Database.getInstance();
