'use client';

import { useState } from 'react';
import AgentVaultCard from '@/components/trade/AgentVaultCard';
import AgentConfig from '@/components/trade/AgentConfig';

const SYMBOLS = ['BTC/USD-PERP', 'ETH/USD-PERP', 'MOVE/USD-PERP'];

export default function AgentsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">AI Trading Agents</h1>
        <p className="text-gray-400 mt-2">
          Deploy a multi-agent AI vault. The system runs Technical, Sentiment, and On-Chain analysis,
          takes a weighted consensus, and executes trades on your behalf.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {SYMBOLS.map(sym => (
          <AgentVaultCard
            key={sym}
            symbol={sym}
            isSelected={selectedSymbol === sym}
            onSelect={() => setSelectedSymbol(sym)}
          />
        ))}
      </div>

      <AgentConfig symbol={selectedSymbol} />
    </div>
  );
}
