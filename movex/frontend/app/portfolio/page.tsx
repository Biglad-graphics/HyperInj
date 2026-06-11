'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import PositionsTable from '@/components/trade/PositionsTable';

export default function PortfolioPage() {
  const { account, connected } = useWallet();

  if (!connected || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-gray-400">
        <p className="text-lg">Connect your wallet to view your portfolio</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-gray-400 mt-1 font-mono text-sm truncate">{account.address}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Free Collateral', value: '$—' },
          { label: 'Locked Margin', value: '$—' },
          { label: 'Unrealised PnL', value: '$—' },
          { label: 'Total Equity', value: '$—' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="text-gray-400 text-xs">{stat.label}</div>
            <div className="text-xl font-bold font-num mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Open Positions</h2>
        <PositionsTable />
      </div>
    </div>
  );
}
