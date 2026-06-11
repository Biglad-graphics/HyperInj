'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { clsx } from 'clsx';

const NAV_LINKS = [
  { href: '/trade', label: 'Trade' },
  { href: '/agents', label: 'AI Agents' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { account, connected, connect, disconnect, wallets } = useWallet();

  const shortAddr = account?.address
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : null;

  return (
    <nav className="border-b border-surface-border bg-surface-card sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-brand">Move</span>
          <span>X</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-brand/20 text-brand'
                  : 'text-gray-400 hover:text-white hover:bg-surface',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet button */}
        {connected && shortAddr ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 bg-surface border border-surface-border hover:border-brand px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-trade" />
            {shortAddr}
          </button>
        ) : (
          <button
            onClick={() => wallets?.[0] && connect(wallets[0].name)}
            className="bg-brand hover:bg-brand-dark px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
