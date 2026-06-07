"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import { getUsersStrategy } from "../../services/strategy.service";
import { updateStrategy } from "../../services/strategy.service";
import { getUserId } from "../../utils/userStorage";

type AIConfigurationPageProps = {
  strategyId: string;
};

// Agent configuration from the API
interface AgentConfig {
  _id: string;
  votingPower: number;
  customPrompt: string;
  code: string;
  agentId: {
    _id: string;
    name: string;
    type: string;
    prompt: string;
  };
}

interface StrategyData {
  _id: string;
  userId: string;
  name: string;
  description: string;
  risk: string;
  agentConfigs: AgentConfig[];
}

const AIConfigurationPage = ({ strategyId }: AIConfigurationPageProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [originalStrategy, setOriginalStrategy] = useState<StrategyData | null>(
    null
  );

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [risk, setRisk] = useState<"Low" | "Medium" | "High">("Medium");
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);

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
        console.log("Fetched strategy:", response);

        setStrategy(response);
        setOriginalStrategy(JSON.parse(JSON.stringify(response))); // Deep copy

        // Populate form state
        setName(response.name || "");
        setDescription(response.description || "");
        setRisk((response.risk as "Low" | "Medium" | "High") || "Medium");
        setAgentConfigs(response.agentConfigs || []);
      } catch (error) {
        console.error("Failed to fetch strategy:", error);
        router.push("/strategies");
      } finally {
        setLoading(false);
      }
    };

    fetchStrategy();
  }, [strategyId, router]);

  // Calculate total voting power for technical, websearch, and sentiment agents
  const calculateVotingPowerSum = () => {
    const votingAgents = agentConfigs.filter((config) =>
      ["technical", "sentiment", "websearch"].includes(
        config.agentId.type.toLowerCase()
      )
    );
    return votingAgents.reduce((sum, config) => sum + config.votingPower, 0);
  };

  const votingPowerSum = calculateVotingPowerSum();
  const isVotingPowerValid = Math.abs(votingPowerSum - 1) < 0.001; // Allow small floating point errors

  const handleSave = async () => {
    if (!strategy || !originalStrategy) return;

    if (!isVotingPowerValid) {
      alert(
        "Total voting power for Technical, Sentiment, and WebSearch agents must equal 100%"
      );
      return;
    }

    setIsSaving(true);

    try {
      // Transform agentConfigs to the format expected by the API
      const agents = agentConfigs.map((config) => ({
        agentId: config.agentId._id,
        votingPower: config.votingPower,
        customPrompt: config.customPrompt || "",
        code: config.code || "",
      }));

      console.log("Saving strategy with payload:", {
        userId: strategy.userId,
        name,
        description,
        risk,
        agents,
      });

      const response = await updateStrategy(strategy.userId, strategyId, {
        name,
        description,
        risk,
        agents,
      });

      console.log("Strategy updated:", response);

      alert("Strategy updated successfully!");
      router.push(`/strategies/${strategyId}`);
    } catch (error) {
      console.error("Failed to update strategy:", error);
      alert("Failed to update strategy. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/strategies/${strategyId}`);
  };

  const handleAgentConfigChange = (
    index: number,
    field: "votingPower" | "customPrompt" | "code",
    value: any
  ) => {
    const updatedConfigs = [...agentConfigs];
    updatedConfigs[index] = {
      ...updatedConfigs[index],
      [field]: value,
    };
    setAgentConfigs(updatedConfigs);
  };

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

  if (loading || !strategy) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Configure Strategy">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => router.push(`/strategies/${strategyId}`)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                >
                  <Icon
                    className="w-5 h-5 fill-theme-secondary"
                    name="arrow-prev"
                  />
                </button>
                <div>
                  <h1 className="text-h4 text-theme-primary">
                    Configure Strategy
                  </h1>
                  <p className="text-base-2 text-theme-secondary">
                    Edit your strategy configuration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-3 border border-theme-stroke hover:bg-theme-on-surface-2 text-theme-primary rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !isVotingPowerValid}
                className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card title="Basic Information">
          <div className="space-y-4">
            <div>
              <label className="text-base-2 text-theme-primary mb-2 block">
                Strategy Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors"
                placeholder="Enter strategy name"
              />
            </div>

            <div>
              <label className="text-base-2 text-theme-primary mb-2 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-theme-on-surface-1 border border-theme-stroke rounded-xl text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                placeholder="Enter strategy description"
              />
            </div>

            <div>
              <label className="text-base-2 text-theme-primary mb-2 block">
                Risk Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(["Low", "Medium", "High"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRisk(level)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      risk === level
                        ? "border-primary-1 bg-primary-1/10"
                        : "border-theme-stroke hover:border-theme-stroke-hover"
                    }`}
                  >
                    <div className="text-base-2 text-theme-primary font-semibold">
                      {level}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* AI Agents Configuration */}
        <Card title="AI Agents Configuration">
          <div className="space-y-4">
            <p className="text-base-2 text-theme-secondary mb-4">
              Configure voting power, custom prompts, and code for each agent
            </p>

            {/* Voting Power Validation Indicator */}
            <div
              className={`p-4 rounded-xl border-2 transition-all ${
                isVotingPowerValid
                  ? "border-green-500 bg-green-500/10"
                  : votingPowerSum > 1
                  ? "border-red-500 bg-red-500/10"
                  : "border-yellow-500 bg-yellow-500/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-5 h-5 ${
                      isVotingPowerValid ? "fill-green-500" : "fill-yellow-500"
                    }`}
                    name={isVotingPowerValid ? "check" : "alert"}
                  />
                  <span className="text-base-2 text-theme-primary font-semibold">
                    Total Voting Power (Technical + Sentiment + WebSearch):{" "}
                    {(votingPowerSum * 100).toFixed(1)}%
                  </span>
                </div>
                <span
                  className={`text-caption-2 ${
                    isVotingPowerValid
                      ? "text-green-600"
                      : votingPowerSum > 1
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {isVotingPowerValid
                    ? "Perfect! Ready to save"
                    : votingPowerSum > 1
                    ? `Reduce by ${((votingPowerSum - 1) * 100).toFixed(1)}%`
                    : `Add ${((1 - votingPowerSum) * 100).toFixed(1)}% more`}
                </span>
              </div>
            </div>

            {agentConfigs.length === 0 ? (
              <div className="p-8 bg-theme-on-surface-1 rounded-xl border border-dashed border-theme-stroke text-center">
                <p className="text-base-2 text-theme-tertiary">
                  No agents configured for this strategy.
                </p>
              </div>
            ) : (
              agentConfigs.map((config, index) => {
                const { icon, color } = getAgentIcon(config.agentId.type);

                return (
                  <div
                    key={config._id}
                    className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke"
                  >
                    {/* Agent Header (Read-only) */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-theme-stroke">
                      <div
                        className={`w-12 h-12 rounded-full bg-${color}/20 flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 fill-${color}`} name={icon} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-title-1 text-theme-primary font-semibold">
                          {config.agentId.name}
                        </h4>
                        <p className="text-caption-1 text-theme-tertiary capitalize">
                          {config.agentId.type} Agent
                        </p>
                      </div>
                    </div>

                    {/* Default Agent Prompt (Read-only) */}
                    <div className="mb-4">
                      <label className="text-caption-1 text-theme-secondary mb-2 block">
                        Default Agent Prompt
                      </label>
                      <div className="p-3 bg-theme-on-surface-2 border border-theme-stroke rounded-lg">
                        <p className="text-caption-1 text-theme-tertiary italic">
                          {config.agentId.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-base-2 text-theme-primary mb-2 block">
                          Voting Power
                          {["supervisor", "executor"].includes(
                            config.agentId.type.toLowerCase()
                          ) && (
                            <span className="ml-2 text-caption-2 text-theme-tertiary italic">
                              (Fixed - Cannot be modified)
                            </span>
                          )}
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={config.votingPower}
                            onChange={(e) =>
                              handleAgentConfigChange(
                                index,
                                "votingPower",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            step="0.1"
                            min="0"
                            max="1"
                            disabled={["supervisor", "executor"].includes(
                              config.agentId.type.toLowerCase()
                            )}
                            className="flex-1 px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-lg text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Enter voting power (0-1)"
                          />
                          <div className="px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-lg text-base-2 text-theme-primary min-w-[80px] text-center">
                            {(config.votingPower * 100).toFixed(0)}%
                          </div>
                        </div>
                        <p className="text-caption-2 text-theme-tertiary mt-1">
                          {["supervisor", "executor"].includes(
                            config.agentId.type.toLowerCase()
                          )
                            ? "Supervisor and Executor voting power is fixed and cannot be changed"
                            : "Value between 0 and 1 (e.g., 0.2 = 20%)"}
                        </p>
                      </div>

                      <div>
                        <label className="text-base-2 text-theme-primary mb-2 block">
                          Custom Prompt (Optional)
                        </label>
                        <textarea
                          value={config.customPrompt || ""}
                          onChange={(e) =>
                            handleAgentConfigChange(
                              index,
                              "customPrompt",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-lg text-base-2 text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                          placeholder="Override the default prompt with custom instructions"
                        />
                        <p className="text-caption-2 text-theme-tertiary mt-1">
                          Leave empty to use the default agent prompt
                        </p>
                      </div>

                      {config.agentId.type === "technical" && (
                        <div>
                          <label className="text-base-2 text-theme-primary mb-2 block">
                            Code Configuration (Optional)
                          </label>
                          <textarea
                            value={config.code || ""}
                            onChange={(e) =>
                              handleAgentConfigChange(
                                index,
                                "code",
                                e.target.value
                              )
                            }
                            rows={8}
                            className="w-full px-4 py-3 bg-theme-on-surface-2 border border-theme-stroke rounded-lg text-caption-1 font-mono text-theme-primary focus:outline-none focus:border-primary-1 transition-colors resize-none"
                            placeholder="Enter custom code for technical analysis"
                          />
                          <p className="text-caption-2 text-theme-tertiary mt-1">
                            Custom code for technical agent strategies
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AIConfigurationPage;
