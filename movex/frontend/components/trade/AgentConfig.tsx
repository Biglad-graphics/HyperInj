'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { clsx } from 'clsx';

interface Props {
  symbol: string;
}

const STRATEGIES = [
  { id: 'balanced', label: 'Balanced', desc: 'Equal weight across all three agents.' },
  { id: 'technical', label: 'Technical-heavy', desc: 'Technical agent has 70% weight. Best in trending markets.' },
  { id: 'sentiment', label: 'Sentiment-driven', desc: 'LLM sentiment leads. Best during news cycles.' },
];

export default function AgentConfig({ symbol }: Props) {
  const { connected } = useWallet();
  const [deposit, setDeposit] = useState('');
  const [maxLoss, setMaxLoss] = useState('20');
  const [strategy, setStrategy] = useState('balanced');
  const [loading, setLoading] = useState(false);

  async function handleDeploy() {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      alert(`AI Agent deployed for ${symbol} with $${deposit} USDC, max loss ${maxLoss}%`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">Configure Agent — {symbol}</h2>
        <p className="text-gray-400 text-sm mt-1">
          The agent will run Technical, Sentiment, and On-Chain analysis every hour
          and open/close positions based on consensus.
        </p>
      </div>

      {/* Strategy selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Strategy</label>
        <div className="flex flex-col gap-2">
          {STRATEGIES.map(s => (
            <label
              key={s.id}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                strategy === s.id ? 'border-brand bg-brand/10' : 'border-surface-border hover:border-brand/50',
              )}
            >
              <input
                type="radio"
                name="strategy"
                value={s.id}
                checked={strategy === s.id}
                onChange={() => setStrategy(s.id)}
                className="mt-0.5 accent-brand"
              />
              <div>
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-gray-400 text-xs">{s.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Deposit + risk */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Vault Deposit (USDCx)</label>
          <input
            type="number"
            value={deposit}
            onChange={e => setDeposit(e.target.value)}
            placeholder="100"
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand font-num"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Max Drawdown (%)</label>
          <input
            type="number"
            value={maxLoss}
            onChange={e => setMaxLoss(e.target.value)}
            placeholder="20"
            min="5"
            max="80"
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand font-num"
          />
        </div>
      </div>

      <button
        onClick={handleDeploy}
        disabled={!connected || !deposit || loading}
        className="bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-lg font-bold text-sm transition-colors"
      >
        {loading ? 'Deploying…' : connected ? 'Deploy AI Agent' : 'Connect Wallet'}
      </button>
    </div>
  );
}
