"use client";

import { TechnicalStrategy } from "@/types/strategy";
import Icon from "@/components/Icon";

type TechnicalStrategySelectorProps = {
    strategies: TechnicalStrategy[];
    selectedStrategies: TechnicalStrategy[];
    onToggle: (strategy: TechnicalStrategy) => void;
};

const TechnicalStrategySelector = ({
    strategies,
    selectedStrategies,
    onToggle,
}: TechnicalStrategySelectorProps) => {
    const getStrategyId = (strategy: any) => strategy._id || strategy.id;

    const isSelected = (strategy: TechnicalStrategy) => {
        return selectedStrategies.some((s) => getStrategyId(s) === getStrategyId(strategy));
    };

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {strategies.map((strategy) => {
                const selected = isSelected(strategy);
                return (
                    <button
                        key={getStrategyId(strategy)}
                        onClick={() => onToggle(strategy)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selected
                                ? "border-primary-1 bg-primary-1/10"
                                : "border-theme-stroke hover:border-theme-secondary"
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-base-2s text-theme-primary">
                                {strategy.name}
                            </div>
                            <div
                                className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                                    selected
                                        ? "border-primary-1 bg-primary-1"
                                        : "border-theme-stroke"
                                }`}
                            >
                                {selected && (
                                    <Icon
                                        className="w-3 h-3 fill-white"
                                        name="check"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="text-caption-2 text-theme-secondary">
                            {strategy.description}
                        </div>
                    </button>
                );
            })}

            {/* Show selected custom strategies */}
            {selectedStrategies
                .filter((s) => s.isCustom)
                .map((strategy) => (
                    <div
                        key={getStrategyId(strategy)}
                        className="p-4 rounded-xl border-2 border-primary-1 bg-primary-1/10 relative"
                    >
                        <button
                            onClick={() => onToggle(strategy)}
                            className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-lg bg-theme-red hover:bg-theme-red/80 transition-colors"
                        >
                            <Icon className="w-4 h-4 fill-white" name="close" />
                        </button>
                        <div className="text-base-2s text-theme-primary mb-2 pr-8">
                            {strategy.name}
                        </div>
                        <div className="text-caption-2 text-theme-secondary">
                            {strategy.customPrompt}
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default TechnicalStrategySelector;
