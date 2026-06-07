import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getUserPortfolio, getUserPositions } from "../services/hyperliquidPortfolio.service";
import { toInjectiveAddress } from "../utils/injectiveAddress";

export interface PortfolioState {
  totalValue: number;
  loading: boolean;
  error: string | null;
  injectiveAddress: string | null;
}

export const useInjectivePortfolio = (): PortfolioState => {
  const { authenticated, user } = usePrivy();
  const [state, setState] = useState<PortfolioState>({
    totalValue: 0,
    loading: false,
    error: null,
    injectiveAddress: null,
  });

  useEffect(() => {
    if (!authenticated || !user) return;

    const fetchData = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const wallet = user.linkedAccounts?.find((a) => a.type === "wallet");
        if (!wallet || !("address" in wallet)) return;

        const injAddress = toInjectiveAddress(wallet.address as string);

        const portfolio = await getUserPortfolio(injAddress);

        // Injective portfolio response shape: portfolio.bankBalances, portfolio.subaccounts
        let totalValue = 0;
        if (portfolio?.bankBalances) {
          for (const bal of portfolio.bankBalances) {
            if (bal.denom === "inj") {
              totalValue += parseFloat(bal.amount) / 1e18;
            }
          }
        }
        if (portfolio?.subaccounts) {
          for (const sub of portfolio.subaccounts) {
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
  }, [authenticated, user]);

  return state;
};
