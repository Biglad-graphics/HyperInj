import Link from 'next/link';
import { ArrowRight, Zap, Brain, Shield } from 'lucide-react';

const STATS = [
  { label: 'Markets', value: '3' },
  { label: 'Max Leverage', value: '20x' },
  { label: 'Collateral', value: 'USDCx' },
  { label: 'Settlement', value: '<1s' },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'On-Chain Perps',
    desc: 'Fully on-chain perpetual futures powered by Movement\'s parallel execution. Sub-second finality, no CEX risk.',
  },
  {
    icon: Brain,
    title: 'AI Trading Agents',
    desc: 'Multi-agent consensus — technical, sentiment, and on-chain signals vote on every trade. Deploy your AI vault in one click.',
  },
  {
    icon: Shield,
    title: 'Move Safety',
    desc: 'Built in Move — the language that eliminates re-entrancy, double-spend, and integer overflow by construction.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-20 py-16">
      {/* Hero */}
      <section className="text-center max-w-3xl flex flex-col items-center gap-6">
        <span className="px-3 py-1 rounded-full bg-brand/20 text-brand text-xs font-semibold tracking-widest uppercase">
          Built on Movement Network
        </span>
        <h1 className="text-5xl font-bold leading-tight">
          The First AI-Powered<br />
          <span className="text-brand">Perp DEX</span> on Movement
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          Trade perpetual futures with up to 20x leverage — manually or powered by
          multi-agent AI consensus. Fully on-chain. Built in Move.
        </p>
        <div className="flex gap-4">
          <Link
            href="/trade"
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Trading <ArrowRight size={16} />
          </Link>
          <Link
            href="/agents"
            className="flex items-center gap-2 border border-surface-border hover:border-brand px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Deploy AI Agent
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
        {STATS.map(s => (
          <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-brand font-num">{s.value}</div>
            <div className="text-gray-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
        {FEATURES.map(f => (
          <div key={f.title} className="bg-surface-card border border-surface-border rounded-xl p-6 flex flex-col gap-3">
            <f.icon size={24} className="text-brand" />
            <h3 className="font-bold text-lg">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
