"use client";

import { useEffect, useState } from "react";
import { useColorMode } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  Chain,
  ClientConfig,
  createWalletClient,
  custom,
  EIP1193RequestFn,
  http,
  TransportConfig,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { getUserDetails, registerUser } from "services/user.service";
import Login from "@/components/Login";
import Field from "@/components/Field";
import { useWallets } from "@privy-io/react-auth";
import { saveUserData } from "../../utils/userStorage";
import { useRef } from "react";

const SignInPage = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) return;

    (async () => {
      const wallet = wallets[0]; // assuming user connected one wallet
      if (!wallet) return;
      
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      const connectedWallet = wallet.address;
      console.log("✅ Connected wallet:", connectedWallet);

      // STEP 1: Check if user exists in backend
      const existingUser = await getUserDetails(user.id);
      console.log(existingUser);
      if (existingUser?.exists) {
        console.log("User already registered:", existingUser);

        // Save user data to localStorage
        saveUserData({
          userId: existingUser.data._id,
          uniqueWalletId: existingUser.data.uniqueWalletId,
          walletAddress: existingUser.data.walletAddress,
          apiWallet: existingUser.data.apiWallet,
        });

        router.push("/my-assets");
        return;
      }

      // STEP 2: Create API wallet (agent)
      const agentPrivateKey = generatePrivateKey();
      const agentAccount = privateKeyToAccount(agentPrivateKey);
      console.log(
        "🆕 Generated agent wallet:",
        agentAccount.address,
        agentPrivateKey
      );

      // STEP 3: Ask user to sign a message approving the API wallet
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: wallet.address as `0x${string}`,
        chain: arbitrum, // or your desired chain
        transport: custom(provider),
      });

      // STEP 4: Register user with API wallet + signature
      const registrationResponse = await registerUser(user.id, connectedWallet, {
        address: agentAccount.address,
        privateKey: agentPrivateKey,
      });

      console.log("✅ User registered successfully", registrationResponse);

      // Save user data to localStorage
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

  const handleConnectWallet = () => {
    console.log("Connect wallet clicked");

    // If already authenticated, logout first to show the modal
    if (authenticated) {
      logout().then(() => {
        login();
      });
    } else {
      // This will open Privy's modal with wallet options
      login();
    }
  };

  return (
    <Login
      title="HyperInj"
      image="/images/login-pic-1.png"
      signIn
    >
      <div className="mb-8 space-y-6">
        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-base-2 leading-tight">
            Trade with{" "}
            <span className="text-yellow-200">Intelligence</span>
          </h1>
        </div>

        {/* Feature Grid */}
        <div className="space-y-3">
          {/* Feature 1 */}
          <div className="group flex items-start gap-4 p-4 rounded-xl border border-theme-stroke hover:border-brand-600/30 bg-theme-on-surface-1 hover:shadow-sm transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg
                className="w-5 h-5 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-base-2 mb-1">
                Create Algorithmic Signals
              </h3>
              <p className="text-sm text-base-2/70 leading-relaxed">
                Build algorithmic buy/sell quant strategies in plain language.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group flex items-start gap-4 p-4 rounded-xl border border-theme-stroke hover:border-brand-600/30 bg-theme-on-surface-1 hover:shadow-sm transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg
                className="w-5 h-5 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-base-2 mb-1">
                Autonomous Agentic Verification
              </h3>
              <p className="text-sm text-base-2/70 leading-relaxed">
                AI agents analyze signals{" "}
                <span className="font-medium text-base-2">
                  "(technical & sentiment)"
                </span>{" "}
                  before execution
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group flex items-start gap-4 p-4 rounded-xl border border-theme-stroke hover:border-brand-600/30 bg-theme-on-surface-1 hover:shadow-sm transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-brand-600/10">
              <svg
                className="w-5 h-5 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-base-2 mb-1">
                Live on Injective
              </h3>
              <p className="text-sm text-base-2/70 leading-relaxed">
                Automated execution and real-time position management
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        className="btn-primary w-full rounded-xl h-14 text-base font-semibold"
        onClick={handleConnectWallet}
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 24 24"
          className="mr-2"
        >
          <path
            d="M21 8V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v1m18 0v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8m18 0H3m15 5h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Connect Wallet
      </button>
    </Login>
  );
};

export default SignInPage;
