import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Icon from "@/components/Icon";
import { getUserTradeHistory } from "../../services/hyperliquidPortfolio.service";

type TradeHistoryItem = {
  coin: string;
  price: string;
  quantity: string;
  side: string;
  time: number;
  pnl: string;
  hash: string;
  type: "spot" | "derivative";
};

const TradeHistory = () => {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { authenticated, user } = usePrivy();

  const ITEMS_PER_PAGE = 10;

  const fetchTradeHistory = useCallback(async () => {
    if (!authenticated || !user) return;
    const wallet = user.linkedAccounts?.find((a) => a.type === "wallet");
    if (!wallet || !("address" in wallet)) return;

    try {
      setLoading(true);
      const { spotTrades, derivativeTrades } = await getUserTradeHistory(wallet.address);

      const normalized: TradeHistoryItem[] = [
        ...((spotTrades?.trades ?? []).map((t: any) => ({
          coin: t.marketId ?? "—",
          price: t.price ?? "0",
          quantity: t.quantity ?? "0",
          side: t.tradeDirection ?? "—",
          time: Number(t.executedAt ?? 0),
          pnl: "—",
          hash: t.tradeId ?? "",
          type: "spot" as const,
        }))),
        ...((derivativeTrades?.trades ?? []).map((t: any) => ({
          coin: t.marketId ?? "—",
          price: t.executionPrice ?? "0",
          quantity: t.executionQuantity ?? "0",
          side: t.tradeDirection ?? "—",
          time: Number(t.executedAt ?? 0),
          pnl: t.payout ?? "0",
          hash: t.tradeId ?? "",
          type: "derivative" as const,
        }))),
      ].sort((a, b) => b.time - a.time);

      setTrades(normalized);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching trade history:", error);
    } finally {
      setLoading(false);
    }
  }, [authenticated, user]);

  useEffect(() => {
    fetchTradeHistory();
  }, [fetchTradeHistory]);

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatHash = (hash: string): string =>
    hash.length > 9 ? `${hash.slice(0, 6)}...${hash.slice(-3)}` : hash;

  const handleHashClick = (hash: string) => {
    window.open(`https://explorer.injective.network/transaction/${hash}`, "_blank");
  };

  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrades = trades.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-base-1 text-theme-secondary">Loading trade history...</div>
      </div>
    );
  }

  if (!authenticated || trades.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-base-1 text-theme-secondary">
          {!authenticated ? "Please connect your wallet to view trade history" : "No trades found"}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 -mx-6 md:-mx-4">
      <table className="w-full">
        <thead>
          <tr>
            <th className="pl-6 py-3 text-left text-caption-2m text-theme-secondary md:pl-4">Market</th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">Price</th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary">Size</th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">Side</th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary">PnL</th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">Time</th>
            <th className="pl-4 py-3 pr-6 text-left text-caption-2m text-theme-secondary md:pr-4">Tx</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTrades.map((trade, index) => {
            const pnlNum = parseFloat(trade.pnl);
            const isProfitable = !isNaN(pnlNum) && pnlNum >= 0;
            return (
              <tr key={`${trade.hash}-${index}`}>
                <td className="border-t border-theme-stroke pl-6 py-3 md:pl-4">
                  <div className="text-base-1s font-semibold">{trade.coin}</div>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-base-1s md:hidden">
                  {parseFloat(trade.price).toLocaleString()}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-base-1s">{trade.quantity}</td>
                <td className="border-t border-theme-stroke pl-4 py-3 md:hidden">
                  <span className={`inline-flex px-2 py-1 rounded text-caption-2m ${
                    trade.side === "buy" ? "bg-theme-green/10 text-theme-green" : "bg-theme-red/10 text-theme-red"
                  }`}>
                    {trade.side}
                  </span>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3">
                  <div className={`text-base-1s font-semibold ${isProfitable ? "text-theme-green" : "text-theme-red"}`}>
                    {trade.pnl === "—" ? "—" : `${isProfitable ? "+" : ""}${trade.pnl}`}
                  </div>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-caption-2 text-theme-secondary md:hidden">
                  {formatTime(trade.time)}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 pr-6 md:pr-4">
                  <button
                    onClick={() => handleHashClick(trade.hash)}
                    className="inline-flex items-center space-x-1 text-caption-2m text-theme-primary hover:text-theme-accent transition-colors"
                  >
                    <span className="font-mono">{formatHash(trade.hash)}</span>
                    <Icon className="!w-3 !h-3" name="arrow-up-right-thin" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-stroke md:px-4">
          <div className="text-caption-2 text-theme-secondary">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, trades.length)} of {trades.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-caption-2m transition-colors ${currentPage === 1 ? "text-theme-tertiary cursor-not-allowed" : "text-theme-primary hover:bg-theme-on-surface-2"}`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-caption-2m transition-colors ${currentPage === page ? "bg-theme-brand text-white" : "text-theme-primary hover:bg-theme-on-surface-2"}`}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-caption-2m transition-colors ${currentPage === totalPages ? "text-theme-tertiary cursor-not-allowed" : "text-theme-primary hover:bg-theme-on-surface-2"}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
