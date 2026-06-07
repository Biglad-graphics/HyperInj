import Card from "@/components/Card";
import TradeHistory from "@/components/TradeHistory";

type AllAssetsProps = {};

const AllAssets = ({}: AllAssetsProps) => {
    return (
        <Card className="grow" title="Trade History" tooltip="Recent trade history from Injective">
            <TradeHistory />
        </Card>
    );
};

export default AllAssets;
