import { Request, Response } from "express";
import { InjectiveClient } from "../../../clients/injective.client";
import logger from "../../../utils/logger";
import { User } from "../../../models/user.model";

/**
 * @swagger
 * /api/injective/order:
 *   post:
 *     summary: Place a market order on Injective
 *     tags: [Injective]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - marketId
 *               - quantity
 *             properties:
 *               userId:
 *                 type: string
 *               marketId:
 *                 type: string
 *                 description: Injective market ID (0x...)
 *               quantity:
 *                 type: string
 *               side:
 *                 type: string
 *                 enum: [buy, sell]
 *               orderType:
 *                 type: string
 *                 enum: [spot, derivative]
 *                 default: derivative
 *               margin:
 *                 type: string
 *                 description: Collateral margin for derivative orders
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, marketId, quantity, side = "buy", orderType = "derivative", margin = "10" } = req.body;

    if (!userId || !marketId || !quantity) {
      res.status(400).json({ error: "userId, marketId and quantity are required" });
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const privateKey: string = (user as any).apiWallet?.privateKey;
    if (!privateKey) {
      res.status(400).json({ success: false, message: "User has no agent wallet configured" });
      return;
    }

    let result;
    if (orderType === "spot") {
      result = await InjectiveClient.placeSpotOrder(privateKey, marketId, quantity, side);
    } else {
      result = await InjectiveClient.placeDerivativeOrder(privateKey, marketId, quantity, side, margin);
    }

    logger.info("Placed Injective order", { marketId, quantity, side, orderType });
    res.status(201).json({ success: true, order: result });
  } catch (error: any) {
    logger.error("Error placing Injective order", { error: error.message, body: req.body });
    res.status(500).json({ success: false, error: error.message });
  }
};
