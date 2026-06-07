import * as hl from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

// Set up transport (HTTP or WS) — use testnet flag if needed
const transport = new hl.HttpTransport();

// Info client for read-only data (balance etc.)
const infoClient = new hl.InfoClient({ transport });

enum AssetIndex {
    BTC = 0,
    ETH = 1,
}

export class HyperliquidClient {
    /**
     * Fetch clearingHouse info for a given address.
     * @param address The agent or account address to fetch state for.
     */
    static async clearingHouse(address: string) {
        const state = await infoClient.clearinghouseState({ user: address });
        return state;
    }

    /**
     * Place an order using the agent’s wallet.
     * @param agentPrivateKey The private key of the agent wallet.
     * @param orders An array of order objects as per Hyperliquid order spec.
     */
    /**
     * 📈 Place a limit order for a given asset
     * Mirrors your placeTestTrade example
     */
    static async placeOrder(
        privateKey: string,
        coin: string,
        size: string,
        side: "buy" | "sell" = "buy",
        tp?: string,
        sl?: string
    ) {
        try {
            // 1️⃣ Get L2 order book for coin
            const l2Book = await infoClient.l2Book({ coin });
            const bestBid = l2Book.levels[0][0]?.px;
            const bestAsk = l2Book.levels[1][0]?.px;
    
            console.log(`📊 Market depth — Bid: ${bestBid}, Ask: ${bestAsk}`);
            console.log(`📦 Order size: ${size}`);
    
            // 2️⃣ Initialize wallet and exchange client
            const wallet = privateKeyToAccount(privateKey as `0xstring`);
            const agentExchClient = new hl.ExchangeClient({ wallet, transport });

            const asset = coin === "BTC" ? AssetIndex.BTC : AssetIndex.ETH;
    
            // 3️⃣ Prepare main market order
            const orders: any[] = [
                {
                    a: asset, // asset index
                    b: side === "buy",
                    p: side === "buy" ? bestAsk : bestBid,
                    s: size,
                    r: false, // reduce-only = false
                    t: { limit: { tif: "FrontendMarket" } }, // time in force
                },
            ];
    
            // 4️⃣ Add TP order if provided
            if (tp) {
                orders.push({
                    a: asset,
                    b: side === "buy" ? false : true, // opposite side
                    p: tp,
                    s: size,
                    r: true, // reduce-only
                    t: { trigger: { isMarket: true, triggerPx: tp, tpsl: "tp" } },
                });
            }
    
            // 5️⃣ Add SL order if provided
            if (sl) {
                orders.push({
                    a: asset,
                    b: side === "buy" ? false : true, // opposite side
                    p: sl,
                    s: size,
                    r: true, // reduce-only
                    t: { trigger: { isMarket: true, triggerPx: sl, tpsl: "sl" } },
                });
            }
    
            // 6️⃣ Place all orders
            const orderResult = await agentExchClient.order({ orders, grouping: (tp !== "" && sl !== "") ? "na" : "normalTpsl" });
    
            console.log("📝 Order response:", orderResult);
            return orderResult;
        } catch (error) {
            console.error("❌ Failed to place order:", error);
            throw error;
        }
    }    
}
