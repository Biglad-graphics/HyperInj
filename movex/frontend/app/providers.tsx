'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{ network: (process.env.NEXT_PUBLIC_MOVEMENT_NETWORK ?? 'mainnet') as any }}
      onError={(error) => console.error('Wallet error:', error)}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
