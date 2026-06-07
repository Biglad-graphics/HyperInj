"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import { Strategy } from "@/types/strategy";
import StrategyList from "./StrategyList";
import { getUserStrategies, deleteStrategy } from "../../services/strategy.service";
import { getUserId } from "../../utils/userStorage";

const StrategiesPage = () => {
  const router = useRouter();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const userId = getUserId();

        if (!userId) {
          console.error("No user ID found. Please log in.");
          router.push("/sign-in");
          return;
        }

        const response = await getUserStrategies(userId);
        setStrategies(response);
      } catch (error) {
        console.error("Failed to fetch strategies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
  }, []);

  const handleCreateStrategy = () => {
    router.push("/strategies/create");
  };

  const handleViewStrategy = (strategyId: string) => {
    router.push(`/strategies/${strategyId}`);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    try {
      await deleteStrategy(strategyId);
      // Remove from local state
      const updatedStrategies = strategies.filter(
        (strategy) => strategy._id !== strategyId
      );
      setStrategies(updatedStrategies);
    } catch (error) {
      console.error("Failed to delete strategy:", error);
      alert("Failed to delete strategy. Please try again.");
    }
  };

  return (
    <Layout title="Strategies">
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-h5 text-theme-primary mb-1">
                Your Trading Strategies
              </h2>
              <p className="text-base-2 text-theme-secondary">
                Create and manage your automated trading strategies with
                AI-powered insights
              </p>
            </div>
            <button
              onClick={handleCreateStrategy}
              className="flex items-center px-6 py-3 bg-primary-1 text-white rounded-xl hover:bg-primary-2 transition-colors"
            >
              <Icon className="w-5 h-5 mr-2 fill-white" name="plus" />
              <span className="text-button-1">Create Strategy</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : strategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-theme-on-surface-1 rounded-2xl border-2 border-dashed border-theme-stroke">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-theme-on-surface-2 flex items-center justify-center">
                <Icon className="w-8 h-8 fill-theme-tertiary" name="settings" />
              </div>
              <h3 className="text-title-1 text-theme-primary mb-2">
                No strategies yet
              </h3>
              <p className="text-base-2 text-theme-secondary text-center max-w-md mb-6">
                Get started by creating your first automated trading strategy.
                Combine AI insights with technical analysis to maximize your
                returns.
              </p>
              <button
                onClick={handleCreateStrategy}
                className="flex items-center px-6 py-3 bg-primary-1 text-white rounded-xl hover:bg-primary-2 transition-colors"
              >
                <Icon className="w-5 h-5 mr-2 fill-white" name="plus" />
                <span className="text-button-1">
                  Create Your First Strategy
                </span>
              </button>
            </div>
          ) : (
            <StrategyList
              strategies={strategies}
              onViewStrategy={handleViewStrategy}
              onDeleteStrategy={handleDeleteStrategy}
            />
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default StrategiesPage;
