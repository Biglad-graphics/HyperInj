"use client";

import { AgenticDecision } from "@/types/strategy";
import Icon from "@/components/Icon";

type AgenticDecisionsProps = {
    decisions: AgenticDecision[];
};

const AgenticDecisions = ({ decisions }: AgenticDecisionsProps) => {
    const getOutcomeColor = (outcome: string) => {
        switch (outcome) {
            case "positive":
                return "text-primary-2 bg-primary-2/10";
            case "negative":
                return "text-theme-red bg-theme-red/10";
            case "neutral":
                return "text-theme-tertiary bg-theme-on-surface-2";
            default:
                return "text-theme-tertiary bg-theme-on-surface-2";
        }
    };

    const getOutcomeIcon = (outcome: string) => {
        switch (outcome) {
            case "positive":
                return "arrow-up";
            case "negative":
                return "arrow-down";
            case "neutral":
                return "minus";
            default:
                return "minus";
        }
    };

    return (
        <div className="space-y-4">
            {decisions.map((decision) => (
                <div
                    key={decision.id}
                    className="p-5 bg-theme-on-surface-1 rounded-xl border border-theme-stroke"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className={`px-3 py-1 rounded-lg text-caption-2 font-semibold uppercase flex items-center gap-1 ${getOutcomeColor(
                                        decision.outcome
                                    )}`}
                                >
                                    <Icon
                                        className="w-3 h-3 fill-current"
                                        name={getOutcomeIcon(decision.outcome)}
                                    />
                                    {decision.outcome}
                                </span>
                                <span className="text-caption-2 text-theme-tertiary">
                                    {new Date(decision.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="text-base-2 text-theme-primary font-semibold mb-2">
                                {decision.decision}
                            </div>
                            <div className="text-base-2 text-theme-secondary">
                                {decision.reasoning}
                            </div>
                        </div>
                        <div className="ml-4 text-right">
                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                Impact
                            </div>
                            <div
                                className={`text-title-2 font-semibold ${
                                    decision.impactPnl >= 0
                                        ? "text-primary-2"
                                        : "text-theme-red"
                                }`}
                            >
                                {decision.impactPnl >= 0 ? "+" : ""}$
                                {decision.impactPnl.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgenticDecisions;
