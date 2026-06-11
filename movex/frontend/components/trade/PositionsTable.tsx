'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';

// In production: fetch from execution-engine /api/positions/:address
const MOCK_POSITIONS: {
  id: number; symbol: string; side: 'LONG' | 'SHORT';
  size: number; margin: number; entryPrice: number; markPrice: number; pnl: number;
}[] = [];

export default function PositionsTable() {
  const { connected } = useWallet();

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="font-semibold text-sm">Open Positions</h3>
      </div>

      {!connected ? (
        <div className="py-10 text-center text-gray-500 text-sm">
          Connect wallet to see positions
        </div>
      ) : MOCK_POSITIONS.length === 0 ? (
        <div className="py-10 text-center text-gray-500 text-sm">No open positions</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-surface-border">
              {['Market', 'Side', 'Size', 'Entry', 'Mark', 'PnL', ''].map(h => (
                <th key={h} className="text-left px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_POSITIONS.map(pos => (
              <tr key={pos.id} className="border-b border-surface-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{pos.symbol}</td>
                <td className={`px-4 py-3 font-bold ${pos.side === 'LONG' ? 'text-green-trade' : 'text-red-trade'}`}>
                  {pos.side}
                </td>
                <td className="px-4 py-3 font-num">${pos.size.toLocaleString()}</td>
                <td className="px-4 py-3 font-num">${pos.entryPrice.toLocaleString()}</td>
                <td className="px-4 py-3 font-num">${pos.markPrice.toLocaleString()}</td>
                <td className={`px-4 py-3 font-num font-bold ${pos.pnl >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-red-trade hover:underline">Close</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
