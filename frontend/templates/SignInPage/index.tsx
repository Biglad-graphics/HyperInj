"use client";

import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";
import Login from "@/components/Login";

const SignInPage = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { isConnected, isInstalled, connecting, error, connect } = useWallet();

  useEffect(() => {
    if (isConnected) router.push("/explore");
  }, [isConnected, router]);

  return (
    <Login title="HyperInj" image="/images/login-pic-1.png" signIn>
      <div className="mb-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-base-2 leading-tight">
            Token-Gated Creator Platform{" "}
            <span className="text-yellow-200">on Injective</span>
          </h1>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-xl border border-theme-stroke bg-theme-on-surface-1">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-base text-base-2 mb-1">Token-Gated Access</h3>
              <p className="text-sm text-base-2/70">Hold INJ to unlock exclusive creator content</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-theme-stroke bg-theme-on-surface-1">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-base text-base-2 mb-1">Creator Tools</h3>
              <p className="text-sm text-base-2/70">Publish posts, set access tiers, and grow your audience</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-theme-stroke bg-theme-on-surface-1">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-base text-base-2 mb-1">AI Assistant</h3>
              <p className="text-sm text-base-2/70">AI-powered content suggestions and on-chain analysis</p>
            </div>
          </div>
        </div>
      </div>

      {!isInstalled ? (
        <a
          href="https://www.keplr.app/download"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full rounded-xl h-14 text-base font-semibold flex items-center justify-center gap-2"
        >
          Install Keplr Wallet
        </a>
      ) : (
        <button
          className="btn-primary w-full rounded-xl h-14 text-base font-semibold"
          onClick={connect}
          disabled={connecting}
          type="button"
        >
          {connecting ? "Connecting…" : "Connect Keplr Wallet"}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-center text-red-400">{error}</p>
      )}
    </Login>
  );
};

export default SignInPage;
