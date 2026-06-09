"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";
import { useAppStore, StorePost } from "../../store/useAppStore";

const CATEGORY_COLORS: Record<string, string> = {
  Research: "bg-brand-600/10 text-brand-600",
  "Trading Intel": "bg-purple-500/10 text-purple-400",
  "On-Chain": "bg-green-600/10 text-theme-green",
  "News & Analysis": "bg-yellow-500/10 text-yellow-400",
};

function PostCard({ post, locked }: { post: StorePost; locked: boolean }) {
  return (
    <div className={`relative rounded-2xl border overflow-hidden ${locked ? "border-theme-stroke" : "border-theme-stroke bg-theme-on-surface-1"}`}>
      {locked ? (
        <>
          <div className="blur-sm pointer-events-none select-none p-5 opacity-50">
            <div className="text-caption-1m text-theme-tertiary mb-2">{post.createdAt}</div>
            <h3 className="text-base-1s text-theme-primary font-semibold mb-2">{post.title}</h3>
            <p className="text-body-2s text-theme-secondary line-clamp-3">{post.preview}</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-n-8/70 backdrop-blur-[2px] p-4">
            <div className="w-10 h-10 rounded-xl bg-theme-on-surface-1 border border-theme-stroke flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 fill-theme-tertiary" name="lock" />
            </div>
            <p className="text-body-2s text-theme-secondary text-center">Content locked</p>
          </div>
        </>
      ) : (
        <div className="p-5">
          <div className="text-caption-1m text-theme-tertiary mb-2">{post.createdAt}</div>
          <h3 className="text-base-1s text-theme-primary font-semibold mb-3">{post.title}</h3>
          <p className="text-body-2s text-theme-secondary leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>
      )}
    </div>
  );
}

const CreatorProfilePage = () => {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { getCreatorById, getPostsByCreator } = useAppStore();
  const creator = id ? getCreatorById(id) : undefined;
  const posts = id ? getPostsByCreator(id) : [];
  const { injBalance, isConnected, connect, connecting } = useWallet();

  if (!creator) {
    return (
      <Layout title="Creator Not Found">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon className="w-10 h-10 fill-theme-tertiary mb-4" name="info" />
          <p className="text-h5 text-theme-primary mb-2">Creator not found</p>
          <Link href="/explore" className="btn-secondary mt-4">Back to Explore</Link>
        </div>
      </Layout>
    );
  }

  // requiredINJ === 0 means free for everyone
  const hasAccess = creator.requiredINJ === 0 || (isConnected && injBalance >= creator.requiredINJ);
  const catClass = CATEGORY_COLORS[creator.category] ?? "bg-theme-on-surface-2 text-theme-secondary";
  const shortfall = Math.max(0, creator.requiredINJ - injBalance);
  const progress = isConnected && creator.requiredINJ > 0
    ? Math.min((injBalance / creator.requiredINJ) * 100, 100)
    : 100;

  return (
    <Layout title={creator.name}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Creator header */}
        <div className="p-6 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl ${creator.avatarColor} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
              {creator.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-h5 text-theme-primary font-bold">{creator.name}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catClass}`}>
                  {creator.category}
                </span>
              </div>
              <p className="text-caption-1m text-theme-tertiary mb-2">{creator.handle}</p>
              <p className="text-body-2s text-theme-secondary leading-relaxed">{creator.bio}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-theme-stroke text-caption-1m text-theme-secondary">
            <span>{posts.length} posts</span>
            <span>{creator.subscribers.toLocaleString()} subscribers</span>
            <span className="ml-auto font-semibold text-theme-primary">
              {creator.requiredINJ === 0 ? "Free" : `${creator.requiredINJ} INJ required`}
            </span>
          </div>
        </div>

        {/* Access gate */}
        {creator.requiredINJ === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-theme-green/10 border border-theme-green/20">
            <div className="w-8 h-8 rounded-lg bg-theme-green/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 fill-theme-green" name="check-circle" />
            </div>
            <p className="text-base-1s text-theme-green font-semibold">Free content — no INJ required</p>
          </div>
        ) : !isConnected ? (
          <div className="p-6 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke text-center">
            <Icon className="w-8 h-8 fill-theme-tertiary mx-auto mb-3" name="wallet" />
            <p className="text-base-1s text-theme-primary mb-1">Connect your wallet to check access</p>
            <p className="text-body-2s text-theme-secondary mb-4">
              This creator requires {creator.requiredINJ} INJ to unlock content.
            </p>
            <button className="btn-primary" onClick={connect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Keplr"}
            </button>
          </div>
        ) : hasAccess ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-theme-green/10 border border-theme-green/20">
            <div className="w-8 h-8 rounded-lg bg-theme-green/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 fill-theme-green" name="check-circle" />
            </div>
            <div>
              <p className="text-base-1s text-theme-green font-semibold">Access Unlocked</p>
              <p className="text-caption-1m text-theme-green/70">
                Your balance ({injBalance.toFixed(2)} INJ) meets the {creator.requiredINJ} INJ requirement.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-theme-red/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 fill-theme-red" name="lock" />
              </div>
              <div>
                <p className="text-base-1s text-theme-primary font-semibold">Access Locked</p>
                <p className="text-caption-1m text-theme-secondary">Need {shortfall.toFixed(2)} more INJ to unlock</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-caption-1m text-theme-tertiary">
                <span>Your balance: {injBalance.toFixed(2)} INJ</span>
                <span>Required: {creator.requiredINJ} INJ</span>
              </div>
              <div className="h-2 rounded-full bg-theme-stroke overflow-hidden">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-title-1s text-theme-primary">
            Content <span className="text-theme-tertiary">({posts.length})</span>
          </h2>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Icon className="w-8 h-8 fill-theme-tertiary mb-3" name="news" />
              <p className="text-body-2s text-theme-secondary">No posts published yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} locked={!hasAccess} />
            ))
          )}
        </div>

        <Link href="/explore" className="inline-flex items-center gap-2 text-body-2s text-theme-secondary hover:text-theme-primary transition-colors">
          <Icon className="w-4 h-4 fill-current" name="arrow-left" />
          Back to Explore
        </Link>
      </div>
    </Layout>
  );
};

export default CreatorProfilePage;
