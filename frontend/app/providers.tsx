"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";
import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ""}
        config={{
          loginMethods: ["wallet"],
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          defaultChain: {
            id: 2525,
            name: "Injective",
            network: "injective",
            nativeCurrency: { name: "Injective", symbol: "INJ", decimals: 18 },
            rpcUrls: {
              default: { http: ["https://mainnet.injective.network/"] },
              public: { http: ["https://mainnet.injective.network/"] },
            },
          },
        }}
      >
        <ChakraProvider>{children}</ChakraProvider>
      </PrivyProvider>
    </>
  );
}
