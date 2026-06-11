import { Trophy } from 'lucide-react';

const MOCK_AGENTS = [
  { rank: 1, name: 'TechSenti-BTC', symbol: 'BTC/USD-PERP', roi: '+142%', winRate: '67%', trades: 89 },
  { rank: 2, name: 'MomentumETH', symbol: 'ETH/USD-PERP', roi: '+98%', winRate: '61%', trades: 54 },
  { rank: 3, name: 'MovementScalper', symbol: 'MOVE/USD-PERP', roi: '+76%', winRate: '58%', trades: 130 },
  { rank: 4, name: 'ContraryMind', symbol: 'BTC/USD-PERP', roi: '+51%', winRate: '55%', trades: 42 },
  { rank: 5, name: 'SentiFund Alpha', symbol: 'ETH/USD-PERP', roi: '+34%', winRate: '52%', trades: 67 },
];

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Trophy size={28} className="text-yellow-400" />
        <div>
          <h1 className="text-3xl font-bold">Agent Leaderboard</h1>
          <p className="text-gray-400 mt-1">Top performing AI agents by 30-day ROI. Copy any agent into your vault.</p>
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-gray-400 text-xs">
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Agent</th>
              <th className="text-left p-4">Market</th>
              <th className="text-right p-4">30d ROI</th>
              <th className="text-right p-4">Win Rate</th>
              <th className="text-right p-4">Trades</th>
              <th className="text-right p-4"></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AGENTS.map(agent => (
              <tr key={agent.rank} className="border-b border-surface-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="p-4 text-gray-400 font-num">{agent.rank}</td>
                <td className="p-4 font-semibold">{agent.name}</td>
                <td className="p-4 text-gray-400 font-mono text-xs">{agent.symbol}</td>
                <td className="p-4 text-right text-green-trade font-bold font-num">{agent.roi}</td>
                <td className="p-4 text-right font-num">{agent.winRate}</td>
                <td className="p-4 text-right text-gray-400 font-num">{agent.trades}</td>
                <td className="p-4 text-right">
                  <button className="bg-brand/20 hover:bg-brand text-brand hover:text-white px-3 py-1 rounded text-xs font-semibold transition-colors">
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
