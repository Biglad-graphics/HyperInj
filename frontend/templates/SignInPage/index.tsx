"use client";

import { useEffect, useState, useRef } from "react";
import { useColorMode } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getUserDetails, registerUser } from "services/user.service";
import Login from "@/components/Login";
import { saveUserData } from "../../utils/userStorage";
import { toInjectiveAddress } from "../../utils/injectiveAddress";

declare global {
  interface Window {
    keplr?: any;
    getOfflineSigner?: any;
  }
}

const INJECTIVE_CHAIN_ID = "injective-1";

const SignInPage = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const hasRunRef = useRef(false);
  const [keplrLoading, setKeplrLoading] = useState(false);
  const [keplrError, setKeplrError] = useState<string | null>(null);

  // ── Privy EVM auth flow ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    (async () => {
      const wallet = wallets[0];
      if (!wallet) return;
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      const connectedWallet = wallet.address;

      const existingUser = await getUserDetails(user.id);
      if (existingUser?.exists) {
        saveUserData({
          userId: existingUser.data._id,
          uniqueWalletId: existingUser.data.uniqueWalletId,
          walletAddress: existingUser.data.walletAddress,
          apiWallet: existingUser.data.apiWallet,
        });
        router.push("/my-assets");
        return;
      }

      const agentPrivateKey = generatePrivateKey();
      const agentAccount = privateKeyToAccount(agentPrivateKey);

      const registrationResponse = await registerUser(user.id, connectedWallet, {
        address: agentAccount.address,
        privateKey: agentPrivateKey,
      });

      if (registrationResponse?.data) {
        saveUserData({
          userId: registrationResponse.data._id,
          uniqueWalletId: registrationResponse.data.uniqueWalletId,
          walletAddress: registrationResponse.data.walletAddress,
          apiWallet: registrationResponse.data.apiWallet,
        });
      }

      router.push("/my-assets");
    })();
  }, [ready, authenticated, user, wallets]);

  // ── Privy connect button ─────────────────────────────────────────────
  const handleConnectWallet = () => {
    if (authenticated) {
      logout().then(() => login());
    } else {
      login();
    }
  };

  // ── Keplr connect button ─────────────────────────────────────────────
  const handleKeplrConnect = async () => {
    setKeplrError(null);
    setKeplrLoading(true);
    try {
      if (!window.keplr) {
        setKeplrError("Keplr extension not found. Please install it first.");
        setKeplrLoading(false);
        return;
      }

      await window.keplr.enable(INJECTIVE_CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(INJECTIVE_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      const injectiveAddress = accounts[0]?.address;

      if (!injectiveAddress) {
        setKeplrError("Could not get address from Keplr.");
        setKeplrLoading(false);
        return;
      }

      // Use injective address as the unique wallet ID
      const existingUser = await getUserDetails(injectiveAddress);
      if (existingUser?.exists) {
        saveUserData({
          userId: existingUser.data._id,
          uniqueWalletId: existingUser.data.uniqueWalletId,
          walletAddress: existingUser.data.walletAddress,
          apiWallet: existingUser.data.apiWallet,
        });
        router.push("/my-assets");
        return;
      }

      // New user — generate an agent wallet and register
      const agentPrivateKey = generatePrivateKey();
      const agentAccount = privateKeyToAccount(agentPrivateKey);

      const registrationResponse = await registerUser(injectiveAddress, injectiveAddress, {
        address: agentAccount.address,
        privateKey: agentPrivateKey,
      });

      if (registrationResponse?.data) {
        saveUserData({
          userId: registrationResponse.data._id,
          uniqueWalletId: registrationResponse.data.uniqueWalletId,
          walletAddress: registrationResponse.data.walletAddress,
          apiWallet: registrationResponse.data.apiWallet,
        });
      }

      router.push("/my-assets");
    } catch (err: any) {
      console.error("Keplr connect error:", err);
      setKeplrError(err?.message || "Failed to connect Keplr.");
    } finally {
      setKeplrLoading(false);
    }
  };

  return (
    <Login title="HyperInj" image="/images/login-pic-1.png" signIn>
      <div className="mb-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-base-2 leading-tight">
            Trade with <span className="text-yellow-200">Intelligence</span>
          </h1>
        </div>

        <div className="space-y-3">
          <div className="group flex items-start gap-4 p-4 rounded-xl border border-theme-stroke hover:border-brand-600/30 bg-theme-on-surface-1 hover:shadow-sm transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-base-2 mb-1">Create Algorithmic Signals</h3>
              <p className="text-sm text-base-2/70 leading-relaxed">Build algorithmic buy/sell quant strategies in plain language.</p>
            </div>
          </div>

          <div className="group flex items-start gap-4 p-4 rounded-xl border border-theme-stroke hover:border-brand-600/30 bg-theme-on-surface-1 hover:shadow-sm transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-base-2 mb-1">Autonomous Agentic Verification</h3>
              <p className="text-sm text-base-2/70 leading-relaxed">AI agents analyze signals <span className="font-medium text-base-2">"(technical & sentiment)"</span> before execution</p>
            </div>
          </div>

          <div className="group flex items-start gap-4 p-4 rounded-xl border border-theme-stroke hover:border-brand-600/30 bg-theme-on-surface-1 hover:shadow-sm transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-base-2 mb-1">Live on Injective</h3>
              <p className="text-sm text-base-2/70 leading-relaxed">Automated execution and real-time position management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Keplr */}
        <button
          className="btn-primary w-full rounded-xl h-14 text-base font-semibold flex items-center justify-center gap-2"
          onClick={handleKeplrConnect}
          disabled={keplrLoading}
          type="button"
        >
          <img src="/images/tokens/inj.svg" alt="Keplr" className="w-5 h-5" />
          {keplrLoading ? "Connecting…" : "Connect with Keplr"}
        </button>

        {/* EVM wallets via Privy */}
        <button
          className="w-full rounded-xl h-14 text-base font-semibold border border-theme-stroke hover:bg-theme-on-surface-2 transition-colors flex items-center justify-center gap-2"
          onClick={handleConnectWallet}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M21 8V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v1m18 0v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8m18 0H3m15 5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Connect EVM Wallet
        </button>

        {keplrError && (
          <p className="text-sm text-theme-red text-center">{keplrError}</p>
        )}
      </div>
    </Login>
  );
};

export default SignInPage;
