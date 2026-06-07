import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import CurrencyFormat from "@/components/CurrencyFormat";
import Image from "@/components/Image";
import Percent from "@/components/Percent";
import Modal from "@/components/Modal";
import SetAlert from "@/components/SetAlert";
import Switch from "@/components/Switch";
import Tooltip from "@/components/Tooltip";

import { chartBestToBuy } from "@/mocks/charts";

type BestToBuyProps = {};

const BestToBuy = ({}: BestToBuyProps) => {
    const router = useRouter();
    const [visibleModal, setVisibleModal] = useState(false);
    const [smartTradeEnabled, setSmartTradeEnabled] = useState(false);

    return (
        <>
            <Card
                className="card-sidebar"
                title="Best to buy"
                rightContent={
                    <button className="group w-9 h-9 border-2 border-theme-stroke rounded-xl text-0 transition-colors hover:bg-theme-stroke">
                        <Icon
                            className="!w-5 !h-5 fill-theme-secondary transition-colors group-hover:fill-theme-primary"
                            name="refresh"
                        />
                    </button>
                }
            >
                <div className="pt-6">
                    <CurrencyFormat
                        className="mb-3 text-h3"
                        value={3980.80} // TODO: Price Update ETH
                        currency="$"
                    />
                    <div className="flex items-center">
                        <div className="mr-2">
                            <Image
                                className="w-6"
                                src="/images/crypto-icon-gray-2.png"
                                width={24}
                                height={24}
                                alt=""
                            />
                        </div>
                        <div className="text-base-1s">
                            Ethereum{" "}
                            <span className="text-theme-tertiary">ETH</span>
                        </div>
                        <Percent className="ml-2 text-base-2" value={2.73} />
                    </div>
                    <div className="h-38 my-2 -mx-6 md:-mx-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                width={730}
                                height={250}
                                data={chartBestToBuy}
                                margin={{
                                    top: 0,
                                    right: 0,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="color"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#32AE60"
                                            stopOpacity={0.15}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#32AE60"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="linear"
                                    dataKey="price"
                                    stroke="#32AE60"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#color)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center mb-8 text-caption-1 text-theme-secondary md:mb-6">
                        <div className="mr-3">
                            <Image
                                className="w-6"
                                src="/images/logo-1.svg"
                                width={24}
                                height={24}
                                alt=""
                            />
                        </div>
                        Method: LSTM, Accuracy: 87%
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
                            <div className="flex items-center">
                                <Icon
                                    className="w-5 h-5 mr-2 fill-theme-secondary"
                                    name="eye"
                                />
                                <span className="text-base-1s text-theme-primary">
                                    Smart Trade
                                </span>
                                <Tooltip
                                    title={
                                        smartTradeEnabled
                                            ? "Trades will be placed autonomously without confirmation"
                                            : "You will need to confirm trades before they are placed"
                                    }
                                />
                            </div>
                            <Switch
                                value={smartTradeEnabled}
                                setValue={setSmartTradeEnabled}
                                small
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                className={`flex-1 px-2 ${
                                    smartTradeEnabled
                                        ? "btn-secondary"
                                        : "btn-gray"
                                }`}
                                onClick={() => router.push("/trade")}
                            >
                                Go to Trade
                            </button>
                            <button
                                className="btn-gray flex-1 px-2"
                                onClick={() => setVisibleModal(true)}
                            >
                                Set Alert
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
            <Modal
                classWrap="max-w-[28.5rem] rounded-3xl"
                showButtonClose
                visible={visibleModal}
                onClose={() => setVisibleModal(false)}
            >
                <>
                    <SetAlert />
                </>
            </Modal>
        </>
    );
};

export default BestToBuy;
