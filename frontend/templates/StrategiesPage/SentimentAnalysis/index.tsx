"use client";

import { useState, useEffect } from "react";
import {
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Box,
    Text,
} from "@chakra-ui/react";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Icon from "@/components/Icon";

type SentimentAnalysisConfig = {
    weightage: number;
    prompt: string;
};

const SentimentAnalysis = () => {
    const [config, setConfig] = useState<SentimentAnalysisConfig>({
        weightage: 50,
        prompt: "",
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const savedConfig = localStorage.getItem("sentiment_analysis_config");
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                setConfig(parsed);
            } catch (error) {
                console.error("Failed to parse saved config:", error);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("sentiment_analysis_config", JSON.stringify(config));
        setIsEditing(false);
    };

    const handleReset = () => {
        setConfig({ weightage: 50, prompt: "" });
        setIsEditing(true);
    };

    return (
        <Card
            title="Sentiment Analysis"
            rightContent={
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-theme-on-surface-2 transition-colors"
                        title="Reset Configuration"
                    >
                        <Icon
                            className="w-4 h-4 fill-theme-secondary"
                            name="refresh"
                        />
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            isEditing
                                ? "bg-primary-1 hover:bg-primary-2"
                                : "hover:bg-theme-on-surface-2"
                        }`}
                        title={isEditing ? "View Mode" : "Edit Mode"}
                    >
                        <Icon
                            className={`w-4 h-4 ${
                                isEditing
                                    ? "fill-white"
                                    : "fill-theme-secondary"
                            }`}
                            name={isEditing ? "check" : "settings"}
                        />
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                        <div className="flex-1">
                            <div className="text-base-1s text-theme-primary mb-2">
                                Customize how the AI processes social sentiment and news events
                            </div>
                            <div className="text-caption-2 text-theme-secondary mb-3">
                                <strong className="text-primary-1">Best for:</strong> Swing trading, trend following strategies
                            </div>
                            <div className="text-caption-2 text-theme-secondary">
                                Monitor social sentiment and market psychology
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:grid-cols-1 md:gap-2">
                        <div className="p-3 bg-theme-on-surface-1 rounded-lg border border-theme-stroke">
                            <div className="text-base-2s text-theme-primary mb-1">Social Media</div>
                            <div className="text-caption-2 text-theme-secondary">Twitter, Reddit, and forum sentiment tracking</div>
                        </div>
                        <div className="p-3 bg-theme-on-surface-1 rounded-lg border border-theme-stroke">
                            <div className="text-base-2s text-theme-primary mb-1">News Events</div>
                            <div className="text-caption-2 text-theme-secondary">Real-time news impact analysis</div>
                        </div>
                        <div className="p-3 bg-theme-on-surface-1 rounded-lg border border-theme-stroke">
                            <div className="text-base-2s text-theme-primary mb-1">Fear & Greed</div>
                            <div className="text-caption-2 text-theme-secondary">Market psychology indicators</div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <Text className="text-base-2 text-theme-secondary">
                            Agentic Weightage
                        </Text>
                        <Text className="text-title-2 text-theme-primary font-semibold">
                            {config.weightage}%
                        </Text>
                    </div>
                    <Box px={2}>
                        <Slider
                            value={config.weightage}
                            onChange={(value) =>
                                setConfig({ ...config, weightage: value })
                            }
                            isDisabled={!isEditing}
                            min={0}
                            max={100}
                            step={1}
                        >
                            <SliderTrack height="6px" borderRadius="3px">
                                <SliderFilledTrack bg="green.500" />
                            </SliderTrack>
                            <SliderThumb
                                width="20px"
                                height="20px"
                                bg="green.500"
                                boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                            />
                        </Slider>
                    </Box>
                    <div className="flex justify-between text-caption-2 text-theme-tertiary mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div>
                    <Field
                        label="Custom Prompt"
                        placeholder="Enter your custom prompt for sentiment analysis..."
                        textarea
                        value={config.prompt}
                        onChange={(e) =>
                            setConfig({ ...config, prompt: e.target.value })
                        }
                        disabled={!isEditing}
                        note="Provide specific instructions for how the AI should perform sentiment analysis on market data."
                    />
                </div>

                {isEditing && (
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-base-2 text-theme-secondary border border-theme-stroke rounded-lg hover:bg-theme-on-surface-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-base-2 text-white bg-primary-1 rounded-lg hover:bg-primary-2 transition-colors"
                        >
                            Save Configuration
                        </button>
                    </div>
                )}

                {!isEditing && config.prompt && (
                    <div className="p-4 bg-theme-on-surface-1 rounded-lg border border-theme-stroke">
                        <Text className="text-caption-2 text-theme-tertiary mb-2">
                            Current Configuration:
                        </Text>
                        <Text className="text-base-2 text-theme-primary">
                            Weightage: {config.weightage}%
                        </Text>
                        <Text className="text-base-2 text-theme-secondary mt-2">
                            {config.prompt}
                        </Text>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default SentimentAnalysis;