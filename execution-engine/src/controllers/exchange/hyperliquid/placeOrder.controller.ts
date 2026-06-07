import { Request, Response } from "express";
import { HyperliquidClient } from "../../../clients/hyperliquid.client";
import logger from "../../../utils/logger";
import { User } from "../../../models/user.model";

/**
 * @swagger
 * /api/hyperliquid/order:
 *   post:
 *     summary: Place a limit order on Hyperliquid
 *     tags: [Hyperliquid]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - coin
 *               - size
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Mongo DB user ID
 *               coin:
 *                 type: string
 *                 description: Symbol of the coin to trade (e.g., BTC)
 *               size:
 *                 type: string
 *                 description: Order size
 *               side:
 *                 type: string
 *                 enum: [buy, sell]
 *                 description: Order side (buy or sell)
 *               tp:
 *                 type: string
 *                 description: Order tp (optional)
 *               sl:
 *                 type: string
 *                 description: Order sl (optional)
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
export const placeOrder = async (req: Request, res: Response) => {
  try {
    const { userId, coin, size, side, tp, sl } = req.body;

    if (!userId || !coin || !size) {
      res.status(400).json({ error: "userId, coin and size are required" });
    }

    // const user = await User.findOne({ uniqueWalletId: userId }).lean();
    const user = await User.findById(userId).lean();

    if (!user) {
      res.status(500).json({
        success: false,
        message: "User not found",
      });
    }

    const orderResult = await HyperliquidClient.placeOrder(
      user.apiWallet.privateKey,
      coin,
      size,
      side || "buy",
      tp,
      sl
    );

    logger.info("Placed order successfully", { coin, size, side, tp, sl });

    res.status(201).json({
      success: true,
      order: orderResult,
    });
  } catch (error: any) {
    logger.error("Error placing order", {
      error: error.message,
      body: req.body,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};
