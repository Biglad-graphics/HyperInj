"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useKeplrWallet, KeplrWallet } from "../hooks/useKeplrWallet";

// Context shape mirrors KeplrWallet exactly — no duplication
const WalletContext = createContext<KeplrWallet>({
  walletAddress: null,
  balance: 0,
  isConnected: false,
  isInstalled: false,
  isConnecting: false,
  isSwitching: false,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchAccount: async () => {},
  refreshBalance: async () => {},
  clearError: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useKeplrWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): KeplrWallet {
  return useContext(WalletContext);
}

// ── Legacy aliases so existing pages don't break ──────────────────────────
// Components that used { address, injBalance, connect, disconnect, connecting }
// can adopt the new API at their own pace.
export function useWalletCompat() {
  const w = useWallet();
  return {
    ...w,
    address: w.walletAddress,
    injBalance: w.balance,
    connect: w.connectWallet,
    disconnect: w.disconnectWallet,
    connecting: w.isConnecting,
  };
}
