import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Icon from "@/components/Icon";
import { getUserTradeHistory } from "../../services/hyperliquidPortfolio.service";

type TradeHistoryItem = {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
  twapId: null | number;
};

type TradeHistoryProps = {};

const TradeHistory = ({}: TradeHistoryProps) => {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { authenticated, user } = usePrivy();

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchTradeHistory = async () => {
      if (authenticated && user) {
        try {
          setLoading(true);
          // Get wallet address from Privy user
          const wallet = user.linkedAccounts?.find(
            (account) => account.type === "wallet"
          );

          if (wallet && "address" in wallet) {
            const tradeHistory = await getUserTradeHistory(wallet.address);
            // Get the last 6 trades
            // const recentTrades = tradeHistory.slice(-8).reverse();
            const recentTrades = tradeHistory;
            setTrades(recentTrades);
            setCurrentPage(1); // Reset to first page when new data loads
          }
        } catch (error) {
          console.error("Error fetching trade history:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTradeHistory();
  }, [authenticated, user]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-3)}`;
  };

  const handleHashClick = (hash: string) => {
    window.open(`https://app.hyperliquid.xyz/explorer/tx/${hash}`, "_blank");
  };

  // Pagination calculations
  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTrades = trades.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-base-1 text-theme-secondary">
          Loading trade history...
        </div>
      </div>
    );
  }

  if (!authenticated || trades.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-base-1 text-theme-secondary">
          {!authenticated
            ? "Please connect your wallet to view trade history"
            : "No trades found"}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 -mx-6 md:-mx-4">
      <table className="w-full">
        <thead>
          <tr>
            <th className="pl-6 py-3 text-left text-caption-2m text-theme-secondary md:pl-4">
              Coin
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">
              Close Price
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary">
              Size
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">
              Direction
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary">
              PnL
            </th>
            <th className="pl-4 py-3 text-left text-caption-2m text-theme-secondary md:hidden">
              Time
            </th>
            <th className="pl-4 py-3 pr-6 text-left text-caption-2m text-theme-secondary md:pr-4">
              Tx Hash
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedTrades.map((trade, index) => {
            const pnlValue = parseFloat(trade.closedPnl);
            const isProfitable = pnlValue >= 0;

            return (
              <tr className="" key={`${trade.hash}-${index}`}>
                <td className="border-t border-theme-stroke pl-6 py-3 md:pl-4">
                  <div className="text-base-1s font-semibold">{trade.coin}</div>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-base-1s md:hidden">
                  ${parseFloat(trade.px).toLocaleString()}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 text-base-1s">
                  {trade.sz}
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3 md:hidden">
                  <span
                    className={`inline-flex px-2 py-1 rounded text-caption-2m ${
                      trade.dir.includes("Close")
                        ? "bg-theme-red/10 text-theme-red"
                        : trade.dir.includes("Long")
                        ? "bg-theme-green/10 text-theme-green"
                        : "bg-theme-red/10 text-theme-red"
                    }`}
                  >
                    {trade.dir}
                  </span>
                </td>
                <td className="border-t border-theme-stroke pl-4 py-3">
                  <div
                    className={`text-base-1s font-semibold ${
                      isProfitable ? "text-theme-green" : "text-theme-red"
                    }`}
                  >
                    {isProfitable ? "+" : ""}
                    {trade.closedPnl}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-stroke md:px-4">
          <div className="text-caption-2 text-theme-secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, trades.length)} of{" "}
            {trades.length} trades
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-caption-2m transition-colors ${
                currentPage === 1
                  ? "text-theme-tertiary cursor-not-allowed"
                  : "text-theme-primary hover:bg-theme-on-surface-2"
              }`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    // Show ellipsis
                    if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="px-2 text-theme-tertiary"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg text-caption-2m transition-colors ${
                        currentPage === page
                          ? "bg-theme-brand text-white"
                          : "text-theme-primary hover:bg-theme-on-surface-2"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-caption-2m transition-colors ${
                currentPage === totalPages
                  ? "text-theme-tertiary cursor-not-allowed"
                  : "text-theme-primary hover:bg-theme-on-surface-2"
              }`}
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
