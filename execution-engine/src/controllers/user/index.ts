import { Request, Response } from 'express';
import { User } from '../../models/user.model';

export const registerUser = async (req: Request, res: Response) => {
  const { uniqueWalletId, walletAddress, apiWallet } = req.body;
  if (!uniqueWalletId || !walletAddress) {
    return res.status(400).json({ error: 'uniqueWalletId and walletAddress are required' });
  }

  const existing = await User.findOne({ uniqueWalletId });
  if (existing) {
    return res.json({
      exists: true,
      data: {
        _id: existing._id,
        uniqueWalletId: existing.uniqueWalletId,
        walletAddress: existing.walletAddress,
        apiWallet: existing.apiWallet,
      },
    });
  }

  const user = await User.create({ uniqueWalletId, walletAddress, apiWallet });
  return res.status(201).json({
    exists: false,
    data: {
      _id: user._id,
      uniqueWalletId: user.uniqueWalletId,
      walletAddress: user.walletAddress,
      apiWallet: user.apiWallet,
    },
  });
};

export const getUserByWalletId = async (req: Request, res: Response) => {
  const { wallet_id } = req.params;
  const user = await User.findOne({ uniqueWalletId: wallet_id });
  if (!user) return res.json({ exists: false, data: null });

  return res.json({
    exists: true,
    data: {
      _id: user._id,
      uniqueWalletId: user.uniqueWalletId,
      walletAddress: user.walletAddress,
      apiWallet: user.apiWallet,
    },
  });
};
