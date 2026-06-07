import { Request, Response } from "express";
import { HyperliquidClient } from "../../../clients/hyperliquid.client";
import logger from "../../../utils/logger";

/**
 * @swagger
 * /api/hyperliquid/balance/{address}:
 *   get:
 *     summary: Get withdrawable balance of a user
 *     tags: [Hyperliquid]
 *     parameters:
 *       - in: path
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Ethereum address of the user
 *     responses:
 *       200:
 *         description: Withdrawable balance fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 address:
 *                   type: string
 *                 withdrawable:
 *                   type: string
 *                   description: Amount available to withdraw
 *       400:
 *         description: Bad request
 *       404:
 *         description: User or balance not found
 *       500:
 *         description: Internal server error
 */
export const getAvailableBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { address } = req.params;
        if (!address) res.status(400).json({ error: "Address is required" });
        console.log("HRBJJJBNBJNJJN")

        const state = await HyperliquidClient.clearingHouse(address);
        console.log(state);
        const withdrawable = state?.withdrawable ?? null;

        if (withdrawable === null) {
            res.status(404).json({ error: "Could not fetch withdrawable balance" });
        }

        logger.info("Fetched withdrawable balance", { address, withdrawable });

        res.json({
            success: true,
            address,
            withdrawable,
        });
    } catch (error: any) {
        logger.error("Error fetching available balance", {
            error: error.message,
            body: req.body,
        });
        res.status(500).json({ success: false, error: error.message });
    }
};
