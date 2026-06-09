"use client";

import Layout from "@/components/Layout";
import TotalBalance from "./TotalBalance";
import InjectiveInsight from "./BestToBuy";
import BehaviorActivityPanel from "./BehaviorActivity";

const MyAssetsPage = () => {
    return (
        <Layout title="Dashboard">
            <div className="space-y-2">
                <div className="flex lg:block">
                    <TotalBalance />
                    <InjectiveInsight />
                </div>
                <div className="flex lg:block">
                    <BehaviorActivityPanel />
                </div>
            </div>
        </Layout>
    );
};

export default MyAssetsPage;
