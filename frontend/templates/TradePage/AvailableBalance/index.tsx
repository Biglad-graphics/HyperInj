import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import CurrencyFormat from "@/components/CurrencyFormat";
import Tooltip from "@/components/Tooltip";
import { getUserPositions } from "../../../services/hyperliquidPortfolio.service";

type AvailableBalanceProps = {};

const AvailableBalance = ({}: AvailableBalanceProps) => {
  const [withdrawable, setWithdrawable] = useState<number>(0);
  const [currentMargin, setCurrentMargin] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { authenticated, user } = usePrivy();

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (authenticated && user) {
        try {
          setLoading(true);
          // Get wallet address from Privy user
          const wallet = user.linkedAccounts?.find(
            (account) => account.type === "wallet"
          );

          if (wallet && "address" in wallet) {
            const positions = await getUserPositions(wallet.address);
            if (positions?.withdrawable) {
              setWithdrawable(parseFloat(positions.withdrawable));
            }

            // Calculate Current Margin = totalMarginUsed + crossMarginSummary.totalMarginUsed
            const isolatedMargin = positions?.marginSummary?.totalMarginUsed
              ? parseFloat(positions.marginSummary.totalMarginUsed)
              : 0;
            const crossMargin = positions?.crossMarginSummary?.totalMarginUsed
              ? parseFloat(positions.crossMarginSummary.totalMarginUsed)
              : 0;
            setCurrentMargin(isolatedMargin + crossMargin);
          }
        } catch (error) {
          console.error("Error fetching portfolio data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPortfolioData();
  }, [authenticated, user]);

  return (
    <div className="card-sidebar">
      <div className="mb-6 text-title-1s md:mb-4 md:text-[1.125rem]">
        Available balance
      </div>
      {loading ? (
        <div className="text-base-1 text-theme-secondary">Loading...</div>
      ) : !authenticated ? (
        <div className="text-base-1 text-theme-secondary">
          Please connect your wallet
        </div>
      ) : (
        <>
          <CurrencyFormat
            className="text-h3 mb-8"
            currency="$"
            value={withdrawable}
          />

          <div className="pt-6 border-t border-theme-stroke">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base-2 text-theme-secondary mb-1">
                  Current Margin
                </div>
                <CurrencyFormat
                  className="text-title-1s"
                  currency="$"
                  value={currentMargin}
                  sameColor
                />
              </div>
              <Tooltip title="Current Margin is the sum of isolated margin and cross-margin used across all positions" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailableBalance;
