import mongoose, { Schema, Document } from 'mongoose';
export interface IAgent extends Document {
  name: string;
  type: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}
const AgentSchema = new Schema<IAgent>({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  prompt: { type: String, required: true },
}, { timestamps: true });
export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);
