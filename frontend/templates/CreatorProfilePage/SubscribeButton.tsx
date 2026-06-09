"use client";

import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";
import { broadcastSubscriptionTx } from "../../services/injectiveTx";

type State = "idle" | "signing" | "broadcasting" | "done" | "error";

export default function SubscribeButton({ creatorId }: { creatorId: string }) {
  const { address, isConnected } = useWallet();
  const { isSubscribed, subscribe, unsubscribe } = useAppStore();
  const [txState, setTxState] = useState<State>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const subscribed = isSubscribed(address ?? null, creatorId);

  const handleSubscribe = async () => {
    if (!isConnected || !address) return;
    setErrMsg(null);
    setTxState("signing");

    try {
      setTxState("broadcasting");
      const { txHash } = await broadcastSubscriptionTx(address);
      setTxHash(txHash);
      subscribe(address, creatorId);
      setTxState("done");
    } catch (err: any) {
      setErrMsg(err?.message ?? "Transaction failed");
      setTxState("error");
    }
  };

  const handleUnsubscribe = () => {
    if (!address) return;
    unsubscribe(address, creatorId);
    setTxState("idle");
    setTxHash(null);
  };

  if (!isConnected) {
    return (
      <button
        disabled
        className="h-9 px-4 rounded-xl text-body-2s font-medium border border-theme-stroke text-theme-tertiary cursor-not-allowed opacity-60"
      >
        Subscribe
      </button>
    );
  }

  if (subscribed) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleUnsubscribe}
          className="h-9 px-4 rounded-xl text-body-2s font-medium bg-theme-green/10 border border-theme-green/30 text-theme-green hover:bg-theme-red/10 hover:border-theme-red/30 hover:text-theme-red transition-all"
        >
          Subscribed ✓
        </button>
        {txHash && (
          <a
            href={`https://explorer.injective.network/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption-1m text-theme-tertiary hover:text-brand-600 transition-colors"
          >
            View on explorer ↗
          </a>
        )}
      </div>
    );
  }

  const busy = txState === "signing" || txState === "broadcasting";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSubscribe}
        disabled={busy}
        className="h-9 px-4 rounded-xl text-body-2s font-medium btn-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all min-w-[7rem]"
      >
        {txState === "signing" && (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
            Approve…
          </span>
        )}
        {txState === "broadcasting" && (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
            Broadcasting…
          </span>
        )}
        {(txState === "idle" || txState === "error") && "Subscribe"}
      </button>

      {txState === "error" && errMsg && (
        <span className="text-caption-1m text-theme-red max-w-[16rem] text-right leading-tight">
          {errMsg}
        </span>
      )}
    </div>
  );
}
