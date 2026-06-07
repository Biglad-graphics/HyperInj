import mongoose, { Schema, Document } from 'mongoose';
export interface IIndicator extends Document {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}
const IndicatorSchema = new Schema<IIndicator>({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  parameters: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const Indicator = mongoose.model<IIndicator>('Indicator', IndicatorSchema);
