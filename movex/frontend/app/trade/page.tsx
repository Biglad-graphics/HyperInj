'use client';

import { useState } from 'react';
import TradingPanel from '@/components/trade/TradingPanel';
import OrderBook from '@/components/trade/OrderBook';
import PositionsTable from '@/components/trade/PositionsTable';
import MarketSelector from '@/components/trade/MarketSelector';

export default function TradePage() {
  const [selectedMarket, setSelectedMarket] = useState('BTC/USD-PERP');

  return (
    <div className="flex flex-col gap-4">
      <MarketSelector selected={selectedMarket} onChange={setSelectedMarket} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Chart + order panel */}
        <div className="flex flex-col gap-4">
          {/* Price chart placeholder — swap in lightweight-charts component */}
          <div className="bg-surface-card border border-surface-border rounded-xl h-80 flex items-center justify-center text-gray-500">
            Price Chart — {selectedMarket}
          </div>
          <PositionsTable />
        </div>

        {/* Trading panel */}
        <TradingPanel market={selectedMarket} />
      </div>
    </div>
  );
}
