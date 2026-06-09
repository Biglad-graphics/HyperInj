"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../contexts/WalletContext";
import Login from "@/components/Login";

declare global {
  interface Window { keplr?: any; getOfflineSigner?: any; }
}

const SignInPage = () => {
  const { isConnected, isInstalled, connecting, error, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/explore");
  }, [isConnected, router]);

  return (
    <Login title="HyperInj" image="/images/login-pic-1.png" signIn>
      <div className="mb-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-base-2 leading-tight">
            Token-Gated Content on{" "}
            <span className="text-brand-600">Injective</span>
          </h1>
          <p className="text-sm text-base-2/60 leading-relaxed">
            Connect your Keplr wallet. Your INJ balance determines which creators you can access.
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            { title: "Gate content with INJ", desc: "Creators set an INJ requirement. Fans unlock access by holding tokens." },
            { title: "On-chain access control", desc: "Your wallet balance is checked in real time via Injective mainnet." },
            { title: "No keys, no custody", desc: "Read-only balance check — your funds stay safe at all times." },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-theme-stroke bg-theme-on-surface-1">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-600 mt-1.5" />
              <div>
                <h3 className="font-semibold text-sm text-base-2 mb-0.5">{f.title}</h3>
                <p className="text-xs text-base-2/60 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-base-2/40 text-center">
          No trading · No financial advice · Read-only wallet access
        </p>
      </div>

      <div className="space-y-3">
        {!isInstalled ? (
          <a
            href="https://www.keplr.app/download"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full rounded-xl h-14 text-base font-semibold flex items-center justify-center"
          >
            Install Keplr Extension
          </a>
        ) : (
          <button
            className="btn-primary w-full rounded-xl h-14 text-base font-semibold flex items-center justify-center gap-2"
            onClick={connect}
            disabled={connecting}
            type="button"
          >
            {connecting ? "Connecting…" : "Connect Keplr Wallet"}
          </button>
        )}
        {error && <p className="text-sm text-theme-red text-center">{error}</p>}
      </div>
    </Login>
  );
};

export default SignInPage;
