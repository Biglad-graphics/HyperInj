"use client";

import { useState } from "react";
import { useInjectivePortfolio } from "../../../hooks/useInjectivePortfolio";
import Card from "@/components/Card";
import Icon from "@/components/Icon";

const TABS = [
  { id: "total", label: "Portfolio Value" },
  { id: "inj", label: "INJ" },
  { id: "usdt", label: "USDT" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function fmt(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const TotalBalance = () => {
  const [tab, setTab] = useState<Tab>("total");
  const {
    injBalance,
    usdtBalance,
    injPriceUsd,
    injChange24h,
    totalValueUsd,
    loading,
    error,
    walletAddress,
  } = useInjectivePortfolio();

  const injValueUsd = injBalance * injPriceUsd;
  const injPct = totalValueUsd > 0 ? (injValueUsd / totalValueUsd) * 100 : 0;
  const usdtPct = totalValueUsd > 0 ? (usdtBalance / totalValueUsd) * 100 : 0;
  const isPositive = injChange24h >= 0;

  return (
    <Card className="grow" title="Total Balance">
      {/* Tabs */}
      <div className="flex gap-1 mt-4 p-1 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-caption-1m transition-all ${
              tab === t.id
                ? "bg-theme-brand text-white shadow-sm"
                : "text-theme-secondary hover:text-theme-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main value */}
      <div className="mt-6 mb-2 min-h-[5rem]">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-10 bg-theme-stroke rounded-lg w-48" />
            <div className="h-4 bg-theme-stroke rounded w-32" />
          </div>
        ) : error ? (
          <p className="text-sm text-theme-red">{error}</p>
        ) : !walletAddress ? (
          <p className="text-sm text-theme-tertiary">Connect wallet to view balance</p>
        ) : (
          <>
            {tab === "total" && (
              <>
                <div className="text-h1 md:text-h3 font-bold text-theme-primary">
                  ${fmt(totalValueUsd)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-body-2s text-theme-secondary">Total USD Value</span>
                  <span
                    className={`flex items-center gap-0.5 text-caption-1m px-2 py-0.5 rounded-full ${
                      isPositive
                        ? "bg-theme-green/10 text-theme-green"
                        : "bg-theme-red/10 text-theme-red"
                    }`}
                  >
                    <Icon
                      className={`!w-3 !h-3 ${isPositive ? "fill-theme-green" : "fill-theme-red"}`}
                      name={isPositive ? "arrow-top" : "arrow-bottom"}
                    />
                    {Math.abs(injChange24h)}% INJ 24h
                  </span>
                </div>
              </>
            )}

            {tab === "inj" && (
              <>
                <div className="text-h1 md:text-h3 font-bold text-theme-primary">
                  {fmt(injBalance, 4)} <span className="text-h4 text-theme-secondary">INJ</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-body-2s text-theme-secondary">
                    ≈ ${fmt(injValueUsd)}
                  </span>
                  <span className="text-body-2s text-theme-tertiary">
                    @ ${fmt(injPriceUsd)} / INJ
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-caption-1m px-2 py-0.5 rounded-full ${
                      isPositive
                        ? "bg-theme-green/10 text-theme-green"
                        : "bg-theme-red/10 text-theme-red"
                    }`}
                  >
                    <Icon
                      className={`!w-3 !h-3 ${isPositive ? "fill-theme-green" : "fill-theme-red"}`}
                      name={isPositive ? "arrow-top" : "arrow-bottom"}
                    />
                    {Math.abs(injChange24h)}% 24h
                  </span>
                </div>
              </>
            )}

            {tab === "usdt" && (
              <>
                <div className="text-h1 md:text-h3 font-bold text-theme-primary">
                  ${fmt(usdtBalance)} <span className="text-h4 text-theme-secondary">USDT</span>
                </div>
                <p className="mt-1 text-body-2s text-theme-secondary">
                  Stablecoin subaccount balance
                </p>
              </>
            )}
          </>
        )}
      </div>

      {/* Asset allocation bar */}
      {!loading && !error && walletAddress && totalValueUsd > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-caption-1m text-theme-secondary">
            <span>Asset Allocation</span>
            <span>{fmt(injPct, 1)}% INJ · {fmt(usdtPct, 1)}% USDT</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-theme-stroke">
            <div
              className="bg-theme-brand transition-all duration-500"
              style={{ width: `${injPct}%` }}
            />
            <div
              className="bg-theme-green transition-all duration-500"
              style={{ width: `${usdtPct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-theme-on-surface-1 border border-theme-stroke">
              <img src="/images/tokens/inj.svg" alt="INJ" className="w-6 h-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="min-w-0">
                <div className="text-caption-2m text-theme-tertiary">INJ</div>
                <div className="text-base-1s text-theme-primary truncate">{fmt(injBalance, 4)}</div>
                <div className="text-caption-2m text-theme-secondary">${fmt(injValueUsd)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-theme-on-surface-1 border border-theme-stroke">
              <div className="w-6 h-6 rounded-full bg-theme-green/20 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-theme-green">$</span>
              </div>
              <div className="min-w-0">
                <div className="text-caption-2m text-theme-tertiary">USDT</div>
                <div className="text-base-1s text-theme-primary truncate">{fmt(usdtBalance)}</div>
                <div className="text-caption-2m text-theme-secondary">stablecoin</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && walletAddress && totalValueUsd === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Icon className="w-8 h-8 fill-theme-tertiary mb-2" name="wallet" />
          <p className="text-body-2s text-theme-secondary">No assets found in this wallet</p>
          <p className="text-caption-1m text-theme-tertiary mt-1">{walletAddress.slice(0, 12)}…{walletAddress.slice(-6)}</p>
        </div>
      )}
    </Card>
  );
};

export default TotalBalance;
