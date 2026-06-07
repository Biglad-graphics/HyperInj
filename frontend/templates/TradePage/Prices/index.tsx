import TradeHistory from "@/components/TradeHistory";

type PricesProps = {};

const Prices = ({}: PricesProps) => {
    return (
        <div>
            <div className="mb-6 text-title-1s md:mb-4 md:text-[1.125rem]">
                Trade History
            </div>
            <div className="mt-1">
                <TradeHistory />
            </div>
        </div>
    );
};

export default Prices;
