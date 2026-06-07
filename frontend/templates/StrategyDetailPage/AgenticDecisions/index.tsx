"use client";

import Icon from "@/components/Icon";

type AgenticDecision = {
    agent_name?: string;
    reasoning?: string;
    task?: string;
    step?: number;
    // legacy fields
    id?: string | number;
    outcome?: string;
    timestamp?: string | number;
    decision?: string;
    impactPnl?: number;
};

type AgenticMessage = {
    decisions?: AgenticDecision[];
    final_output?: string;
    trace?: string[];
};

type AgenticDecisionsProps = {
    decisions?: any[];
    liveMessages?: any[];
};

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
        default:
            return "minus";
    }
};

const AgenticDecisions = ({ decisions, liveMessages }: AgenticDecisionsProps) => {
    const hasLive = liveMessages && liveMessages.length > 0;

    if (hasLive) {
        return (
            <div className="space-y-4">
                {liveMessages!.map((msg: AgenticMessage, msgIdx: number) => (
                    <div
                        key={msgIdx}
                        className="p-5 bg-theme-on-surface-1 rounded-xl border border-theme-stroke"
                    >
                        {msg.final_output && (
                            <div className="text-base-2 text-theme-primary font-semibold mb-3">
                                {msg.final_output}
                            </div>
                        )}
                        {msg.decisions && msg.decisions.length > 0 && (
                            <div className="space-y-2">
                                {msg.decisions.map((d: AgenticDecision, dIdx: number) => (
                                    <div
                                        key={dIdx}
                                        className="flex items-start gap-3 p-3 bg-theme-on-surface-2 rounded-lg"
                                    >
                                        <span className="text-caption-2 font-semibold text-theme-tertiary min-w-[2rem]">
                                            #{d.step ?? dIdx + 1}
                                        </span>
                                        <div className="flex-1">
                                            {d.agent_name && (
                                                <div className="text-caption-2 font-semibold text-primary-2 mb-1 uppercase">
                                                    {d.agent_name}
                                                </div>
                                            )}
                                            {d.task && (
                                                <div className="text-base-2 text-theme-primary mb-1">
                                                    {d.task}
                                                </div>
                                            )}
                                            {d.reasoning && (
                                                <div className="text-caption-1 text-theme-secondary">
                                                    {d.reasoning}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // Fallback: static decisions prop (legacy shape)
    if (!decisions || decisions.length === 0) {
        return (
            <div className="text-base-2 text-theme-secondary p-4">
                No decisions yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {decisions.map((decision: AgenticDecision, idx: number) => (
                <div
                    key={decision.id ?? idx}
                    className="p-5 bg-theme-on-surface-1 rounded-xl border border-theme-stroke"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {decision.outcome && (
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
                                )}
                                {decision.timestamp && (
                                    <span className="text-caption-2 text-theme-tertiary">
                                        {new Date(decision.timestamp).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            {decision.decision && (
                                <div className="text-base-2 text-theme-primary font-semibold mb-2">
                                    {decision.decision}
                                </div>
                            )}
                            {decision.reasoning && (
                                <div className="text-base-2 text-theme-secondary">
                                    {decision.reasoning}
                                </div>
                            )}
                        </div>
                        {decision.impactPnl !== undefined && (
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
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgenticDecisions;
