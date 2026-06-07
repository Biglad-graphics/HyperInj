import mongoose, { Schema, Document } from 'mongoose';
export interface IUser extends Document {
  uniqueWalletId: string;
  walletAddress: string;
  apiWallet?: { address: string; privateKey: string };
  createdAt: Date;
}
const UserSchema = new Schema<IUser>({
  uniqueWalletId: { type: String, required: true, unique: true, index: true },
  walletAddress: { type: String, required: true, unique: true },
  apiWallet: { address: String, privateKey: String },
}, { timestamps: true });
export const User = mongoose.model<IUser>('User', UserSchema);
