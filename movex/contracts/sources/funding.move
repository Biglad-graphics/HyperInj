/// Hourly funding rate engine.
/// Longs pay shorts when mark > index (bullish premium), and vice-versa.
/// Rate = (mark - index) / index * funding_factor / 24
module movex::funding {
    use std::string::String;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    use movex::market;

    const FUNDING_INTERVAL_SECS: u64 = 3600; // 1 hour
    /// Funding rate dampener: caps hourly funding at 0.0625% (6.25 bps)
    const MAX_FUNDING_RATE_BPS: u64 = 625; // per 8-hour period in bps * 1000

    struct FundingState has key {
        /// symbol → last settled timestamp
        last_settled: Table<String, u64>,
    }

    public entry fun initialize(admin: &signer) {
        use std::signer;
        move_to(admin, FundingState { last_settled: table::new() });
    }

    /// Settle funding for a market. Can be called by anyone (keeper bot).
    /// In production this updates the cumulative funding index on the Market struct
    /// and each position's funding_index_snapshot is used to compute accrued funding.
    public entry fun settle_funding(
        _keeper: &signer,
        _protocol_addr: address,
        _symbol: vector<u8>,
    ) acquires FundingState {
        let now = timestamp::now_seconds();
        // Keeper bots call this every hour per market.
        // Full implementation: compute funding_rate = clamp((mark - index) / index, max_rate)
        // then apply proportional payment between long OI and short OI.
        // Simplified skeleton — rate computation wired to Pyth index price in production.
        let _ = now;
    }

    /// Compute accrued funding for a position since it was opened.
    /// Returns signed amount in USDCx micro-units (positive = owed by position).
    public fun accrued_funding(
        _protocol_addr: address,
        _owner: address,
        _symbol: vector<u8>,
    ): i64 {
        // Full: (current_funding_index - snapshot) * position_size / PRICE_PRECISION
        0
    }
}
