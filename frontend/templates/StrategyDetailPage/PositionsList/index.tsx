"use client";

import { Position } from "@/types/strategy";
import Icon from "@/components/Icon";

type PositionsListProps = {
    positions: Position[];
};

const PositionsList = ({ positions }: PositionsListProps) => {
    return (
        <div className="space-y-3">
            {positions.map((position) => (
                <div
                    key={position.id}
                    className="p-4 bg-theme-on-surface-1 rounded-xl border border-theme-stroke hover:border-primary-1 transition-colors"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-title-2 text-theme-primary">
                                {position.asset}
                            </div>
                            <span
                                className={`px-2 py-1 rounded text-caption-2 font-semibold uppercase ${
                                    position.type === "long"
                                        ? "bg-primary-2/10 text-primary-2"
                                        : "bg-theme-red/10 text-theme-red"
                                }`}
                            >
                                {position.type}
                            </span>
                        </div>
                        <div className="text-right">
                            <div
                                className={`text-title-2 font-semibold ${
                                    position.pnl >= 0 ? "text-primary-2" : "text-theme-red"
                                }`}
                            >
                                {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)}
                            </div>
                            <div
                                className={`text-caption-1 ${
                                    position.pnlPercentage >= 0
                                        ? "text-primary-2"
                                        : "text-theme-red"
                                }`}
                            >
                                {position.pnlPercentage >= 0 ? "+" : ""}
                                {position.pnlPercentage.toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-caption-1 md:grid-cols-2">
                        <div>
                            <div className="text-theme-tertiary mb-1">Entry Price</div>
                            <div className="text-theme-primary font-semibold">
                                ${position.entryPrice.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-theme-tertiary mb-1">Current Price</div>
                            <div className="text-theme-primary font-semibold">
                                ${position.currentPrice.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-theme-tertiary mb-1">Amount</div>
                            <div className="text-theme-primary font-semibold">
                                {position.amount}
                            </div>
                        </div>
                        <div>
                            <div className="text-theme-tertiary mb-1">
                                {position.closedAt ? "Closed" : "Opened"}
                            </div>
                            <div className="text-theme-primary font-semibold">
                                {new Date(
                                    position.closedAt || position.openedAt
                                ).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PositionsList;
