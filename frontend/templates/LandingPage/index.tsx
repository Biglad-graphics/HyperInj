"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";
import { CREATORS } from "../../mocks/creators";

const CATEGORY_COLORS: Record<string, string> = {
  Research: "bg-brand-600/10 text-brand-600",
  "Trading Intel": "bg-purple-500/10 text-purple-400",
  "On-Chain": "bg-green-600/10 text-theme-green",
  "News & Analysis": "bg-yellow-500/10 text-yellow-400",
};

const LandingPage = () => {
  const { address, injBalance, isConnected, isInstalled, connecting, error, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      // already connected — stay on landing, user can navigate
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-theme-n-8">
      {/* ── Nav bar ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between h-20 px-10 bg-theme-n-8/80 backdrop-blur-md border-b border-theme-stroke md:px-4">
        <span className="text-h5 font-bold text-theme-primary">HyperInj</span>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-on-surface-1 border border-theme-stroke text-sm">
                <div className="w-2 h-2 rounded-full bg-theme-green" />
                <span className="text-theme-secondary font-mono text-xs">
                  {address!.slice(0, 8)}…{address!.slice(-4)}
                </span>
                <span className="text-theme-primary font-semibold">{injBalance.toFixed(2)} INJ</span>
              </div>
              <Link href="/explore" className="btn-primary">
                Open App
              </Link>
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect Keplr"}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-10 md:px-4">
        {/* ── Hero ──────────────────────────────────────── */}
        <section className="pt-48 pb-20 text-center md:pt-32 md:pb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-brand-600/10 border border-brand-600/20 text-brand-600 text-sm font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
            Built on Injective
          </div>
          <h1 className="text-[3.5rem] font-bold text-theme-primary leading-tight mb-6 md:text-h2">
            Token-Gated Content<br />
            <span className="text-brand-600">on Injective</span>
          </h1>
          <p className="text-body-1m text-theme-secondary max-w-xl mx-auto mb-10 leading-relaxed">
            Creators gate exclusive content using INJ.<br />
            Fans unlock access simply by holding tokens in their Keplr wallet.
          </p>

          {!isConnected ? (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {!isInstalled ? (
                <a
                  href="https://www.keplr.app/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Install Keplr
                </a>
              ) : (
                <button
                  className="btn-primary h-14 px-8 text-base"
                  onClick={connect}
                  disabled={connecting}
                >
                  {connecting ? "Connecting…" : "Connect Keplr to Start"}
                </button>
              )}
              <Link href="/explore" className="btn-secondary h-14 px-8 text-base">
                Browse Creators
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/explore" className="btn-primary h-14 px-8 text-base">
                Explore Creators
              </Link>
              <Link href="/creator-dashboard" className="btn-secondary h-14 px-8 text-base">
                Become a Creator
              </Link>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-theme-red text-center">{error}</p>
          )}
        </section>

        {/* ── How it works ──────────────────────────────── */}
        <section className="py-16 md:py-10">
          <h2 className="text-h4 font-bold text-theme-primary text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-3 gap-6 md:grid-cols-1">
            {[
              {
                step: "01",
                title: "Connect Keplr",
                desc: "Connect your Keplr wallet. Your INJ balance is read automatically — no permissions needed.",
                icon: "wallet",
              },
              {
                step: "02",
                title: "Browse Creators",
                desc: "Explore creators on Injective. Each creator sets their own INJ requirement to unlock content.",
                icon: "search",
              },
              {
                step: "03",
                title: "Unlock Instantly",
                desc: "If your wallet holds enough INJ, access is granted on the spot. Hold more INJ, unlock more.",
                icon: "lock",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke"
              >
                <div className="text-caption-1m text-brand-600 font-mono mb-3">{item.step}</div>
                <h3 className="text-title-1s text-theme-primary mb-2">{item.title}</h3>
                <p className="text-body-2s text-theme-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Preview creators ──────────────────────────── */}
        <section className="py-16 md:py-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-h4 font-bold text-theme-primary">Featured Creators</h2>
            <Link href="/explore" className="text-brand-600 text-sm font-semibold hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {CREATORS.slice(0, 4).map((creator) => {
              const catClass = CATEGORY_COLORS[creator.category] ?? "bg-theme-on-surface-2 text-theme-secondary";
              const hasAccess = isConnected && injBalance >= creator.requiredINJ;
              return (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.id}`}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke hover:border-brand-600/40 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${creator.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {creator.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base-1s text-theme-primary font-semibold">{creator.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                        {creator.category}
                      </span>
                    </div>
                    <p className="text-body-2s text-theme-secondary line-clamp-2 mb-2">{creator.bio}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-caption-1m text-theme-tertiary">
                        {hasAccess ? (
                          <span className="text-theme-green">✓ Unlocked</span>
                        ) : (
                          `Hold ${creator.requiredINJ} INJ to unlock`
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="py-12 border-t border-theme-stroke text-center">
          <p className="text-caption-1m text-theme-tertiary">
            HyperInj · Token-Gated Creator Platform on Injective · No trading · No financial advice
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
