import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Card from "@/components/Card";
import CurrencyFormat from "@/components/CurrencyFormat";
import Image from "@/components/Image";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import CashOut from "../CashOut";
import CashOutPreview from "../CashOutPreview";
import { getUserPositions } from "../../../services/hyperliquidPortfolio.service";

type SummaryProps = {};

const Summary = ({}: SummaryProps) => {
    const [preview, setPreview] = useState(false);
    const [visibleModal, setVisibleModal] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [accountValue, setAccountValue] = useState<number>(0);
    const [withdrawable, setWithdrawable] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const { authenticated, user } = usePrivy();

    useEffect(() => {
        const fetchPortfolioData = async () => {
            if (authenticated && user) {
                try {
                    setLoading(true);
                    // Get wallet address from Privy user
                    const wallet = user.linkedAccounts?.find(
                        (account) => account.type === "wallet"
                    );

                    if (wallet && "address" in wallet) {
                        const positions = await getUserPositions(wallet.address);
                        if (positions?.marginSummary?.accountValue) {
                            setAccountValue(parseFloat(positions.marginSummary.accountValue));
                        }
                        if (positions?.withdrawable) {
                            setWithdrawable(parseFloat(positions.withdrawable));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching portfolio data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchPortfolioData();
    }, [authenticated, user]);

    const items = [
        {
            title: "Available to trade",
            price: loading ? 0 : withdrawable,
            tooltip: "Total funds available for trading",
            image: "/images/currency-dollar.svg",
        },
        {
            title: "Available to withdraw",
            price: loading ? 0 : withdrawable,
            tooltip: "Total funds available for withdrawal",
            image: "/images/arrow-narrow-up-right.svg",
        },
    ];

    return (
        <>
            <Card className="card-sidebar" title="Summary">
                <div className="pt-6">
                    <CurrencyFormat
                        className="mb-4 text-h3"
                        value={loading ? 0 : accountValue}
                        currency="$"
                    />
                    <div className="mb-8 space-y-8">
                        {items.map((item, index) => (
                            <div className="flex items-center" key={index}>
                                <div
                                    className={`flex justify-center items-center w-12 h-12 mr-4 rounded-full ${
                                        index === 0
                                            ? "bg-theme-brand-100"
                                            : "bg-theme-green-100"
                                    }`}
                                >
                                    <Image
                                        className="w-6 opacity-100"
                                        src={item.image}
                                        width={24}
                                        height={24}
                                        alt=""
                                    />
                                </div>
                                <div className="grow">
                                    <CurrencyFormat
                                        className="text-title-1s"
                                        value={item.price}
                                        currency="$"
                                        sameColor
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="text-base-2 text-theme-secondary">
                                            {item.title}
                                        </div>
                                        <Tooltip title={item.tooltip} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn-gray w-full"
                        onClick={() => setVisibleModal(true)}
                    >
                        Withdraw
                    </button>
                </div>
            </Card>
            <Modal
                classWrap="md:!p-4"
                visible={visibleModal}
                onClose={() => setVisibleModal(false)}
            >
                {preview ? (
                    <CashOutPreview
                        onBack={() => setPreview(false)}
                        walletAddress={walletAddress}
                        amount={withdrawAmount}
                    />
                ) : (
                    <CashOut
                        onClose={() => setVisibleModal(false)}
                        onContinue={(address, amount) => {
                            setWalletAddress(address);
                            setWithdrawAmount(amount);
                            setPreview(true);
                        }}
                    />
                )}
            </Modal>
        </>
    );
};

export default Summary;
