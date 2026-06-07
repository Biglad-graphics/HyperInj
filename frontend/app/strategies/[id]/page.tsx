"use client";

import { useParams } from "next/navigation";
import StrategyDetailPage from "@/templates/StrategyDetailPage";

const StrategyDetail = () => {
    const params = useParams();
    const strategyId = params.id as string;

    return <StrategyDetailPage strategyId={strategyId} />;
};

export default StrategyDetail;
