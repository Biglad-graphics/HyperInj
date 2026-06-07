"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Box,
  Text,
} from "@chakra-ui/react";
import {
  Strategy,
  RiskLevel,
  VisibilityType,
  TECHNICAL_STRATEGIES,
  TechnicalStrategy,
  AgentConfig,
  BacktestResult,
} from "@/types/strategy";
import TechnicalStrategySelector from "./TechnicalStrategySelector";
import { getAllAgents } from "../../services/agents.service";
import { createStrategy } from "../../services/strategy.service";
import { getUserId } from "../../utils/userStorage";

const CreateStrategyPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [formData, setFormData] = useState({
    // Page 1
    name: "",
    description: "",
    riskLevel: "medium" as RiskLevel,
    visibility: "private" as VisibilityType,

    // Page 2
    selectedTechnicalStrategies: [] as TechnicalStrategy[],
    customTechnicalStrategy: "",

    // Agent configs
    supervisor: { prompt: "" } as AgentConfig,
    executor: { prompt: "" } as AgentConfig,
    technical: { prompt: "", weightage: 33 } as AgentConfig,
    sentiment: { prompt: "", weightage: 33 } as AgentConfig,
    webSearch: { prompt: "", weightage: 34 } as AgentConfig,

    depositAmount: "",
  });

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState({
    python: "",
    pinescript: "",
  });
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(
    null
  );

  // View/Edit strategy modals
  const [showViewCodeModal, setShowViewCodeModal] = useState(false);
  const [viewingStrategyId, setViewingStrategyId] = useState<string | null>(
    null
  );
  const [showBacktestResultsModal, setShowBacktestResultsModal] =
    useState(false);
  const [viewingBacktestStrategyId, setViewingBacktestStrategyId] = useState<
    string | null
  >(null);

  // Fetch all agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoadingAgents(true);
        const response = await getAllAgents();
        setAgents(response);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAgentChange = (
    agent: "supervisor" | "executor" | "technical" | "sentiment" | "webSearch",
    field: "prompt" | "weightage",
    value: string | number
  ) => {
    setFormData({
      ...formData,
      [agent]: {
        ...formData[agent],
        [field]: value,
      },
    });
  };

  const handleTechnicalStrategyToggle = (strategy: TechnicalStrategy) => {
    const isSelected = formData.selectedTechnicalStrategies.some(
      (s) => s.id === strategy.id
    );
    if (isSelected) {
      setFormData({
        ...formData,
        selectedTechnicalStrategies:
          formData.selectedTechnicalStrategies.filter(
            (s) => s.id !== strategy.id
          ),
      });
    } else {
      setFormData({
        ...formData,
        selectedTechnicalStrategies: [
          ...formData.selectedTechnicalStrategies,
          strategy,
        ],
      });
    }
  };

  const handleGenerateAndBacktest = async () => {
    if (!formData.customTechnicalStrategy.trim()) return;

    setShowBacktestModal(true);
    setBacktestLoading(true);

    // Simulate API call to generate code and backtest
    setTimeout(() => {
      // Mock generated code
      const mockPythonCode = `import pandas as pd
import numpy as np
from backtesting import Strategy, Backtest

class CustomStrategy(Strategy):
    def init(self):
        # Initialize indicators based on prompt: ${formData.customTechnicalStrategy}
        self.sma20 = self.I(lambda: pd.Series(self.data.Close).rolling(20).mean())
        self.sma50 = self.I(lambda: pd.Series(self.data.Close).rolling(50).mean())

    def next(self):
        if self.sma20[-1] > self.sma50[-1] and not self.position:
            self.buy()
        elif self.sma20[-1] < self.sma50[-1] and self.position:
            self.position.close()`;

      const mockPinescriptCode = `//@version=5
strategy("Custom Strategy", overlay=true)

// Strategy based on: ${formData.customTechnicalStrategy}
sma20 = ta.sma(close, 20)
sma50 = ta.sma(close, 50)

longCondition = ta.crossover(sma20, sma50)
shortCondition = ta.crossunder(sma20, sma50)

if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")

plot(sma20, color=color.blue)
plot(sma50, color=color.red)`;

      setGeneratedCode({
        python: mockPythonCode,
        pinescript: mockPinescriptCode,
      });

      // Mock backtest results
      const mockResults: BacktestResult = {
        totalReturn: 2450.75,
        totalReturnPercentage: 24.51,
        sharpeRatio: 1.85,
        maxDrawdown: -12.3,
        winRate: 62.5,
        totalTrades: 48,
        avgWin: 125.3,
        avgLoss: -89.45,
        profitFactor: 1.92,
        equityCurve: [],
      };

      setBacktestResults(mockResults);
      setBacktestLoading(false);
    }, 2000);
  };

  const handleSaveBacktest = () => {
    // Add the custom strategy with generated code and backtest results to selected strategies
    const customStrategy: TechnicalStrategy = {
      id: `custom-${Date.now()}`,
      name: "Custom Strategy",
      description: formData.customTechnicalStrategy,
      isCustom: true,
      customPrompt: formData.customTechnicalStrategy,
      generatedCode: {
        python: generatedCode.python,
        pinescript: generatedCode.pinescript,
      },
      backtestResults: backtestResults || undefined,
    };

    setFormData({
      ...formData,
      selectedTechnicalStrategies: [
        ...formData.selectedTechnicalStrategies,
        customStrategy,
      ],
      customTechnicalStrategy: "",
    });
    setShowBacktestModal(false);
    setGeneratedCode({ python: "", pinescript: "" });
    setBacktestResults(null);
  };

  const handleViewCode = (strategyId: string) => {
    setViewingStrategyId(strategyId);
    setShowViewCodeModal(true);
  };

  const handleViewBacktestResults = (strategyId: string) => {
    setViewingBacktestStrategyId(strategyId);
    setShowBacktestResultsModal(true);
  };

  const handleRemoveStrategy = (strategyId: string) => {
    setFormData({
      ...formData,
      selectedTechnicalStrategies: formData.selectedTechnicalStrategies.filter(
        (s) => s.id !== strategyId
      ),
    });
  };

  const handleNext = () => {
    if (step === 1 && formData.name && formData.description) {
      setStep(2);
    } else if (step === 2) {
      setShowDepositModal(true);
    }
  };

  const handleDeposit = async () => {
    try {
      // Map agent configs to API format
      const agentConfigs = [];

      // Get agent IDs by type
      console.log("All agents:", agents);
      const supervisorAgent = agents.find((a) => a.type === "supervisor");
      const executorAgent = agents.find((a) => a.type === "executor");
      const technicalAgent = agents.find((a) => a.type === "technical");
      const sentimentAgent = agents.find((a) => a.type === "sentiment");
      const webSearchAgent = agents.find((a) => a.type === "websearch");

      console.log("Found agents:", {
        supervisor: supervisorAgent,
        executor: executorAgent,
        technical: technicalAgent,
        sentiment: sentimentAgent,
        webSearch: webSearchAgent
      });

      // Add supervisor (no voting power)
      if (supervisorAgent && formData.supervisor.prompt) {
        agentConfigs.push({
          agentId: supervisorAgent._id,
          votingPower: 0,
          customPrompt: formData.supervisor.prompt,
          code: {},
        });
      }

      // Add executor (no voting power)
      if (executorAgent && formData.executor.prompt) {
        agentConfigs.push({
          agentId: executorAgent._id,
          votingPower: 0,
          customPrompt: formData.executor.prompt,
          code: {},
        });
      }

      // Add technical agent with voting power
      const technicalWeightage = formData.technical?.weightage ?? 0;
      if (technicalAgent && technicalWeightage > 0) {
        agentConfigs.push({
          agentId: technicalAgent._id,
          votingPower: technicalWeightage / 100, // Convert percentage to decimal
          customPrompt: formData.technical?.prompt || "",
          code:
            formData.selectedTechnicalStrategies.length > 0
              ? JSON.stringify(formData.selectedTechnicalStrategies)
              : {},
        });
      }

      // Add sentiment agent with voting power
      if (sentimentAgent && (formData.sentiment?.weightage ?? 0) > 0) {
        agentConfigs.push({
          agentId: sentimentAgent._id,
          votingPower: (formData.sentiment?.weightage ?? 0) / 100, // Convert percentage to decimal
          customPrompt: formData.sentiment?.prompt || "",
          code: {},
        });
      }

      // Add web search agent with voting power
      if (webSearchAgent && (formData.webSearch?.weightage ?? 0) > 0) {
        agentConfigs.push({
          agentId: webSearchAgent._id,
          votingPower: (formData.webSearch?.weightage ?? 0) / 100, // Convert percentage to decimal
          customPrompt: formData.webSearch?.prompt || "",
          code: {},
        });
      }

      const strategyData = {
        name: formData.name,
        description: formData.description,
        risk:
          formData.riskLevel.charAt(0).toUpperCase() +
          formData.riskLevel.slice(1), // Capitalize first letter
        agents: agentConfigs,
      };

      console.log("Agent configs built:", agentConfigs);
      console.log("Form data:", formData);
      console.log("Strategy data to send:", strategyData);

      const userId = getUserId();

      if (!userId) {
        console.error("No user ID found. Please log in.");
        alert("Please log in to create a strategy.");
        router.push("/sign-in");
        return;
      }

      const response = await createStrategy(userId, strategyData);

      console.log("Strategy created successfully:", response);
      router.push("/strategies");
    } catch (error) {
      console.error("Failed to create strategy:", error);
      alert("Failed to create strategy. Please try again.");
    }
  };

  // Validation
  const isStep1Valid = formData.name.trim() && formData.description.trim();

  const weightageSum =
    (formData.technical.weightage || 0) +
    (formData.sentiment.weightage || 0) +
    (formData.webSearch.weightage || 0);
  const isWeightageValid = weightageSum === 100;
  const isStep2Valid =
    formData.depositAmount &&
    parseFloat(formData.depositAmount) > 0 &&
    isWeightageValid;

  return (
    <Layout title="Create Strategy">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`flex items-center flex-1 ${
                step >= 1 ? "text-primary-1" : "text-theme-tertiary"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 1
                    ? "bg-primary-1 text-white"
                    : "bg-theme-on-surface-2 text-theme-tertiary"
                }`}
              >
                {step > 1 ? (
                  <Icon className="w-5 h-5 fill-white" name="check" />
                ) : (
                  "1"
                )}
              </div>
              <span className="ml-3 text-base-2 font-semibold">
                Basic Information
              </span>
            </div>
            <div className="h-0.5 flex-1 bg-theme-stroke mx-4"></div>
            <div
              className={`flex items-center flex-1 ${
                step >= 2 ? "text-primary-1" : "text-theme-tertiary"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 2
                    ? "bg-primary-1 text-white"
                    : "bg-theme-on-surface-2 text-theme-tertiary"
                }`}
              >
                2
              </div>
              <span className="ml-3 text-base-2 font-semibold">
                Agent Configuration
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <div className="space-y-6">
              <div>
                <Field
                  label="Strategy Name"
                  placeholder="e.g., Bitcoin Scalping Strategy"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  note="Give your strategy a descriptive name"
                />
              </div>

              <Field
                label="Description"
                placeholder="Describe your trading strategy and objectives..."
                textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                note="Explain what this strategy aims to achieve"
              />

              <div>
                <div className="text-base-2 text-theme-primary mb-3">
                  Risk Level
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(["low", "medium", "high"] as RiskLevel[]).map((risk) => (
                    <button
                      key={risk}
                      onClick={() => handleInputChange("riskLevel", risk)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.riskLevel === risk
                          ? "border-primary-1 bg-primary-1/10"
                          : "border-theme-stroke hover:border-theme-secondary"
                      }`}
                    >
                      <div className="text-title-2 text-theme-primary mb-1 capitalize">
                        {risk}
                      </div>
                      <div className="text-caption-2 text-theme-tertiary">
                        {risk === "low" && "Conservative approach"}
                        {risk === "medium" && "Balanced risk-reward"}
                        {risk === "high" && "Aggressive trading"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-base-2 text-theme-primary mb-3">
                  Visibility
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(["private", "public"] as VisibilityType[]).map(
                    (visibility) => (
                      <button
                        key={visibility}
                        onClick={() =>
                          handleInputChange("visibility", visibility)
                        }
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.visibility === visibility
                            ? "border-primary-1 bg-primary-1/10"
                            : "border-theme-stroke hover:border-theme-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className="w-4 h-4 fill-theme-primary"
                            name={visibility === "public" ? "eye" : "lock"}
                          />
                          <div className="text-title-2 text-theme-primary capitalize">
                            {visibility}
                          </div>
                        </div>
                        <div className="text-caption-2 text-theme-tertiary text-left">
                          {visibility === "private" && "Only visible to you"}
                          {visibility === "public" && "Share with community"}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className={`px-6 py-3 text-base-2 text-white rounded-xl transition-colors ${
                    isStep1Valid
                      ? "bg-primary-1 hover:bg-primary-2"
                      : "bg-theme-on-surface-2 text-theme-tertiary cursor-not-allowed"
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Agent Configuration */}
        {step === 2 && (
          <div className="space-y-6">
            {/* AI Agents Configuration */}
            <Card title="AI Agents Configuration">
              <div className="space-y-8">
                {/* Weightage Summary */}
                <div
                  className={`p-4 rounded-xl border-2 ${
                    isWeightageValid
                      ? "border-green-500 bg-green-500/10"
                      : weightageSum > 100
                      ? "border-red-500 bg-red-500/10"
                      : "border-yellow-500 bg-yellow-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-5 h-5 ${
                          isWeightageValid
                            ? "fill-green-500"
                            : "fill-yellow-500"
                        }`}
                        name={isWeightageValid ? "check" : "alert"}
                      />
                      <span className="text-base-2 text-theme-primary font-semibold">
                        Total Weightage: {weightageSum}%
                      </span>
                    </div>
                    <span
                      className={`text-caption-2 ${
                        isWeightageValid
                          ? "text-green-600"
                          : weightageSum > 100
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {isWeightageValid
                        ? "Perfect! Ready to proceed"
                        : weightageSum > 100
                        ? `Reduce by ${weightageSum - 100}%`
                        : `Add ${100 - weightageSum}% more`}
                    </span>
                  </div>
                </div>

                {/* Supervisor Agent */}
                <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Icon
                        className="w-5 h-5 fill-orange-500"
                        name="settings"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-title-2 text-theme-primary font-semibold">
                        Supervisor Agent
                      </h4>
                      <p className="text-caption-2 text-theme-tertiary">
                        Oversees and coordinates other agents (No voting power)
                      </p>
                    </div>
                  </div>
                  <Field
                    label="Custom Prompt (Optional)"
                    placeholder="Enter instructions for the supervisor agent..."
                    textarea
                    value={formData.supervisor.prompt}
                    onChange={(e) =>
                      handleAgentChange("supervisor", "prompt", e.target.value)
                    }
                  />
                </div>

                {/* Executor Agent */}
                <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 fill-indigo-500" name="trade" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-title-2 text-theme-primary font-semibold">
                        Executor Agent
                      </h4>
                      <p className="text-caption-2 text-theme-tertiary">
                        Executes trading decisions (No voting power)
                      </p>
                    </div>
                  </div>
                  <Field
                    label="Custom Prompt (Optional)"
                    placeholder="Enter instructions for the executor agent..."
                    textarea
                    value={formData.executor.prompt}
                    onChange={(e) =>
                      handleAgentChange("executor", "prompt", e.target.value)
                    }
                  />
                </div>

                {/* Technical Agent */}
                <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 fill-blue-500" name="star" />
                      </div>
                      <div>
                        <h4 className="text-title-2 text-theme-primary font-semibold">
                          Technical Agent
                        </h4>
                        <p className="text-caption-2 text-theme-tertiary">
                          Analyzes technical indicators and strategies
                        </p>
                      </div>
                    </div>
                    <Text className="text-title-2 text-theme-primary font-semibold">
                      {formData.technical.weightage}%
                    </Text>
                  </div>

                  <div className="mb-6">
                    <Box px={2}>
                      <Slider
                        value={formData.technical.weightage}
                        onChange={(value) =>
                          handleAgentChange("technical", "weightage", value)
                        }
                        min={0}
                        max={100}
                        step={1}
                      >
                        <SliderTrack height="6px" borderRadius="3px">
                          <SliderFilledTrack bg="blue.500" />
                        </SliderTrack>
                        <SliderThumb
                          width="20px"
                          height="20px"
                          bg="blue.500"
                          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                        />
                      </Slider>
                    </Box>
                  </div>

                  {/* Pre-built Technical Strategies */}
                  <div className="mb-6">
                    <div className="text-base-2 text-theme-primary mb-3">
                      Pre-built Technical Strategies
                    </div>
                    <p className="text-caption-2 text-theme-secondary mb-4">
                      Select one or more technical analysis strategies
                    </p>
                    <TechnicalStrategySelector
                      strategies={TECHNICAL_STRATEGIES}
                      selectedStrategies={formData.selectedTechnicalStrategies}
                      onToggle={handleTechnicalStrategyToggle}
                    />
                  </div>

                  {/* Custom Technical Strategies - Show added ones */}
                  {formData.selectedTechnicalStrategies.filter(
                    (t) => t.isCustom
                  ).length > 0 && (
                    <div className="mb-6">
                      <div className="text-base-2 text-theme-primary mb-3 font-semibold">
                        Custom Strategies Added
                      </div>
                      <div className="space-y-3">
                        {formData.selectedTechnicalStrategies
                          .filter((t) => t.isCustom)
                          .map((tech) => (
                            <div
                              key={tech.id}
                              className="p-4 rounded-xl border border-blue-500 bg-blue-500/5"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="text-base-2 text-theme-primary mb-1 font-semibold">
                                    {tech.name}
                                  </div>
                                  <div className="text-caption-2 text-theme-secondary">
                                    {tech.description}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveStrategy(tech.id)}
                                  className="p-2 hover:bg-theme-on-surface-2 rounded-lg transition-colors"
                                  title="Remove strategy"
                                >
                                  <Icon
                                    className="w-4 h-4 fill-red-500"
                                    name="close"
                                  />
                                </button>
                              </div>

                              {tech.generatedCode && (
                                <div className="mt-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-caption-2 text-theme-tertiary">
                                      Generated Code
                                    </div>
                                    <button
                                      onClick={() => handleViewCode(tech.id)}
                                      className="text-caption-2 text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                    >
                                      <Icon
                                        className="w-3 h-3 fill-blue-500"
                                        name="code"
                                      />
                                      View Code
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    {tech.generatedCode.pinescript && (
                                      <span className="px-2 py-1 bg-theme-on-surface-2 rounded text-caption-2 text-theme-primary">
                                        Pine Script
                                      </span>
                                    )}
                                    {tech.generatedCode.python && (
                                      <span className="px-2 py-1 bg-theme-on-surface-2 rounded text-caption-2 text-theme-primary">
                                        Python
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {tech.backtestResults && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-caption-2 text-theme-tertiary">
                                      Backtest Results
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleViewBacktestResults(tech.id)
                                      }
                                      className="text-caption-2 text-blue-500 hover:text-blue-600"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 bg-theme-on-surface-2 rounded-lg">
                                      <div className="text-caption-2 text-theme-tertiary mb-1">
                                        Return
                                      </div>
                                      <div
                                        className={`text-caption-1 font-semibold ${
                                          tech.backtestResults
                                            .totalReturnPercentage > 0
                                            ? "text-green-500"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {tech.backtestResults.totalReturnPercentage.toFixed(
                                          2
                                        )}
                                        %
                                      </div>
                                    </div>
                                    <div className="p-2 bg-theme-on-surface-2 rounded-lg">
                                      <div className="text-caption-2 text-theme-tertiary mb-1">
                                        Win Rate
                                      </div>
                                      <div className="text-caption-1 font-semibold text-theme-primary">
                                        {tech.backtestResults.winRate.toFixed(
                                          1
                                        )}
                                        %
                                      </div>
                                    </div>
                                    <div className="p-2 bg-theme-on-surface-2 rounded-lg">
                                      <div className="text-caption-2 text-theme-tertiary mb-1">
                                        Sharpe
                                      </div>
                                      <div className="text-caption-1 font-semibold text-theme-primary">
                                        {tech.backtestResults.sharpeRatio.toFixed(
                                          2
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Strategy Description */}
                  <div>
                    <div className="text-base-2 text-theme-primary mb-2">
                      Or Add Custom Strategy Description
                    </div>
                    <Field
                      placeholder="Describe your custom technical strategy..."
                      textarea
                      value={formData.customTechnicalStrategy}
                      onChange={(e) =>
                        handleInputChange(
                          "customTechnicalStrategy",
                          e.target.value
                        )
                      }
                    />

                    {formData.customTechnicalStrategy.trim() && (
                      <button
                        onClick={handleGenerateAndBacktest}
                        className="mt-3 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon className="w-5 h-5 fill-white" name="code" />
                        Generate & Backtest
                      </button>
                    )}
                  </div>
                </div>

                {/* Sentiment Agent */}
                <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 fill-yellow-500" name="news" />
                      </div>
                      <div>
                        <h4 className="text-title-2 text-theme-primary font-semibold">
                          Sentiment Agent
                        </h4>
                        <p className="text-caption-2 text-theme-tertiary">
                          Analyzes market sentiment
                        </p>
                      </div>
                    </div>
                    <Text className="text-title-2 text-theme-primary font-semibold">
                      {formData.sentiment.weightage}%
                    </Text>
                  </div>

                  <div className="mb-4">
                    <Box px={2}>
                      <Slider
                        value={formData.sentiment.weightage}
                        onChange={(value) =>
                          handleAgentChange("sentiment", "weightage", value)
                        }
                        min={0}
                        max={100}
                        step={1}
                      >
                        <SliderTrack height="6px" borderRadius="3px">
                          <SliderFilledTrack bg="yellow.500" />
                        </SliderTrack>
                        <SliderThumb
                          width="20px"
                          height="20px"
                          bg="yellow.500"
                          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                        />
                      </Slider>
                    </Box>
                  </div>

                  <Field
                    label="Custom Prompt (Optional)"
                    placeholder="Enter instructions for sentiment analysis..."
                    textarea
                    value={formData.sentiment.prompt}
                    onChange={(e) =>
                      handleAgentChange("sentiment", "prompt", e.target.value)
                    }
                  />
                </div>

                {/* Web Search Agent */}
                <div className="p-6 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Icon
                          className="w-5 h-5 fill-purple-500"
                          name="search"
                        />
                      </div>
                      <div>
                        <h4 className="text-title-2 text-theme-primary font-semibold">
                          Web Search Agent
                        </h4>
                        <p className="text-caption-2 text-theme-tertiary">
                          Searches web for market insights
                        </p>
                      </div>
                    </div>
                    <Text className="text-title-2 text-theme-primary font-semibold">
                      {formData.webSearch.weightage}%
                    </Text>
                  </div>

                  <div className="mb-4">
                    <Box px={2}>
                      <Slider
                        value={formData.webSearch.weightage}
                        onChange={(value) =>
                          handleAgentChange("webSearch", "weightage", value)
                        }
                        min={0}
                        max={100}
                        step={1}
                      >
                        <SliderTrack height="6px" borderRadius="3px">
                          <SliderFilledTrack bg="purple.500" />
                        </SliderTrack>
                        <SliderThumb
                          width="20px"
                          height="20px"
                          bg="purple.500"
                          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                        />
                      </Slider>
                    </Box>
                  </div>

                  <Field
                    label="Custom Prompt (Optional)"
                    placeholder="Enter instructions for web search..."
                    textarea
                    value={formData.webSearch.prompt}
                    onChange={(e) =>
                      handleAgentChange("webSearch", "prompt", e.target.value)
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Deposit Amount */}
            <Card title="Deposit Amount">
              <div className="space-y-4">
                <Field
                  label="Initial Deposit (USD)"
                  type="number"
                  placeholder="1000"
                  value={formData.depositAmount}
                  onChange={(e) =>
                    handleInputChange("depositAmount", e.target.value)
                  }
                  note="Minimum deposit: $100"
                />
                {parseFloat(formData.depositAmount) > 0 && (
                  <div className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                    <div className="text-caption-2 text-theme-tertiary mb-2">
                      Estimated Position Sizes
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-caption-2 text-theme-tertiary">
                          Low Risk
                        </div>
                        <div className="text-base-2 text-theme-primary">
                          $
                          {(parseFloat(formData.depositAmount) * 0.02).toFixed(
                            2
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-caption-2 text-theme-tertiary">
                          Medium Risk
                        </div>
                        <div className="text-base-2 text-theme-primary">
                          $
                          {(parseFloat(formData.depositAmount) * 0.05).toFixed(
                            2
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-caption-2 text-theme-tertiary">
                          High Risk
                        </div>
                        <div className="text-base-2 text-theme-primary">
                          $
                          {(parseFloat(formData.depositAmount) * 0.1).toFixed(
                            2
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isStep2Valid}
                className={`px-6 py-3 text-base-2 text-white rounded-xl transition-colors ${
                  isStep2Valid
                    ? "bg-primary-1 hover:bg-primary-2"
                    : "bg-theme-on-surface-2 text-theme-tertiary cursor-not-allowed"
                }`}
              >
                Review & Deposit
              </button>
            </div>
          </div>
        )}

        {/* Backtest Modal */}
        {showBacktestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-theme-on-surface-1 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h5 text-theme-primary">
                  Generated Code & Backtest Results
                </h3>
                <button
                  onClick={() => setShowBacktestModal(false)}
                  className="text-theme-tertiary hover:text-theme-primary"
                >
                  <Icon className="w-6 h-6 fill-current" name="close" />
                </button>
              </div>

              {backtestLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-base-2 text-theme-secondary">
                    Generating code and running backtest...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Generated Code */}
                  <div>
                    <h4 className="text-title-2 text-theme-primary font-semibold mb-3">
                      Python Code
                    </h4>
                    <textarea
                      value={generatedCode.python}
                      onChange={(e) =>
                        setGeneratedCode({
                          ...generatedCode,
                          python: e.target.value,
                        })
                      }
                      className="w-full h-64 p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary resize-none"
                    />
                  </div>

                  <div>
                    <h4 className="text-title-2 text-theme-primary font-semibold mb-3">
                      PineScript Code
                    </h4>
                    <textarea
                      value={generatedCode.pinescript}
                      onChange={(e) =>
                        setGeneratedCode({
                          ...generatedCode,
                          pinescript: e.target.value,
                        })
                      }
                      className="w-full h-64 p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary resize-none"
                    />
                  </div>

                  {/* Backtest Results */}
                  {backtestResults && (
                    <div>
                      <h4 className="text-title-2 text-theme-primary font-semibold mb-3">
                        Backtest Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                          <div className="text-caption-2 text-theme-tertiary mb-1">
                            Total Return
                          </div>
                          <div className="text-title-1 text-green-500 font-semibold">
                            ${backtestResults.totalReturn.toFixed(2)}
                          </div>
                          <div className="text-caption-2 text-green-500">
                            {backtestResults.totalReturnPercentage.toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                          <div className="text-caption-2 text-theme-tertiary mb-1">
                            Sharpe Ratio
                          </div>
                          <div className="text-title-1 text-theme-primary font-semibold">
                            {backtestResults.sharpeRatio.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                          <div className="text-caption-2 text-theme-tertiary mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-title-1 text-red-500 font-semibold">
                            {backtestResults.maxDrawdown.toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                          <div className="text-caption-2 text-theme-tertiary mb-1">
                            Win Rate
                          </div>
                          <div className="text-title-1 text-theme-primary font-semibold">
                            {backtestResults.winRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                          <div className="text-caption-2 text-theme-tertiary mb-1">
                            Total Trades
                          </div>
                          <div className="text-title-1 text-theme-primary font-semibold">
                            {backtestResults.totalTrades}
                          </div>
                        </div>
                        <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                          <div className="text-caption-2 text-theme-tertiary mb-1">
                            Profit Factor
                          </div>
                          <div className="text-title-1 text-theme-primary font-semibold">
                            {backtestResults.profitFactor.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowBacktestModal(false)}
                      className="flex-1 px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBacktest}
                      className="flex-1 px-6 py-3 text-base-2 text-white bg-primary-1 rounded-xl hover:bg-primary-2 transition-colors"
                    >
                      Save & Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-theme-on-surface-1 rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-h5 text-theme-primary mb-4">
                Confirm Deposit
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-base-2 text-theme-secondary">
                    Strategy
                  </span>
                  <span className="text-base-2 text-theme-primary font-semibold">
                    {formData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-2 text-theme-secondary">
                    Deposit Amount
                  </span>
                  <span className="text-title-1 text-theme-primary font-semibold">
                    ${parseFloat(formData.depositAmount).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-caption-2 text-theme-tertiary mb-6">
                Connect your wallet to deposit funds and activate your strategy.
                The strategy will start trading automatically once the deposit
                is confirmed.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-6 py-3 text-base-2 text-theme-secondary border border-theme-stroke rounded-xl hover:bg-theme-on-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  className="flex-1 px-6 py-3 text-base-2 text-white bg-primary-1 rounded-xl hover:bg-primary-2 transition-colors"
                >
                  Connect Wallet & Deposit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Code Modal */}
        {showViewCodeModal && viewingStrategyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-theme-on-surface-1 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h5 text-theme-primary">
                  View Generated Code
                </h3>
                <button
                  onClick={() => {
                    setShowViewCodeModal(false);
                    setViewingStrategyId(null);
                  }}
                  className="text-theme-tertiary hover:text-theme-primary"
                >
                  <Icon className="w-6 h-6 fill-current" name="close" />
                </button>
              </div>

              {(() => {
                const strategy = formData.selectedTechnicalStrategies.find(
                  (s) => s.id === viewingStrategyId
                );
                if (!strategy || !strategy.generatedCode) return null;

                return (
                  <div className="space-y-6">
                    {strategy.generatedCode.python && (
                      <div>
                        <h4 className="text-title-2 text-theme-primary font-semibold mb-3">
                          Python Code
                        </h4>
                        <pre className="w-full p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary overflow-x-auto max-h-96 overflow-y-auto">
                          <code>{strategy.generatedCode.python}</code>
                        </pre>
                      </div>
                    )}

                    {strategy.generatedCode.pinescript && (
                      <div>
                        <h4 className="text-title-2 text-theme-primary font-semibold mb-3">
                          PineScript Code
                        </h4>
                        <pre className="w-full p-4 bg-theme-on-surface-2 border border-theme-stroke rounded-xl text-caption-1 font-mono text-theme-primary overflow-x-auto max-h-96 overflow-y-auto">
                          <code>{strategy.generatedCode.pinescript}</code>
                        </pre>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setShowViewCodeModal(false);
                          setViewingStrategyId(null);
                        }}
                        className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* View Backtest Results Modal */}
        {showBacktestResultsModal && viewingBacktestStrategyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-theme-on-surface-1 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h5 text-theme-primary">Backtest Results</h3>
                <button
                  onClick={() => {
                    setShowBacktestResultsModal(false);
                    setViewingBacktestStrategyId(null);
                  }}
                  className="text-theme-tertiary hover:text-theme-primary"
                >
                  <Icon className="w-6 h-6 fill-current" name="close" />
                </button>
              </div>

              {(() => {
                const strategy = formData.selectedTechnicalStrategies.find(
                  (s) => s.id === viewingBacktestStrategyId
                );
                if (!strategy || !strategy.backtestResults) return null;

                const results = strategy.backtestResults;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Total Return
                        </div>
                        <div className="text-title-1 text-green-500 font-semibold">
                          ${results.totalReturn.toFixed(2)}
                        </div>
                        <div className="text-caption-2 text-green-500">
                          {results.totalReturnPercentage.toFixed(2)}%
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Sharpe Ratio
                        </div>
                        <div className="text-title-1 text-theme-primary font-semibold">
                          {results.sharpeRatio.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Max Drawdown
                        </div>
                        <div className="text-title-1 text-red-500 font-semibold">
                          {results.maxDrawdown.toFixed(2)}%
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Win Rate
                        </div>
                        <div className="text-title-1 text-theme-primary font-semibold">
                          {results.winRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Total Trades
                        </div>
                        <div className="text-title-1 text-theme-primary font-semibold">
                          {results.totalTrades}
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Profit Factor
                        </div>
                        <div className="text-title-1 text-theme-primary font-semibold">
                          {results.profitFactor.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Avg Win
                        </div>
                        <div className="text-base-2 text-green-500">
                          ${results.avgWin.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 bg-theme-on-surface-2 rounded-xl">
                        <div className="text-caption-2 text-theme-tertiary mb-1">
                          Avg Loss
                        </div>
                        <div className="text-base-2 text-red-500">
                          ${results.avgLoss.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setShowBacktestResultsModal(false);
                          setViewingBacktestStrategyId(null);
                        }}
                        className="px-6 py-3 bg-primary-1 hover:bg-primary-2 text-white rounded-xl transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateStrategyPage;
