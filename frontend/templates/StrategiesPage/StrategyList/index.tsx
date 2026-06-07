"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { Strategy } from "@/types/strategy";

type StrategyListProps = {
    strategies: any[];
    onViewStrategy: (strategyId: string) => void;
    onDeleteStrategy?: (strategyId: string) => void;
};

const StrategyList = ({ strategies, onViewStrategy, onDeleteStrategy }: StrategyListProps) => {
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
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

    const handleDeleteClick = (e: React.MouseEvent, strategyId: string) => {
        e.stopPropagation();
        setStrategyToDelete(strategyId);
        setDeleteModalVisible(true);
    };

    const handleConfirmDelete = () => {
        if (strategyToDelete && onDeleteStrategy) {
            onDeleteStrategy(strategyToDelete);
        }
        setDeleteModalVisible(false);
        setStrategyToDelete(null);
    };

    const handleCancelDelete = () => {
        setDeleteModalVisible(false);
        setStrategyToDelete(null);
    };

    return (
        <>
            <div className="space-y-4">
                {strategies.map((strategy) => (
                    <div
                        key={strategy._id}
                        className="p-6 bg-theme-on-surface-1 rounded-2xl border border-theme-stroke hover:border-primary-1 transition-all cursor-pointer group"
                        onClick={() => onViewStrategy(strategy._id)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-title-1 text-theme-primary group-hover:text-primary-1 transition-colors">
                                        {strategy.name}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 rounded-lg text-caption-2 font-semibold uppercase ${getStatusColor(
                                            strategy.status || "active"
                                        )}`}
                                    >
                                        {strategy.status || "active"}
                                    </span>
                                    {strategy.visibility === "public" && (
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-theme-on-surface-2 text-caption-2 text-theme-secondary">
                                            <Icon className="w-3 h-3 fill-theme-secondary" name="eye" />
                                            Public
                                        </span>
                                    )}
                                </div>
                                <p className="text-base-2 text-theme-secondary mb-3">
                                    {strategy.description}
                                </p>
                                <div className="flex items-center gap-4 text-caption-1 text-theme-tertiary">
                                    <span>
                                        Risk:{" "}
                                        <span className={`font-semibold ${getRiskColor(strategy.risk?.toLowerCase() || "medium")}`}>
                                            {(strategy.risk || "Medium").toUpperCase()}
                                        </span>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Created: {new Date(strategy.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleDeleteClick(e, strategy._id)}
                                    className="p-2 rounded-lg hover:bg-theme-red/10 transition-colors group/delete"
                                    title="Delete strategy"
                                >
                                    <Icon
                                        className="w-5 h-5 fill-theme-tertiary group-hover/delete:fill-theme-red transition-colors"
                                        name="close"
                                    />
                                </button>
                                <Icon
                                    className="w-5 h-5 fill-theme-tertiary group-hover:fill-primary-1 transition-colors"
                                    name="arrow-next"
                                />
                            </div>
                        </div>

                    <div className="grid grid-cols-5 gap-4 pt-4 border-t border-theme-stroke md:grid-cols-2">
                        <div>
                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                Total P&L
                            </div>
                            <div className="text-title-2 font-semibold text-primary-2">
                                +$0.00
                                <span className="text-caption-1 ml-1">
                                    (+0.00%)
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                Win Rate
                            </div>
                            <div className="text-title-2 font-semibold text-theme-primary">
                                0.0%
                            </div>
                        </div>
                        <div>
                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                Accuracy
                            </div>
                            <div className="text-title-2 font-semibold text-theme-primary">
                                0.0%
                            </div>
                        </div>
                        <div>
                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                Open Positions
                            </div>
                            <div className="text-title-2 font-semibold text-theme-primary">
                                0
                            </div>
                        </div>
                        <div>
                            <div className="text-caption-2 text-theme-tertiary mb-1">
                                Total Trades
                            </div>
                            <div className="text-title-2 font-semibold text-theme-primary">
                                0
                            </div>
                        </div>
                    </div>

                    {strategy.agentConfigs && strategy.agentConfigs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-theme-stroke">
                            <div className="text-caption-2 text-theme-tertiary mb-2">
                                AI Agents:
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {strategy.agentConfigs.map((agent: any) => (
                                    <span
                                        key={agent._id}
                                        className="px-3 py-1 rounded-lg bg-theme-on-surface-2 text-caption-1 text-theme-secondary"
                                    >
                                        {agent.agentId?.name || "Agent"} ({(agent.votingPower * 100).toFixed(0)}%)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>

        <Modal
            visible={deleteModalVisible}
            onClose={handleCancelDelete}
            classWrap="max-w-md"
        >
            <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mb-6 mx-auto rounded-2xl bg-theme-red/10">
                    <Icon className="w-8 h-8 fill-theme-red" name="close-circle" />
                </div>
                <h3 className="text-h6 text-theme-primary text-center mb-3">
                    Delete Strategy?
                </h3>
                <p className="text-base-2 text-theme-secondary text-center mb-6">
                    Are you sure you want to delete this strategy? This action cannot be undone and all associated data will be permanently removed.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleCancelDelete}
                        className="btn-gray flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        className="flex-1 px-6 py-3 bg-theme-red text-white rounded-xl hover:bg-theme-red/90 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    </>
    );
};

export default StrategyList;
