'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { clsx } from 'clsx';

interface Props {
  market: string;
}

const LEVERAGE_PRESETS = [2, 5, 10, 20];

export default function TradingPanel({ market }: Props) {
  const { connected } = useWallet();
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [margin, setMargin] = useState('');
  const [leverage, setLeverage] = useState(5);
  const [loading, setLoading] = useState(false);

  const sizeUsd = parseFloat(margin || '0') * leverage;
  const liqEstimate = side === 'LONG'
    ? `~${(100 / leverage * 0.975).toFixed(1)}% below entry`
    : `~${(100 / leverage * 0.975).toFixed(1)}% above entry`;

  async function handleSubmit() {
    if (!connected) return;
    setLoading(true);
    try {
      // TODO: call execution-engine API → sign tx via wallet adapter
      await new Promise(r => setTimeout(r, 1000));
      alert(`Opened ${side} ${market} | $${sizeUsd.toFixed(2)} notional`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex flex-col gap-4 h-fit">
      <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">{market}</h2>

      {/* Long / Short toggle */}
      <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-surface-border">
        {(['LONG', 'SHORT'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={clsx(
              'py-2 text-sm font-bold transition-colors',
              side === s
                ? s === 'LONG' ? 'bg-green-trade text-white' : 'bg-red-trade text-white'
                : 'text-gray-400 hover:text-white',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Margin input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">Margin (USDCx)</label>
        <div className="flex items-center border border-surface-border rounded-lg overflow-hidden bg-surface">
          <input
            type="number"
            value={margin}
            onChange={e => setMargin(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-num"
          />
          <span className="px-3 text-gray-400 text-xs">USDC</span>
        </div>
      </div>

      {/* Leverage */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Leverage</span>
          <span className="text-white font-bold">{leverage}x</span>
        </div>
        <div className="flex gap-2">
          {LEVERAGE_PRESETS.map(l => (
            <button
              key={l}
              onClick={() => setLeverage(l)}
              className={clsx(
                'flex-1 py-1 rounded text-xs font-semibold border transition-colors',
                leverage === l
                  ? 'bg-brand border-brand text-white'
                  : 'border-surface-border text-gray-400 hover:border-brand hover:text-white',
              )}
            >
              {l}x
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-surface rounded-lg p-3 flex flex-col gap-2 text-xs">
        <Row label="Notional" value={`$${sizeUsd.toLocaleString('en', { minimumFractionDigits: 2 })}`} />
        <Row label="Liquidation est." value={liqEstimate} />
        <Row label="Fee (0.05%)" value={`$${(sizeUsd * 0.0005).toFixed(2)}`} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!connected || !margin || loading}
        className={clsx(
          'w-full py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
          side === 'LONG' ? 'bg-green-trade hover:brightness-110' : 'bg-red-trade hover:brightness-110',
        )}
      >
        {loading ? 'Opening…' : connected ? `Open ${side}` : 'Connect Wallet'}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-num">{value}</span>
    </div>
  );
}
