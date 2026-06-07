"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import { Strategy, Position, AgenticDecision } from "@/types/strategy";
import PerformanceMetrics from "./PerformanceMetrics";
import AgenticDecisions from "./AgenticDecisions";
import PositionsList from "./PositionsList";
import { getUsersStrategy } from "../../services/strategy.service";
import { getUserId } from "../../utils/userStorage";

type StrategyDetailPageProps = {
  strategyId: string;
};

const StrategyDetailPage = ({ strategyId }: StrategyDetailPageProps) => {
  const router = useRouter();
  const [strategy, setStrategy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "positions" | "decisions"
  >("overview");

  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setLoading(true);
        const userId = getUserId();

        if (!userId) {
          console.error("No user ID found. Please log in.");
          router.push("/sign-in");
          return;
        }

        const response = await getUsersStrategy(userId, strategyId);
        setStrategy(response);
      } catch (error) {
        console.error("Failed to fetch strategy:", error);
        router.push("/strategies");
      } finally {
        setLoading(false);
      }
    };
    fetchStrategy();
  }, [strategyId, router]);

  const handleStatusToggle = () => {
    if (!strategy) return;

    // TODO: Implement API call to update strategy status
    const newStatus =
      strategy.status === "active"
        ? "paused"
        : strategy.status === "paused"
        ? "active"
        : "active";

    const updatedStrategy = { ...strategy, status: newStatus };
    setStrategy(updatedStrategy);
  };

  if (loading || !strategy) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-primary-2 bg-theme-green-100";
      case "paused":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "inactive":
        return "text-theme-tertiary bg-theme-on-surface-2";
      default:
        return "text-theme-tertiary bg-theme-on-surface-2";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-primary-2";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-theme-red";
      default:
        return "text-theme-secondary";
    }
  };

  return (
    <Layout title="Strategy Details">
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => router.push("/strategies")}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                >
                  <Icon
                    className="w-5 h-5 fill-theme-secondary"
                    name="arrow-prev"
                  />
                </button>
                <h1 className="text-h4 text-theme-primary">{strategy.name}</h1>
                <span
                  className={`px-3 py-1 rounded-lg text-caption-2 font-semibold uppercase ${getStatusColor(
                    strategy.status
                  )}`}
                >
                  {strategy.status}
                </span>
              </div>
              <p className="text-base-2 text-theme-secondary mb-4">
                {strategy.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-caption-1 text-theme-tertiary">
                <span>
                  Risk:{" "}
                  <span
                    className={`font-semibold ${getRiskColor(
                      strategy.risk?.toLowerCase() || "medium"
                    )}`}
                  >
                    {(strategy.risk || "Medium").toUpperCase()}
                  </span>
                </span>
                <span>•</span>
                <span>
                  Created: {new Date(strategy.createdAt).toLocaleDateString()}
                </span>
                {strategy.visibility === "public" && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Icon
                        className="w-3 h-3 fill-theme-tertiary"
                        name="eye"
                      />
                      Public
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  router.push(`/strategies/${strategyId}/configure`);
                }}
                className="px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
              >
                Configure
              </button>
              <button
                onClick={handleStatusToggle}
                className={`px-6 py-3 rounded-xl transition-colors ${
                  strategy.status === "active"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-primary-1 hover:bg-primary-2 text-white"
                }`}
              >
                {strategy.status === "active"
                  ? "Pause Strategy"
                  : "Resume Strategy"}
              </button>
            </div>
          </div>

          {/* Performance Overview */}
          <PerformanceMetrics strategy={strategy} />
        </Card>

        {/* AI Agents Overview */}
        <Card title="AI Agents Configuration">
          <div className="space-y-6">
            {/* Agents Summary */}
            {strategy.agentConfigs && strategy.agentConfigs.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {strategy.agentConfigs.map((agentConfig: any) => {
                  const agent = agentConfig.agentId;
                  if (!agent) return null;

                  const getAgentIcon = (type: string) => {
                    switch (type) {
                      case "supervisor":
                        return { icon: "settings", color: "orange-500" };
                      case "executor":
                        return { icon: "trade", color: "indigo-500" };
                      case "technical":
                        return { icon: "star", color: "blue-500" };
                      case "sentiment":
                        return { icon: "news", color: "yellow-500" };
                      case "websearch":
                        return { icon: "search", color: "purple-500" };
                      default:
                        return { icon: "settings", color: "gray-500" };
                    }
                  };

                  const { icon, color } = getAgentIcon(agent.type);

                  return (
                    <div
                      key={agentConfig._id}
                      className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 fill-${color}`} name={icon} />
                        <div className="text-base-2 text-theme-primary font-semibold">
                          {agent.name}
                        </div>
                      </div>
                      <div className="text-caption-2 text-theme-secondary">
                        {agent.prompt}
                      </div>
                      {agentConfig.votingPower > 0 && (
                        <div
                          className={`mt-2 text-title-2 text-${color} font-semibold`}
                        >
                          {(agentConfig.votingPower * 100).toFixed(0)}%
                        </div>
                      )}
                      {agentConfig.customPrompt && (
                        <div className="mt-2 text-caption-2 text-theme-tertiary italic">
                          Custom prompt configured
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <div className="flex border-b border-theme-stroke mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-base-2 transition-colors ${
                activeTab === "overview"
                  ? "text-primary-1 border-b-2 border-primary-1"
                  : "text-theme-secondary hover:text-theme-primary"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("positions")}
              className={`px-6 py-3 text-base-2 transition-colors ${
                activeTab === "positions"
                  ? "text-primary-1 border-b-2 border-primary-1"
                  : "text-theme-secondary hover:text-theme-primary"
              }`}
            >
              Positions (0 Open)
            </button>
            <button
              onClick={() => setActiveTab("decisions")}
              className={`px-6 py-3 text-base-2 transition-colors ${
                activeTab === "decisions"
                  ? "text-primary-1 border-b-2 border-primary-1"
                  : "text-theme-secondary hover:text-theme-primary"
              }`}
            >
              AI Decisions (0)
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
                <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                  <div className="text-caption-2 text-theme-tertiary mb-2">
                    Total Trades
                  </div>
                  <div className="text-h5 text-theme-primary mb-1">0</div>
                  <div className="text-caption-2 text-theme-secondary">
                    0 wins / 0 losses
                  </div>
                </div>
                <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                  <div className="text-caption-2 text-theme-tertiary mb-2">
                    Open Positions
                  </div>
                  <div className="text-h5 text-theme-primary">0</div>
                </div>
                <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                  <div className="text-caption-2 text-theme-tertiary mb-2">
                    Closed Positions
                  </div>
                  <div className="text-h5 text-theme-primary">0</div>
                </div>
              </div>

              <div className="text-center py-12">
                <div className="text-theme-secondary">
                  Strategy is ready. Trading data will appear here once the
                  strategy starts executing.
                </div>
              </div>
            </div>
          )}

          {activeTab === "positions" && (
            <div className="text-center py-12">
              <div className="text-theme-secondary">No open positions</div>
            </div>
          )}

          {activeTab === "decisions" && (
            <div className="text-center py-12">
              <div className="text-theme-secondary">
                No AI decisions recorded yet
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default StrategyDetailPage;
