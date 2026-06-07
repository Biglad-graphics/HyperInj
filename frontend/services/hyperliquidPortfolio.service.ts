import {
  IndexerGrpcAccountPortfolioApi,
  IndexerGrpcDerivativesApi,
  IndexerGrpcSpotApi,
} from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";

const endpoints = getNetworkEndpoints(Network.Mainnet);

const portfolioApi = new IndexerGrpcAccountPortfolioApi(
  endpoints.indexer
);
const derivativesApi = new IndexerGrpcDerivativesApi(endpoints.indexer);
const spotApi = new IndexerGrpcSpotApi(endpoints.indexer);

export const getUserPortfolio = async (injectiveAddress: string) => {
  const portfolio = await portfolioApi.fetchAccountPortfolio(injectiveAddress);
  return portfolio;
};

export const getOpenOrders = async (injectiveAddress: string) => {
  const [spotOrders, derivativeOrders] = await Promise.all([
    spotApi.fetchOrders({ subaccountId: injectiveAddress }),
    derivativesApi.fetchOrders({ subaccountId: injectiveAddress }),
  ]);
  return { spotOrders, derivativeOrders };
};

export const getUserPositions = async (injectiveAddress: string) => {
  const positions = await derivativesApi.fetchPositions({
    address: injectiveAddress,
  });
  return positions;
};

export const getUserTradeHistory = async (injectiveAddress: string) => {
  const [spotTrades, derivativeTrades] = await Promise.all([
    spotApi.fetchTrades({ subaccountId: injectiveAddress }),
    derivativesApi.fetchTrades({ subaccountId: injectiveAddress }),
  ]);
  return { spotTrades, derivativeTrades };
};
