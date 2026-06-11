'use client';

const MARKETS = [
  { symbol: 'BTC/USD-PERP', price: '—', change: '—' },
  { symbol: 'ETH/USD-PERP', price: '—', change: '—' },
  { symbol: 'MOVE/USD-PERP', price: '—', change: '—' },
];

interface Props {
  selected: string;
  onChange: (symbol: string) => void;
}

export default function MarketSelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {MARKETS.map(m => (
        <button
          key={m.symbol}
          onClick={() => onChange(m.symbol)}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors ${
            selected === m.symbol
              ? 'border-brand bg-brand/10 text-white'
              : 'border-surface-border text-gray-400 hover:border-brand/50 hover:text-white'
          }`}
        >
          <span className="font-semibold">{m.symbol}</span>
          <span className="font-num text-xs">${m.price}</span>
        </button>
      ))}
    </div>
  );
}
