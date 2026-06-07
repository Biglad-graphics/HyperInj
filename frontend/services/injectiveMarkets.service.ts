import {
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
} from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";

const endpoints = getNetworkEndpoints(Network.Mainnet);
const spotApi = new IndexerGrpcSpotApi(endpoints.indexer);
const derivativesApi = new IndexerGrpcDerivativesApi(endpoints.indexer);

export interface MarketSummary {
  marketId: string;
  ticker: string;
  baseSymbol: string;
  quoteSymbol: string;
  lastPrice: string;
  change24h: number;
  volume24h: string;
}

export const getTopSpotMarkets = async (): Promise<MarketSummary[]> => {
  try {
    const markets = await spotApi.fetchMarkets();
    return markets.slice(0, 10).map((m: any) => ({
      marketId: m.marketId,
      ticker: m.ticker,
      baseSymbol: m.baseDenom?.replace("peggy", "").replace("factory/", "").split("/").pop() || m.ticker.split("/")[0],
      quoteSymbol: m.ticker.split("/")[1] || "USDT",
      lastPrice: "0",
      change24h: 0,
      volume24h: "0",
    }));
  } catch (error) {
    console.error("Error fetching spot markets:", error);
    return [];
  }
};

export const getTopDerivativeMarkets = async (): Promise<MarketSummary[]> => {
  try {
    const markets = await derivativesApi.fetchMarkets();
    return markets.slice(0, 10).map((m: any) => ({
      marketId: m.marketId,
      ticker: m.ticker,
      baseSymbol: m.ticker.split("/")[0],
      quoteSymbol: "USDT",
      lastPrice: "0",
      change24h: 0,
      volume24h: "0",
    }));
  } catch (error) {
    console.error("Error fetching derivative markets:", error);
    return [];
  }
};
