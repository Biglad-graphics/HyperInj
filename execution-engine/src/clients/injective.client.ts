import {
  IndexerGrpcAccountPortfolioApi,
  IndexerGrpcDerivativesApi,
  MsgBroadcasterWithPk,
  MsgCreateDerivativeMarketOrder,
  MsgCreateSpotMarketOrder,
  PrivateKey,
  getDefaultSubaccountId,
  IndexerGrpcSpotApi,
} from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";

const NETWORK = (process.env.INJECTIVE_NETWORK === "testnet" ? Network.Testnet : Network.Mainnet);
const endpoints = getNetworkEndpoints(NETWORK);

const portfolioApi = new IndexerGrpcAccountPortfolioApi(endpoints.indexer);
const derivativesApi = new IndexerGrpcDerivativesApi(endpoints.indexer);
const spotApi = new IndexerGrpcSpotApi(endpoints.indexer);

// Default fee recipient — injective burn address used as placeholder
const DEFAULT_FEE_RECIPIENT = "inj1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg";

export class InjectiveClient {
  /**
   * Fetch account portfolio for a given Injective address.
   */
  static async getPortfolio(injectiveAddress: string) {
    const portfolio = await portfolioApi.fetchAccountPortfolio(injectiveAddress);
    return portfolio;
  }

  /**
   * Get withdrawable balance (sum of bank USDT balance).
   */
  static async getAvailableBalance(injectiveAddress: string): Promise<string> {
    const portfolio = await portfolioApi.fetchAccountPortfolio(injectiveAddress);
    let totalUsdt = 0;
    const balances = (portfolio as any)?.bankBalancesList ?? (portfolio as any)?.bankBalances ?? [];
    for (const bal of balances) {
      // USDT peggy denom
      if (bal.denom === "peggy0xdAC17F958D2ee523a2206206994597C13D831ec7") {
        totalUsdt += parseFloat(bal.amount) / 1e6;
      }
    }
    return totalUsdt.toFixed(2);
  }

  /**
   * Place a derivative (perpetual) market order on Injective.
   */
  static async placeDerivativeOrder(
    privateKeyHex: string,
    marketId: string,
    quantity: string,
    side: "buy" | "sell",
    margin: string
  ) {
    const privateKey = PrivateKey.fromHex(privateKeyHex);
    const injectiveAddress = privateKey.toBech32();
    const subaccountId = getDefaultSubaccountId(privateKey.toBech32());

    // Fetch current order book to get best price
    const orderbook = await derivativesApi.fetchOrderbook(marketId) as any;
    const buys: any[] = orderbook?.buys ?? orderbook?.buys ?? [];
    const sells: any[] = orderbook?.sells ?? orderbook?.sells ?? [];
    const bestPrice =
      side === "buy"
        ? (buys[0]?.price ?? "0")
        : (sells[0]?.price ?? "0");

    const msg = MsgCreateDerivativeMarketOrder.fromJSON({
      injectiveAddress,
      subaccountId,
      marketId,
      feeRecipient: DEFAULT_FEE_RECIPIENT,
      orderType: side === "buy" ? 1 : 2, // 1=BUY, 2=SELL
      price: bestPrice,
      quantity,
      margin,
    });

    const broadcaster = new MsgBroadcasterWithPk({
      privateKey: privateKeyHex,
      network: NETWORK,
    });

    const result = await broadcaster.broadcast({ msgs: msg });
    return result;
  }

  /**
   * Place a spot market order on Injective.
   */
  static async placeSpotOrder(
    privateKeyHex: string,
    marketId: string,
    quantity: string,
    side: "buy" | "sell"
  ) {
    const privateKey = PrivateKey.fromHex(privateKeyHex);
    const injectiveAddress = privateKey.toBech32();
    const subaccountId = getDefaultSubaccountId(privateKey.toBech32());

    const orderbook = await spotApi.fetchOrderbook(marketId) as any;
    const buys: any[] = orderbook?.buys ?? [];
    const sells: any[] = orderbook?.sells ?? [];
    const bestPrice =
      side === "buy"
        ? (buys[0]?.price ?? "0")
        : (sells[0]?.price ?? "0");

    const msg = MsgCreateSpotMarketOrder.fromJSON({
      injectiveAddress,
      subaccountId,
      marketId,
      feeRecipient: DEFAULT_FEE_RECIPIENT,
      orderType: side === "buy" ? 1 : 2,
      price: bestPrice,
      quantity,
    });

    const broadcaster = new MsgBroadcasterWithPk({
      privateKey: privateKeyHex,
      network: NETWORK,
    });

    const result = await broadcaster.broadcast({ msgs: msg });
    return result;
  }
}
