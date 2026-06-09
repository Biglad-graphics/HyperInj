"use client";

import { useState, useEffect } from "react";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import { getUserData } from "../../../utils/userStorage";
import { fetchWalletActivity, WalletActivity } from "../../../services/walletActivity.service";

type ActivityLevel = "none" | "low" | "moderate" | "high";
type RiskLevel = "Low" | "Medium" | "High";

function getActivityLevel(txCount: number): ActivityLevel {
  if (txCount === 0) return "none";
  if (txCount <= 3) return "low";
  if (txCount <= 15) return "moderate";
  return "high";
}

function getRisk(level: ActivityLevel): RiskLevel {
  if (level === "none" || level === "low") return "Low";
  if (level === "moderate") return "Medium";
  return "High";
}

const RISK_STYLE: Record<RiskLevel, string> = {
  Low: "bg-theme-green/10 text-theme-green",
  Medium: "bg-yellow-400/10 text-yellow-500",
  High: "bg-theme-red/10 text-theme-red",
};

const AI_COMMENTARY: Record<ActivityLevel, string> = {
  none: "This wallet shows low activity with no recent transactions.",
  low: "This wallet has minimal activity, suggesting a passive or long-term holding pattern.",
  moderate:
    "This wallet shows consistent activity, indicating active participation in the Injective ecosystem.",
  high: "This wallet is highly active, which may indicate frequent trading or strategy execution.",
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function BehaviorActivityPanel() {
  const [activity, setActivity] = useState<WalletActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const walletAddress = getUserData()?.walletAddress ?? null;

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWalletActivity(walletAddress)
      .then(setActivity)
      .catch(() => setActivity({ txCount: 0, lastActiveTimestamp: null }))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const level = activity ? getActivityLevel(activity.txCount) : "none";
  const risk = getRisk(level);
  const commentary = AI_COMMENTARY[level];

  return (
    <Card className="card-sidebar" title="Behavior & Activity">
      <div className="pt-4 space-y-5">
        {/* ── Activity Section ─────────────────────────── */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-theme-stroke rounded w-3/4" />
              <div className="h-4 bg-theme-stroke rounded w-1/2" />
            </div>
          ) : !walletAddress ? (
            <div className="flex flex-col items-center py-4 text-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-theme-on-surface-1 border border-theme-stroke flex items-center justify-center">
                <Icon className="w-5 h-5 fill-theme-tertiary" name="wallet" />
              </div>
              <p className="text-body-2s text-theme-secondary">
                Connect Keplr to view activity
              </p>
            </div>
          ) : activity && activity.txCount === 0 ? (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-theme-on-surface-1 border border-theme-stroke">
              <Icon className="w-4 h-4 fill-theme-tertiary shrink-0" name="refresh" />
              <span className="text-body-2s text-theme-secondary">No recent transactions</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-theme-on-surface-1 border border-theme-stroke">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 fill-theme-brand shrink-0" name="trade" />
                  <span className="text-body-2s text-theme-secondary">Transactions (7d)</span>
                </div>
                <span className="text-base-1s text-theme-primary font-semibold">
                  {activity?.txCount}
                </span>
              </div>
              {activity?.lastActiveTimestamp && (
                <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-theme-on-surface-1 border border-theme-stroke">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 fill-theme-secondary shrink-0" name="refresh" />
                    <span className="text-body-2s text-theme-secondary">Last active</span>
                  </div>
                  <span className="text-base-1s text-theme-primary font-semibold">
                    {timeAgo(activity.lastActiveTimestamp)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        {walletAddress && !loading && (
          <div className="border-t border-theme-stroke" />
        )}

        {/* ── AI Commentary ────────────────────────────── */}
        {walletAddress && !loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 fill-theme-brand" name="star-plus" />
              <span className="text-caption-1m text-theme-secondary uppercase tracking-wide">
                AI Commentary
              </span>
            </div>
            <p className="text-body-2s text-theme-primary leading-relaxed">
              {commentary}
            </p>
          </div>
        )}

        {/* ── Risk Badge ───────────────────────────────── */}
        {walletAddress && !loading && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-caption-1m text-theme-tertiary">Risk Level</span>
            <span
              className={`text-caption-1m font-semibold px-3 py-1 rounded-full ${RISK_STYLE[risk]}`}
            >
              {risk}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
