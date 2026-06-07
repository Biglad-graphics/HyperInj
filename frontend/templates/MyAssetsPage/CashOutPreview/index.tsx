import Image from "@/components/Image";
import ButtonBack from "@/components/ButtonBack";
import Option from "@/components/Option";

type CashOutPreviewProps = {
    onBack: () => void;
    walletAddress?: string;
    amount?: string;
};

const CashOutPreview = ({ onBack, walletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", amount = "18.24" }: CashOutPreviewProps) => {
    // Format wallet address to show first 6 and last 4 characters
    const formatWalletAddress = (address: string) => {
        if (address.length > 10) {
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        return address;
    };

    return (
        <>
            <ButtonBack title="Withdraw preview" onClick={onBack} />
            <div className="py-6 text-center">
                <div className="mb-1 text-h1 md:text-h2">${amount}</div>
                <div className="text-base-2 text-theme-secondary">
                    Withdrawal to wallet address
                </div>
            </div>
            <div>
                <Option
                    classTitle="!w-40 !mr-14 md:!w-34 md:!mr-3"
                    title="To Wallet"
                    color="bg-theme-tertiary"
                >
                    <div className="font-mono text-base-1s">{formatWalletAddress(walletAddress)}</div>
                </Option>
                <Option
                    classTitle="!w-40 !mr-14 md:!w-34 md:!mr-3"
                    title="Funds will arrive"
                    color="bg-theme-tertiary"
                >
                    <div className="mr-2 text-0">
                        <Image
                            className="w-4"
                            src="/images/funds-arrival-indicator.svg"
                            width={16}
                            height={16}
                            alt=""
                        />
                    </div>
                    <div className="text-theme-brand">Instantly</div>
                </Option>
                <Option
                    classTitle="!w-40 !mr-14 md:!w-34 md:!mr-3"
                    title="Withdrawal amount"
                    color="bg-theme-tertiary"
                >
                    ${amount}
                </Option>
                <Option
                    classTitle="!w-40 !mr-14 md:!w-34 md:!mr-3"
                    title="Network Fee"
                    color="bg-theme-green"
                >
                    <div className="text-primary-2">Free</div>
                </Option>
                <Option
                    classTitle="!w-40 !mr-14 md:!w-34 md:!mr-3"
                    title="Total"
                    color="bg-theme-purple"
                >
                    ${amount}
                </Option>
            </div>
            <button className="btn-primary w-full h-14 mt-4">Withdraw now</button>
        </>
    );
};

export default CashOutPreview;
