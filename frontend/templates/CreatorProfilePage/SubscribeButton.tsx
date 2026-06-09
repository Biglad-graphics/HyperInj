"use client";

import { useAppStore } from "../../store/useAppStore";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";

export default function SubscribeButton({ creatorId }: { creatorId: string }) {
  const { address, isConnected } = useWallet();
  const { isSubscribed, subscribe, unsubscribe } = useAppStore();

  const subscribed = isSubscribed(address ?? null, creatorId);

  const handleClick = () => {
    if (!isConnected || !address) return;
    if (subscribed) {
      unsubscribe(address, creatorId);
    } else {
      subscribe(address, creatorId);
    }
  };

  if (!isConnected) {
    return (
      <button
        disabled
        className="h-9 px-4 rounded-xl text-body-2s font-medium border border-theme-stroke text-theme-tertiary cursor-not-allowed opacity-60"
        title="Connect wallet to subscribe"
      >
        Subscribe
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`h-9 px-4 rounded-xl text-body-2s font-medium transition-all ${
        subscribed
          ? "bg-theme-green/10 border border-theme-green/30 text-theme-green hover:bg-theme-red/10 hover:border-theme-red/30 hover:text-theme-red"
          : "btn-primary"
      }`}
    >
      {subscribed ? "Subscribed ✓" : "Subscribe"}
    </button>
  );
}
