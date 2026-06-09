"use client";

import { useState, useEffect } from "react";
import Card from "@/components/Card";
import Icon from "@/components/Icon";

const RISK_COLORS: Record<string, string> = {
  low: "text-theme-green bg-theme-green/10",
  medium: "text-theme-yellow bg-theme-yellow/10",
  high: "text-theme-red bg-theme-red/10",
};

const FALLBACK_INSIGHTS = [
  {
    insight:
      "INJ staking yield remains competitive among Cosmos chains, with validators offering 12–15% APR as network activity picks up.",
    risk: "low",
  },
  {
    insight:
      "Injective perp markets show elevated open interest on INJ/USDT — funding rates suggest moderately bullish positioning.",
    risk: "medium",
  },
  {
    insight:
      "Governance activity on Injective has increased; several proposals around fee burn mechanics could tighten INJ supply.",
    risk: "low",
  },
  {
    insight:
      "On-chain data shows accumulation near key support zones. Watch for validator delegation shifts as a leading signal.",
    risk: "medium",
  },
];

const InjectiveInsight = () => {
  const [insight, setInsight] = useState<{ insight: string; risk: string } | null>(null);

  useEffect(() => {
    const pick = FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
    setInsight(pick);
  }, []);

  const riskClass = insight ? (RISK_COLORS[insight.risk] ?? RISK_COLORS.medium) : "";

  return (
    <Card
      className="card-sidebar"
      title="Injective Insight of the Day"
      rightContent={
        <button
          className="group w-9 h-9 border-2 border-theme-stroke rounded-xl text-0 transition-colors hover:bg-theme-stroke"
          onClick={() => {
            const pick = FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
            setInsight(pick);
          }}
        >
          <Icon
            className="!w-5 !h-5 fill-theme-secondary transition-colors group-hover:fill-theme-primary"
            name="refresh"
          />
        </button>
      }
    >
      <div className="pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 fill-theme-brand" name="star-plus" />
          </div>
          <span className="text-caption-1m text-theme-secondary uppercase tracking-wide">
            AI-Generated · Injective Ecosystem
          </span>
        </div>

        {insight ? (
          <>
            <p className="text-body-1m text-theme-primary leading-relaxed">
              {insight.insight}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-theme-stroke">
              <span className="text-caption-1m text-theme-tertiary">Risk Level</span>
              <span
                className={`text-caption-1m font-semibold px-3 py-1 rounded-full capitalize ${riskClass}`}
              >
                {insight.risk}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-theme-stroke rounded w-full" />
            <div className="h-4 bg-theme-stroke rounded w-5/6" />
            <div className="h-4 bg-theme-stroke rounded w-4/6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default InjectiveInsight;
