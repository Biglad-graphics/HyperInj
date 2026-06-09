"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";
import { WalletProvider } from "../contexts/WalletContext";
import { AppStoreProvider } from "../store/useAppStore";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <WalletProvider>
          <AppStoreProvider>{children}</AppStoreProvider>
        </WalletProvider>
      </ChakraProvider>
    </>
  );
}
