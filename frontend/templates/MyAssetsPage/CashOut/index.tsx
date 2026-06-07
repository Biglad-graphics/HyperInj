import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import Icon from "@/components/Icon";
import ButtonBack from "@/components/ButtonBack";
import Field from "@/components/Field";

type CashOutProps = {
    onClose: () => void;
    onContinue: (walletAddress: string, amount: string) => void;
};

const CashOut = ({ onClose, onContinue }: CashOutProps) => {
    const [walletAddress, setWalletAddress] = useState("");
    const [amount, setAmount] = useState("");

    const handleContinue = () => {
        if (walletAddress && amount) {
            onContinue(walletAddress, amount);
        }
    };

    return (
        <div className="">
            <ButtonBack title="Withdraw" onClick={onClose} />
            <CurrencyInput
                className="input-caret-color w-full h-40 mb-1 bg-transparent text-center text-h1 outline-none placeholder:text-theme-primary md:h-30 md:text-h2"
                name="price"
                prefix="$"
                placeholder="$0.00"
                decimalsLimit={2}
                decimalSeparator="."
                groupSeparator=","
                onValueChange={(value) => setAmount(value || "")}
                data-autofocus
            />
            <div className="mb-6">
                <div className="mb-2 text-caption-2m text-theme-secondary">
                    Wallet Address
                </div>
                <Field
                    className="w-full"
                    placeholder="Enter your wallet address (0x...)"
                    value={walletAddress}
                    onChange={(e: any) => setWalletAddress(e.target.value)}
                    icon="wallet"
                />
            </div>
            <button
                className="btn-primary w-full h-14 mb-4"
                onClick={handleContinue}
                disabled={!walletAddress || !amount}
            >
                Continue
            </button>
            <div className="p-4 rounded-xl border border-theme-stroke bg-theme-on-surface text-caption-1 text-theme-secondary">
                Please ensure your wallet address is correct. Funds sent to an
                incorrect address cannot be recovered. Withdrawals are processed
                instantly to your specified wallet.
            </div>
        </div>
    );
};

export default CashOut;
