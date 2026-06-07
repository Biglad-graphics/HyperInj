"use client";

import { Strategy } from "@/types/strategy";
import Icon from "@/components/Icon";

type PerformanceMetricsProps = {
    strategy: Strategy;
};

const PerformanceMetrics = ({ strategy }: PerformanceMetricsProps) => {
    return (
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-theme-stroke md:grid-cols-2">
            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-caption-2 text-theme-tertiary">Total P&L</span>
                    <Icon
                        className={`w-4 h-4 ${
                            strategy.totalPnl >= 0 ? "fill-primary-2" : "fill-theme-red"
                        }`}
                        name={strategy.totalPnl >= 0 ? "arrow-up" : "arrow-down"}
                    />
                </div>
                <div
                    className={`text-h5 font-semibold mb-1 ${
                        strategy.totalPnl >= 0 ? "text-primary-2" : "text-theme-red"
                    }`}
                >
                    {/* {strategy.totalPnl >= 0 ? "+" : ""}${strategy.totalPnl.toFixed(2) || 0} */}
                    {strategy.totalPnl >= 0 ? "+" : ""}${0}
                </div>
                <div
                    className={`text-caption-1 ${
                        strategy.totalPnlPercentage >= 0 ? "text-primary-2" : "text-theme-red"
                    }`}
                >
                    {strategy.totalPnlPercentage >= 0 ? "+" : ""}
                    {/* {strategy.totalPnlPercentage.toFixed(2)}% */}
                    {0}%
                </div>
            </div>

            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                <div className="text-caption-2 text-theme-tertiary mb-2">Win Rate</div>
                <div className="text-h5 font-semibold text-theme-primary mb-1">
                    {/* {strategy.winRate.toFixed(1)}% */}
                    {0}%
                </div>
                <div className="text-caption-1 text-theme-secondary">
                    {strategy.winningTrades} / {strategy.totalTrades} trades
                </div>
            </div>

            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                <div className="text-caption-2 text-theme-tertiary mb-2">Accuracy</div>
                <div className="text-h5 font-semibold text-theme-primary mb-1">
                    {/* {strategy.accuracy.toFixed(1)}% */}
                    {0}%
                </div>
                <div className="text-caption-1 text-theme-secondary">
                    AI prediction accuracy
                </div>
            </div>

            <div className="p-4 bg-theme-on-surface-1 rounded-xl">
                <div className="text-caption-2 text-theme-tertiary mb-2">
                    Open Positions
                </div>
                <div className="text-h5 font-semibold text-theme-primary mb-1">
                    {/* {strategy.openPositions.length} */}
                    {0}
                </div>
                <div className="text-caption-1 text-theme-secondary">
                    {/* {strategy.closedPositions.length} closed */}
                    {0} closed
                </div>
            </div>
        </div>
    );
};

export default PerformanceMetrics;
