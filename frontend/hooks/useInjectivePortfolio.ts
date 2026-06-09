import { useState, useEffect } from "react";
import { getUserPortfolio } from "../services/hyperliquidPortfolio.service";
import { getUserData } from "../utils/userStorage";

export interface PortfolioState {
  totalValue: number;
  loading: boolean;
  error: string | null;
  injectiveAddress: string | null;
}

export const useInjectivePortfolio = (): PortfolioState => {
  const [state, setState] = useState<PortfolioState>({
    totalValue: 0,
    loading: false,
    error: null,
    injectiveAddress: null,
  });

  useEffect(() => {
    const userData = getUserData();
    if (!userData?.walletAddress) return;

    const injAddress = userData.walletAddress;

    const fetchData = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const portfolio = await getUserPortfolio(injAddress);

        let totalValue = 0;
        if (portfolio?.bankBalancesList) {
          for (const bal of portfolio.bankBalancesList) {
            if (bal.denom === "inj") {
              totalValue += parseFloat(bal.amount) / 1e18;
            }
          }
        }
        if (portfolio?.subaccountsList) {
          for (const sub of (portfolio as any).subaccountsList) {
            if (sub.denom === "peggy0xdAC17F958D2ee523a2206206994597C13D831ec7") {
              totalValue += parseFloat(sub.deposit?.totalBalance || "0") / 1e6;
            }
          }
        }

        setState({ totalValue, loading: false, error: null, injectiveAddress: injAddress });
      } catch (err: any) {
        setState((s) => ({ ...s, loading: false, error: err?.message || "Failed to fetch portfolio" }));
      }
    };

    fetchData();
  }, []);

  return state;
};
