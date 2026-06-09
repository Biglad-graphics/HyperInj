"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import { CREATORS } from "../../mocks/creators";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";

const CATEGORY_COLORS: Record<string, string> = {
  Research: "bg-brand-600/10 text-brand-600",
  "Trading Intel": "bg-purple-500/10 text-purple-400",
  "On-Chain": "bg-green-600/10 text-theme-green",
  "News & Analysis": "bg-yellow-500/10 text-yellow-400",
};

const ExplorePage = () => {
  const { injBalance, isConnected } = useWallet();

  return (
    <Layout title="Explore Creators">
      <div className="space-y-6">
        {/* Intro */}
        <div className="p-6 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke">
          <h2 className="text-title-1s text-theme-primary mb-1">Discover Creators</h2>
          <p className="text-body-2s text-theme-secondary">
            Each creator sets their own INJ requirement. Connect Keplr and hold enough INJ to unlock exclusive content.
          </p>
          {isConnected && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-green/10 border border-theme-green/20 text-sm">
              <div className="w-2 h-2 rounded-full bg-theme-green" />
              <span className="text-theme-green font-medium">Your balance: {injBalance.toFixed(4)} INJ</span>
            </div>
          )}
        </div>

        {/* Creator grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          {CREATORS.map((creator) => {
            const catClass = CATEGORY_COLORS[creator.category] ?? "bg-theme-on-surface-2 text-theme-secondary";
            const hasAccess = isConnected && injBalance >= creator.requiredINJ;
            const progress = isConnected
              ? Math.min((injBalance / creator.requiredINJ) * 100, 100)
              : 0;

            return (
              <div
                key={creator.id}
                className="flex flex-col p-6 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke hover:border-brand-600/30 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl ${creator.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}>
                    {creator.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base-1s text-theme-primary font-semibold">{creator.name}</span>
                      <span className="text-caption-1m text-theme-tertiary">{creator.handle}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                      {creator.category}
                    </span>
                  </div>
                  {hasAccess && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-theme-green/10 border border-theme-green/20 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-theme-green" />
                      <span className="text-xs text-theme-green font-medium">Unlocked</span>
                    </div>
                  )}
                </div>

                <p className="text-body-2s text-theme-secondary leading-relaxed mb-4 line-clamp-2">
                  {creator.bio}
                </p>

                {/* Access requirement + progress */}
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between text-caption-1m">
                    <span className="text-theme-secondary">
                      {hasAccess ? "Access granted" : `Requires ${creator.requiredINJ} INJ`}
                    </span>
                    <span className="text-theme-tertiary">{creator.posts.length} posts</span>
                  </div>
                  {isConnected && (
                    <div className="h-1.5 rounded-full bg-theme-stroke overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${hasAccess ? "bg-theme-green" : "bg-brand-600"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <Link
                  href={`/creator/${creator.id}`}
                  className="btn-secondary w-full mt-4 text-center"
                >
                  View Creator
                </Link>
              </div>
            );
          })}
        </div>

        {/* Empty / connect CTA */}
        {!isConnected && (
          <div className="p-6 rounded-2xl border border-dashed border-theme-stroke text-center">
            <Icon className="w-8 h-8 fill-theme-tertiary mx-auto mb-3" name="wallet" />
            <p className="text-body-2s text-theme-secondary mb-1">Connect your Keplr wallet</p>
            <p className="text-caption-1m text-theme-tertiary">to see which creators you can access based on your INJ balance</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExplorePage;
