"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getUserDetails, registerUser } from "services/user.service";
import Login from "@/components/Login";
import { saveUserData } from "../../utils/userStorage";

declare global {
  interface Window {
    keplr?: any;
    getOfflineSigner?: any;
  }
}

const INJECTIVE_CHAIN_ID = "injective-1";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Injective Insights",
    desc: "Real-time analysis of INJ and the broader Injective ecosystem.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "On-chain Intelligence",
    desc: "Understand wallet flows, staking, validators, and network activity.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: "Perp Market Analysis",
    desc: "Funding rates, orderbook behavior, and open interest on Injective perps.",
  },
];

const SignInPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeplrConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!window.keplr) {
        setError("Keplr wallet not found. Please install the Keplr extension.");
        return;
      }

      await window.keplr.enable(INJECTIVE_CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(INJECTIVE_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      const address = accounts[0]?.address;

      if (!address) {
        setError("Could not retrieve address from Keplr.");
        return;
      }

      const existingUser = await getUserDetails(address);
      if (existingUser?.exists) {
        saveUserData({
          userId: existingUser.data._id,
          uniqueWalletId: existingUser.data.uniqueWalletId,
          walletAddress: existingUser.data.walletAddress,
          apiWallet: existingUser.data.apiWallet,
        });
        router.push("/chat");
        return;
      }

      const agentKey = generatePrivateKey();
      const agentAccount = privateKeyToAccount(agentKey);

      const reg = await registerUser(address, address, {
        address: agentAccount.address,
        privateKey: agentKey,
      });

      if (reg?.data) {
        saveUserData({
          userId: reg.data._id,
          uniqueWalletId: reg.data.uniqueWalletId,
          walletAddress: reg.data.walletAddress,
          apiWallet: reg.data.apiWallet,
        });
      }

      router.push("/chat");
    } catch (err: any) {
      setError(err?.message || "Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Login title="HyperInj" image="/images/login-pic-1.png" signIn>
      <div className="mb-8 space-y-6">
        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-base-2 leading-tight">
            Your AI Copilot for{" "}
            <span className="text-brand-600">Injective</span>
          </h1>
          <p className="text-sm text-base-2/60 leading-relaxed">
            Understand the Injective ecosystem, on-chain activity, and market
            behavior — without the noise.
          </p>
        </div>

        {/* Feature cards */}
        <div className="space-y-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-4 rounded-xl border border-theme-stroke bg-theme-on-surface-1 transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-base-2 mb-0.5">{f.title}</h3>
                <p className="text-xs text-base-2/60 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <p className="text-xs text-base-2/40 text-center">
          No trade execution · No financial promises · Pure data-driven insights
        </p>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <button
          className="btn-primary w-full rounded-xl h-14 text-base font-semibold flex items-center justify-center gap-2"
          onClick={handleKeplrConnect}
          disabled={loading}
          type="button"
        >
          <img src="/images/tokens/inj.svg" alt="INJ" className="w-5 h-5" />
          {loading ? "Connecting…" : "Open AI Assistant"}
        </button>

        {error && (
          <p className="text-sm text-theme-red text-center">{error}</p>
        )}
      </div>
    </Login>
  );
};

export default SignInPage;
