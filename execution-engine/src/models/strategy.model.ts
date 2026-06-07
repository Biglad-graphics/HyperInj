import mongoose, { Schema, Document } from 'mongoose';

export interface IStrategyAgent {
  agentId: mongoose.Types.ObjectId;
  votingPower: number;
  customPrompt?: string;
}

export interface IStrategy extends Document {
  userId: string;
  name: string;
  description?: string;
  cryptoAsset: string;
  timeframe: string;
  risk: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'stopped';
  agents: IStrategyAgent[];
  indicators: mongoose.Types.ObjectId[];
  performance?: {
    totalReturn: number;
    winRate: number;
    totalTrades: number;
  };
}

const StrategySchema = new Schema<IStrategy>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  cryptoAsset: { type: String, default: 'INJ' },
  timeframe: { type: String, default: '1h' },
  risk: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['active', 'paused', 'stopped'], default: 'active' },
  agents: [{
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
    votingPower: { type: Number, default: 1 },
    customPrompt: { type: String, default: '' },
  }],
  indicators: [{ type: Schema.Types.ObjectId, ref: 'Indicator' }],
  performance: {
    totalReturn: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
  },
}, { timestamps: true });

export const Strategy = mongoose.model<IStrategy>('Strategy', StrategySchema);
