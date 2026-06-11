/// Shared event type definitions used by the indexer.
module movex::events {
    use std::string::String;

    struct PriceUpdated has drop, store {
        symbol: String,
        price: u64,
        timestamp: u64,
    }

    struct FundingSettled has drop, store {
        symbol: String,
        rate_bps: i64,
        timestamp: u64,
    }
}
