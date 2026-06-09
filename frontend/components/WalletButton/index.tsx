"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "../../contexts/WalletContext";
import Icon from "@/components/Icon";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke shadow-depth-1 animate-fade-in-up">
      <div className="w-2 h-2 rounded-full bg-theme-green shrink-0" />
      <span className="text-body-2s text-theme-primary font-medium whitespace-nowrap">{message}</span>
    </div>
  );
}

// ── Address format ─────────────────────────────────────────────────────────
function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Main component ─────────────────────────────────────────────────────────
type WalletButtonProps = {
  className?: string;
};

export default function WalletButton({ className = "" }: WalletButtonProps) {
  const {
    walletAddress,
    balance,
    isConnected,
    isInstalled,
    isConnecting,
    isSwitching,
    error,
    connectWallet,
    disconnectWallet,
    switchAccount,
    clearError,
  } = useWallet();

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Listen for wallet events dispatched by the hook
  useEffect(() => {
    const onChanged = () => showToast("Wallet account changed");
    const onSwitched = () => showToast("Account switched");
    window.addEventListener("wallet:account_changed", onChanged);
    window.addEventListener("wallet:account_switched", onSwitched);
    return () => {
      window.removeEventListener("wallet:account_changed", onChanged);
      window.removeEventListener("wallet:account_switched", onSwitched);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1800);
      showToast("Address copied");
    } catch {
      // Fallback: select text via prompt
      window.prompt("Copy address:", walletAddress);
    }
    setOpen(false);
  }, [walletAddress, showToast]);

  const handleSwitch = useCallback(async () => {
    setOpen(false);
    await switchAccount();
  }, [switchAccount]);

  const handleDisconnect = useCallback(() => {
    setOpen(false);
    disconnectWallet();
  }, [disconnectWallet]);

  // ── Not installed ─────────────────────────────────────────────────────
  if (!isInstalled) {
    return (
      <a
        href="https://www.keplr.app/download"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 btn-secondary text-sm ${className}`}
      >
        Install Keplr
        <Icon className="w-3.5 h-3.5 fill-theme-secondary" name="arrow-up-right-thin" />
      </a>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className={`flex flex-col items-end gap-1 ${className}`}>
        <button
          className="inline-flex items-center gap-2 btn-primary text-sm h-10 px-5"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
              Connecting…
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
              Connect Keplr
            </>
          )}
        </button>
        {error && (
          <span className="text-xs text-theme-red flex items-center gap-1">
            {error}
            <button onClick={clearError} className="underline opacity-60 hover:opacity-100">
              dismiss
            </button>
          </span>
        )}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────
  return (
    <>
      <div className={`relative flex items-center ${className}`}>
        {/* Address button */}
        <button
          ref={buttonRef}
          onClick={() => setOpen((v) => !v)}
          className={`group inline-flex items-center gap-2 h-10 px-4 rounded-xl border transition-all duration-150 select-none
            ${open
              ? "bg-theme-on-surface-1 border-brand-600/60 shadow-[0_0_0_3px_rgba(12,104,233,0.12)]"
              : "bg-theme-on-surface-1 border-theme-stroke hover:border-brand-600/40"
            }`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          {/* Status dot */}
          <span className="w-2 h-2 rounded-full bg-theme-green shrink-0" />

          {/* Address */}
          <span className="font-mono text-sm text-theme-primary leading-none">
            {shortAddr(walletAddress!)}
          </span>

          {/* Chevron */}
          <Icon
            className={`w-4 h-4 fill-theme-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            name="arrow-down"
          />
        </button>

        {/* Dropdown */}
        <div
          ref={dropdownRef}
          className={`absolute top-full right-0 mt-2 w-[17rem] rounded-2xl border border-theme-stroke bg-theme-surface-pure shadow-depth-1 overflow-hidden
            transition-all duration-150 origin-top-right
            ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
          role="menu"
        >
          {/* Account info header */}
          <div className="px-4 py-3 border-b border-theme-stroke bg-theme-on-surface-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-theme-green shrink-0" />
              <span className="text-caption-1m text-theme-secondary">Connected via Keplr</span>
            </div>
            <div className="font-mono text-sm text-theme-primary truncate">{walletAddress}</div>
            <div className="text-caption-1m text-theme-tertiary mt-0.5">
              {balance.toFixed(4)} INJ
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5 space-y-0.5">
            {/* Copy address */}
            <button
              onClick={handleCopy}
              className="group w-full flex items-center gap-3 h-10 px-3 rounded-xl text-body-2s text-theme-secondary hover:bg-theme-on-surface-2 hover:text-theme-primary transition-colors"
              role="menuitem"
            >
              <Icon className="w-4 h-4 fill-theme-secondary group-hover:fill-theme-primary transition-colors shrink-0" name="copy" />
              {copyDone ? (
                <span className="text-theme-green">Copied!</span>
              ) : (
                "Copy Address"
              )}
            </button>

            {/* Switch account */}
            <button
              onClick={handleSwitch}
              disabled={isSwitching}
              className="group w-full flex items-center gap-3 h-10 px-3 rounded-xl text-body-2s text-theme-secondary hover:bg-theme-on-surface-2 hover:text-theme-primary transition-colors disabled:opacity-50"
              role="menuitem"
            >
              {isSwitching ? (
                <span className="w-4 h-4 rounded-full border-2 border-theme-secondary/30 border-t-theme-secondary animate-spin shrink-0" />
              ) : (
                <Icon className="w-4 h-4 fill-theme-secondary group-hover:fill-theme-primary transition-colors shrink-0" name="refresh" />
              )}
              {isSwitching ? "Opening Keplr…" : "Switch Account"}
            </button>

            {/* Divider */}
            <div className="h-px bg-theme-stroke mx-2 my-1" />

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="group w-full flex items-center gap-3 h-10 px-3 rounded-xl text-body-2s text-theme-secondary hover:bg-theme-red/8 hover:text-theme-red transition-colors"
              role="menuitem"
            >
              <Icon className="w-4 h-4 fill-theme-secondary group-hover:fill-theme-red transition-colors shrink-0" name="logout" />
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
