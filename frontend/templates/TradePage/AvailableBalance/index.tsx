import CurrencyFormat from "@/components/CurrencyFormat";
import Tooltip from "@/components/Tooltip";
import { useInjectivePortfolio } from "../../../hooks/useInjectivePortfolio";

type AvailableBalanceProps = {};

const AvailableBalance = ({}: AvailableBalanceProps) => {
  const { totalValueUsd: totalValue, loading } = useInjectivePortfolio();

  return (
    <div className="card-sidebar">
      <div className="mb-6 text-title-1s md:mb-4 md:text-[1.125rem]">
        Available balance
      </div>
      {loading ? (
        <div className="text-base-1 text-theme-secondary">Loading...</div>
      ) : (
        <CurrencyFormat
          className="text-h3 mb-8"
          currency="$"
          value={totalValue}
        />
      )}
    </div>
  );
};

export default AvailableBalance;
