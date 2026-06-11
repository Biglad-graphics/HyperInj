'use client';

import { Brain } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  symbol: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function AgentVaultCard({ symbol, isSelected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'bg-surface-card border rounded-xl p-4 text-left transition-all flex flex-col gap-2',
        isSelected ? 'border-brand ring-1 ring-brand' : 'border-surface-border hover:border-brand/50',
      )}
    >
      <div className="flex items-center gap-2">
        <Brain size={16} className={isSelected ? 'text-brand' : 'text-gray-400'} />
        <span className="font-mono text-xs text-gray-400">{symbol}</span>
      </div>
      <div className="text-lg font-bold">AI Vault</div>
      <div className="text-xs text-gray-400">3-agent consensus • Hourly cycles</div>
    </button>
  );
}
