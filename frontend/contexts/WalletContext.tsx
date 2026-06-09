"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getUserData, saveUserData, clearUserData } from "../utils/userStorage";

const INJECTIVE_CHAIN_ID = "injective-1";

async function fetchInjBalance(address: string): Promise<number> {
  try {
    const res = await fetch(
      `https://sentry.lcd.injective.network/cosmos/bank/v1beta1/balances/${address}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    const inj = (data.balances ?? []).find((b: any) => b.denom === "inj");
    return inj ? parseFloat(inj.amount) / 1e18 : 0;
  } catch {
    return 0;
  }
}

interface WalletState {
  address: string | null;
  injBalance: number;
  isConnected: boolean;
  isInstalled: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({
  address: null,
  injBalance: 0,
  isConnected: false,
  isInstalled: false,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  refreshBalance: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [injBalance, setInjBalance] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check keplr installed + restore session from localStorage on mount
  useEffect(() => {
    const installed = typeof window !== "undefined" && !!window.keplr;
    setIsInstalled(installed);

    const saved = getUserData();
    if (saved?.walletAddress) {
      setAddress(saved.walletAddress);
      fetchInjBalance(saved.walletAddress).then(setInjBalance);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    const bal = await fetchInjBalance(address);
    setInjBalance(bal);
  }, [address]);

  const connect = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined" || !window.keplr) {
      setError("Keplr not found. Please install the Keplr extension.");
      return;
    }
    setConnecting(true);
    try {
      await window.keplr.enable(INJECTIVE_CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(INJECTIVE_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      const addr = accounts[0]?.address;
      if (!addr) throw new Error("Could not retrieve address from Keplr.");

      const bal = await fetchInjBalance(addr);
      setAddress(addr);
      setInjBalance(bal);

      saveUserData({
        userId: addr,
        uniqueWalletId: addr,
        walletAddress: addr,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to connect Keplr.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearUserData();
    setAddress(null);
    setInjBalance(0);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        injBalance,
        isConnected: !!address,
        isInstalled,
        connecting,
        error,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
