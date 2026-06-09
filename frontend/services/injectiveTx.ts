"use client";

import {
  MsgSend,
  createTransactionAndCosmosSignDocForAddressAndMsg,
  createTxRawFromSigResponse,
  TxGrpcApi,
} from "@injectivelabs/sdk-ts";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";

const ENDPOINTS = getNetworkEndpoints(Network.Mainnet);
const CHAIN_ID = "injective-1";
// 0.0001 INJ sent to self — nominal amount to prove on-chain intent
const SUBSCRIPTION_AMOUNT = "100000000000000"; // in aINJ (1e18)

export interface TxResult {
  txHash: string;
}

export async function broadcastSubscriptionTx(fromAddress: string): Promise<TxResult> {
  if (typeof window === "undefined" || !window.keplr) {
    throw new Error("Keplr not installed");
  }

  await window.keplr.enable(CHAIN_ID);

  const msg = MsgSend.fromJSON({
    srcInjectiveAddress: fromAddress,
    dstInjectiveAddress: fromAddress, // self-send to record intent on-chain
    amount: { denom: "inj", amount: SUBSCRIPTION_AMOUNT },
  });

  const { cosmosSignDoc } =
    await createTransactionAndCosmosSignDocForAddressAndMsg({
      address: fromAddress,
      message: msg,
      endpoint: ENDPOINTS.rest,
      memo: "HyperInj: subscribe",
      chainId: CHAIN_ID,
    });

  const signResponse = await window.keplr.signDirect(CHAIN_ID, fromAddress, {
    bodyBytes: cosmosSignDoc.bodyBytes,
    authInfoBytes: cosmosSignDoc.authInfoBytes,
    chainId: CHAIN_ID,
    accountNumber: cosmosSignDoc.accountNumber,
  });

  const txRaw = createTxRawFromSigResponse(signResponse);
  const txApi = new TxGrpcApi(ENDPOINTS.grpc);
  const response = await txApi.broadcast(txRaw);

  if (response.code !== 0) {
    throw new Error(response.rawLog ?? "Transaction failed");
  }

  return { txHash: response.txHash };
}
