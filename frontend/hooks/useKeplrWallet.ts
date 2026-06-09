"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUserData, saveUserData, clearUserData } from "../utils/userStorage";

const CHAIN_ID = "injective-1";

declare global {
  interface Window {
    keplr?: any;
    getOfflineSigner?: any;
  }
}

export type WalletError =
  | "not_installed"
  | "rejected"
  | "locked"
  | "no_account"
  | "unknown";

function classifyError(err: any): WalletError {
  if (!err) return "unknown";
  const msg: string = (err.message ?? "").toLowerCase();
  if (msg.includes("key") && msg.includes("not exist")) return "no_account";
  if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel"))
    return "rejected";
  if (msg.includes("unlock") || msg.includes("locked")) return "locked";
  return "unknown";
}

const ERROR_MESSAGES: Record<WalletError, string> = {
  not_installed: "Install Keplr",
  rejected: "Connection cancelled",
  locked: "Unlock Keplr first",
  no_account: "No account found in Keplr",
  unknown: "Connection failed",
};

async function fetchBalance(address: string): Promise<number> {
  try {
    const res = await fetch(
      `https://sentry.lcd.injective.network/cosmos/bank/v1beta1/balances/${address}`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const inj = (data.balances ?? []).find((b: any) => b.denom === "inj");
    return inj ? parseFloat(inj.amount) / 1e18 : 0;
  } catch {
    return 0;
  }
}

async function readKeplrAccount(): Promise<string> {
  if (typeof window === "undefined" || !window.keplr)
    throw Object.assign(new Error("Keplr not installed"), { type: "not_installed" });

  await window.keplr.enable(CHAIN_ID);
  const signer = window.keplr.getOfflineSigner(CHAIN_ID);
  const accounts = await signer.getAccounts();
  const addr = accounts[0]?.address;
  if (!addr) throw Object.assign(new Error("No account found"), { type: "no_account" });
  return addr;
}

export interface KeplrWallet {
  // State
  walletAddress: string | null;
  balance: number;
  isConnected: boolean;
  isInstalled: boolean;
  isConnecting: boolean;
  isSwitching: boolean;
  error: string | null;
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchAccount: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

export function useKeplrWallet(): KeplrWallet {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mount to avoid state updates after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Init: detect Keplr + auto-reconnect ─────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const installed = !!window.keplr;
    setIsInstalled(installed);

    const saved = getUserData();
    if (!saved?.walletAddress) return;

    // Try to silently restore the session
    (async () => {
      try {
        if (!installed) {
          // Keplr not installed anymore — clear stale session
          clearUserData();
          return;
        }
        // Re-enable to verify session is still valid
        await window.keplr.enable(CHAIN_ID);
        const signer = window.keplr.getOfflineSigner(CHAIN_ID);
        const accounts = await signer.getAccounts();
        const addr = accounts[0]?.address;

        if (!addr || !mounted.current) return;

        // If Keplr's current account differs from stored, use Keplr's
        const live = addr;
        saveUserData({ userId: live, uniqueWalletId: live, walletAddress: live });
        setWalletAddress(live);
        const bal = await fetchBalance(live);
        if (mounted.current) setBalance(bal);
      } catch {
        // Silent fail — user will click Connect manually
        clearUserData();
      }
    })();
  }, []);

  // ── keplr_keystorechange listener ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyChange = async () => {
      // Only react if we were connected
      if (!walletAddress) return;
      try {
        const addr = await readKeplrAccount();
        if (!mounted.current) return;
        saveUserData({ userId: addr, uniqueWalletId: addr, walletAddress: addr });
        setWalletAddress(addr);
        setError(null);
        const bal = await fetchBalance(addr);
        if (mounted.current) setBalance(bal);
        // Dispatch a custom event so UI can show toast
        window.dispatchEvent(new CustomEvent("wallet:account_changed"));
      } catch {
        // Keplr locked or disconnected
        clearUserData();
        if (mounted.current) {
          setWalletAddress(null);
          setBalance(0);
        }
      }
    };

    window.addEventListener("keplr_keystorechange", handleKeyChange);
    return () => window.removeEventListener("keplr_keystorechange", handleKeyChange);
  }, [walletAddress]);

  // ── connectWallet ────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined" || !window.keplr) {
      setError(ERROR_MESSAGES.not_installed);
      return;
    }
    setIsConnecting(true);
    try {
      const addr = await readKeplrAccount();
      if (!mounted.current) return;
      const bal = await fetchBalance(addr);
      if (!mounted.current) return;

      setWalletAddress(addr);
      setBalance(bal);
      saveUserData({ userId: addr, uniqueWalletId: addr, walletAddress: addr });
    } catch (err: any) {
      if (!mounted.current) return;
      const type: WalletError = err.type ?? classifyError(err);
      setError(ERROR_MESSAGES[type]);
    } finally {
      if (mounted.current) setIsConnecting(false);
    }
  }, []);

  // ── switchAccount ────────────────────────────────────────────────────────
  // Re-calls enable() which opens the Keplr account picker
  const switchAccount = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined" || !window.keplr) return;
    setIsSwitching(true);
    try {
      const addr = await readKeplrAccount();
      if (!mounted.current) return;
      const bal = await fetchBalance(addr);
      if (!mounted.current) return;

      setWalletAddress(addr);
      setBalance(bal);
      saveUserData({ userId: addr, uniqueWalletId: addr, walletAddress: addr });
      window.dispatchEvent(new CustomEvent("wallet:account_switched"));
    } catch (err: any) {
      if (!mounted.current) return;
      const type: WalletError = err.type ?? classifyError(err);
      // Don't show error if user just closed the modal
      if (type !== "rejected") setError(ERROR_MESSAGES[type]);
    } finally {
      if (mounted.current) setIsSwitching(false);
    }
  }, []);

  // ── disconnectWallet ─────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    clearUserData();
    setWalletAddress(null);
    setBalance(0);
    setError(null);
  }, []);

  // ── refreshBalance ───────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    const bal = await fetchBalance(walletAddress);
    if (mounted.current) setBalance(bal);
  }, [walletAddress]);

  const clearError = useCallback(() => setError(null), []);

  return {
    walletAddress,
    balance,
    isConnected: !!walletAddress,
    isInstalled,
    isConnecting,
    isSwitching,
    error,
    connectWallet,
    disconnectWallet,
    switchAccount,
    refreshBalance,
    clearError,
  };
}
