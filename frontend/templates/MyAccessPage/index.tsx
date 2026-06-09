"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";
import { useAppStore } from "../../store/useAppStore";

const CATEGORY_COLORS: Record<string, string> = {
  Research: "bg-brand-600/10 text-brand-600",
  "Trading Intel": "bg-purple-500/10 text-purple-400",
  "On-Chain": "bg-green-600/10 text-theme-green",
  "News & Analysis": "bg-yellow-500/10 text-yellow-400",
};

const MyAccessPage = () => {
  const { address, injBalance, isConnected, connect, connecting } = useWallet();
  const { creators, getPostsByCreator, getSubscribedCreators, isSubscribed } = useAppStore();
  const subscribedCreators = address ? getSubscribedCreators(address) : [];

  if (!isConnected) {
    return (
      <Layout title="My Access">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 fill-theme-tertiary" name="lock" />
          </div>
          <h2 className="text-h5 text-theme-primary mb-2">Connect your wallet</h2>
          <p className="text-body-2s text-theme-secondary max-w-sm mb-6">
            Connect your Keplr wallet to see which creators you can access based on your INJ balance.
          </p>
          <button className="btn-primary h-12 px-8" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect Keplr"}
          </button>
        </div>
      </Layout>
    );
  }

  const unlocked = creators.filter((c) => c.requiredINJ === 0 || injBalance >= c.requiredINJ);
  const locked = creators.filter((c) => c.requiredINJ > 0 && injBalance < c.requiredINJ);

  return (
    <Layout title="My Access">
      <div className="space-y-6">
        {/* Balance summary */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke">
          <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 fill-brand-600" name="wallet" />
          </div>
          <div>
            <div className="text-h5 font-bold text-theme-primary">{injBalance.toFixed(4)} INJ</div>
            <div className="text-body-2s text-theme-secondary">Current balance · Injective Mainnet</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-title-1s text-theme-primary">{unlocked.length}/{creators.length}</div>
            <div className="text-caption-1m text-theme-secondary">creators unlocked</div>
          </div>
        </div>

        {/* Subscribed creators */}
        {subscribedCreators.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-title-1s text-theme-primary flex items-center gap-2">
              <Icon className="w-4 h-4 fill-brand-600" name="star-plus" />
              Subscribed
              <span className="text-theme-tertiary font-normal">({subscribedCreators.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {subscribedCreators.map((creator) => {
                const postCount = getPostsByCreator(creator.id).length;
                const catClass = CATEGORY_COLORS[creator.category] ?? "";
                return (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-theme-on-surface-1 border border-brand-600/20 hover:border-brand-600/40 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl ${creator.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}>
                      {creator.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-base-1s text-theme-primary font-semibold">{creator.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                          {creator.category}
                        </span>
                      </div>
                      <span className="text-caption-1m text-theme-secondary">{postCount} posts</span>
                    </div>
                    <Icon className="w-4 h-4 fill-theme-tertiary shrink-0" name="arrow-right" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-title-1s text-theme-primary flex items-center gap-2">
              <Icon className="w-4 h-4 fill-theme-green" name="check-circle" />
              You Have Access
              <span className="text-theme-tertiary font-normal">({unlocked.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {unlocked.map((creator) => {
                const postCount = getPostsByCreator(creator.id).length;
                const catClass = CATEGORY_COLORS[creator.category] ?? "";
                const subbed = isSubscribed(address ?? null, creator.id);
                return (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-theme-on-surface-1 border border-theme-green/20 hover:border-theme-green/50 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl ${creator.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}>
                      {creator.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-base-1s text-theme-primary font-semibold">{creator.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                          {creator.category}
                        </span>
                        {subbed && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-600/10 text-brand-600">
                            Subscribed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-theme-green" />
                        <span className="text-caption-1m text-theme-green">
                          {postCount} posts {creator.requiredINJ === 0 ? "(free)" : "unlocked"}
                        </span>
                      </div>
                    </div>
                    <Icon className="w-4 h-4 fill-theme-tertiary shrink-0" name="arrow-right" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-title-1s text-theme-primary flex items-center gap-2">
              <Icon className="w-4 h-4 fill-theme-tertiary" name="lock" />
              Locked Creators
              <span className="text-theme-tertiary font-normal">({locked.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {locked.map((creator) => {
                const shortfall = creator.requiredINJ - injBalance;
                const progress = Math.min((injBalance / creator.requiredINJ) * 100, 100);
                const catClass = CATEGORY_COLORS[creator.category] ?? "";
                return (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.id}`}
                    className="flex flex-col gap-3 p-4 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke hover:border-brand-600/30 transition-all opacity-70 hover:opacity-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${creator.avatarColor} flex items-center justify-center text-white font-bold shrink-0 opacity-60`}>
                        {creator.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-base-1s text-theme-primary font-semibold">{creator.name}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                            {creator.category}
                          </span>
                        </div>
                        <span className="text-caption-1m text-theme-tertiary">
                          Need {shortfall.toFixed(2)} more INJ
                        </span>
                      </div>
                      <Icon className="w-4 h-4 fill-theme-tertiary shrink-0" name="lock" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-caption-1m text-theme-tertiary">
                        <span>{injBalance.toFixed(2)} / {creator.requiredINJ} INJ</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-theme-stroke overflow-hidden">
                        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyAccessPage;
