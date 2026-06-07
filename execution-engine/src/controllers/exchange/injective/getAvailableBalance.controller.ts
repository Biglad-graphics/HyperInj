import { Request, Response } from "express";
import { InjectiveClient } from "../../../clients/injective.client";
import logger from "../../../utils/logger";

/**
 * @swagger
 * /api/injective/balance/{address}:
 *   get:
 *     summary: Get withdrawable USDT balance for an Injective address
 *     tags: [Injective]
 *     parameters:
 *       - in: path
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Injective bech32 address (inj1...)
 *     responses:
 *       200:
 *         description: Balance fetched successfully
 *       400:
 *         description: Address is required
 *       500:
 *         description: Internal server error
 */
export const getAvailableBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    if (!address) {
      res.status(400).json({ error: "address is required" });
      return;
    }

    const balance = await InjectiveClient.getAvailableBalance(address);

    logger.info("Fetched Injective balance", { address, balance });
    res.json({ success: true, address, withdrawable: balance });
  } catch (error: any) {
    logger.error("Error fetching Injective balance", { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
