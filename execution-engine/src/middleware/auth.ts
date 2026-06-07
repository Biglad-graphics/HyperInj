import { Request } from 'express';

// Extends Express Request with optional user info populated by auth middleware
export interface AuthenticatedRequest extends Request {
  user?: { id: string; walletAddress?: string };
}
