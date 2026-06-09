"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";
import { WalletProvider } from "../contexts/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <WalletProvider>{children}</WalletProvider>
      </ChakraProvider>
    </>
  );
}
