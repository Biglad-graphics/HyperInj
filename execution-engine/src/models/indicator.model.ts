import mongoose, { Schema, Document } from 'mongoose';
export interface IIndicator extends Document {
  name: string;
  type: string;
  description: string;
  code?: Record<string, any>;
  parameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
const IndicatorSchema = new Schema<IIndicator>({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['PRE-DEFINED', 'CUSTOM'], default: 'PRE-DEFINED' },
  description: { type: String, default: '' },
  code: { type: Schema.Types.Mixed, default: null },
  parameters: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const Indicator = mongoose.model<IIndicator>('Indicator', IndicatorSchema);
