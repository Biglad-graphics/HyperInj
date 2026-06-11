/// Perpetual futures market — open/close long & short positions.
/// Mark price is sourced from Pyth oracle. USDCx is the sole collateral.
module movex::market {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    use movex::vault;

    // ── Constants ─────────────────────────────────────────────────────────────

    /// Leverage cap: 20x (stored as basis points, 1x = 10_000)
    const MAX_LEVERAGE_BPS: u64 = 200_000;
    /// Maintenance margin ratio: 2.5% (250 bps)
    const MAINTENANCE_MARGIN_BPS: u64 = 250;
    /// Taker fee: 0.05% (5 bps)
    const TAKER_FEE_BPS: u64 = 5;
    /// Maker fee: 0.02% (2 bps)
    const MAKER_FEE_BPS: u64 = 2;
    /// Price precision: 1e8
    const PRICE_PRECISION: u64 = 100_000_000;
    /// USDCx precision: 1e6
    const COLLATERAL_PRECISION: u64 = 1_000_000;

    // ── Errors ────────────────────────────────────────────────────────────────

    const E_MARKET_NOT_FOUND: u64    = 100;
    const E_MARKET_PAUSED: u64       = 101;
    const E_LEVERAGE_TOO_HIGH: u64   = 102;
    const E_INSUFFICIENT_MARGIN: u64 = 103;
    const E_POSITION_NOT_FOUND: u64  = 104;
    const E_ALREADY_HAS_POSITION: u64 = 105;
    const E_ZERO_SIZE: u64           = 106;
    const E_NOT_LIQUIDATABLE: u64    = 107;
    const E_NOT_AUTHORIZED: u64      = 108;

    // ── Structs ───────────────────────────────────────────────────────────────

    /// A single perp market (e.g. BTC-PERP).
    struct Market has store {
        symbol: String,
        /// Current mark price (1e8 precision).
        mark_price: u64,
        /// Total open interest long (in notional USDCx, 1e6).
        oi_long: u64,
        /// Total open interest short.
        oi_short: u64,
        /// Paused flag — halts new opens on circuit breaker.
        paused: bool,
        /// Cumulative funding index (signed, 1e12 precision).
        funding_index: i128,
        last_funding_ts: u64,
    }

    /// Global state — one per protocol deployment.
    struct MarketState has key {
        markets: Table<String, Market>,
        /// Next position ID counter.
        next_position_id: u64,
        protocol_addr: address,
        open_events: event::EventHandle<PositionOpenedEvent>,
        close_events: event::EventHandle<PositionClosedEvent>,
        liquidate_events: event::EventHandle<LiquidatedEvent>,
    }

    /// A user's open position.
    struct Position has key, store {
        id: u64,
        owner: address,
        symbol: String,
        /// true = long, false = short.
        is_long: bool,
        /// Position size in notional USDCx (1e6).
        size: u64,
        /// Collateral (margin) locked in vault.
        margin: u64,
        /// Entry price (1e8).
        entry_price: u64,
        /// Funding index snapshot at open time.
        funding_index_snapshot: i128,
        opened_at: u64,
    }

    /// Map owner → position_id (one position per market per user for simplicity).
    struct UserPositions has key {
        /// symbol → position_id
        positions: Table<String, u64>,
    }

    /// Global position store: position_id → Position.
    struct PositionStore has key {
        positions: Table<u64, Position>,
    }

    // ── Events ────────────────────────────────────────────────────────────────

    struct PositionOpenedEvent has drop, store {
        id: u64,
        owner: address,
        symbol: String,
        is_long: bool,
        size: u64,
        margin: u64,
        entry_price: u64,
    }

    struct PositionClosedEvent has drop, store {
        id: u64,
        owner: address,
        symbol: String,
        pnl: i64,
        exit_price: u64,
    }

    struct LiquidatedEvent has drop, store {
        id: u64,
        owner: address,
        symbol: String,
        liquidator: address,
        mark_price: u64,
    }

    // ── Initialisation ────────────────────────────────────────────────────────

    public entry fun initialize(admin: &signer) {
        let addr = signer::address_of(admin);
        move_to(admin, MarketState {
            markets: table::new(),
            next_position_id: 1,
            protocol_addr: addr,
            open_events: account::new_event_handle<PositionOpenedEvent>(admin),
            close_events: account::new_event_handle<PositionClosedEvent>(admin),
            liquidate_events: account::new_event_handle<LiquidatedEvent>(admin),
        });
        move_to(admin, PositionStore { positions: table::new() });
    }

    /// Add a new market (admin only).
    public entry fun add_market(
        admin: &signer,
        symbol: vector<u8>,
        initial_price: u64,
    ) acquires MarketState {
        let addr = signer::address_of(admin);
        let state = borrow_global_mut<MarketState>(addr);
        let sym = string::utf8(symbol);
        table::add(&mut state.markets, sym, Market {
            symbol: string::utf8(symbol),
            mark_price: initial_price,
            oi_long: 0,
            oi_short: 0,
            paused: false,
            funding_index: 0,
            last_funding_ts: timestamp::now_seconds(),
        });
    }

    /// Update mark price (called by oracle keeper).
    public entry fun update_mark_price(
        keeper: &signer,
        protocol_addr: address,
        symbol: vector<u8>,
        price: u64,
    ) acquires MarketState {
        // In production: verify keeper is authorised oracle updater
        let _ = signer::address_of(keeper);
        let state = borrow_global_mut<MarketState>(protocol_addr);
        let sym = string::utf8(symbol);
        assert!(table::contains(&state.markets, sym), E_MARKET_NOT_FOUND);
        let market = table::borrow_mut(&mut state.markets, sym);
        market.mark_price = price;
    }

    // ── Trading ───────────────────────────────────────────────────────────────

    /// Open a new position.
    /// `size_usd` — notional in USDCx micro-units (1e6).
    /// `margin`   — collateral to lock (must be >= size_usd / max_leverage).
    public entry fun open_position(
        user: &signer,
        protocol_addr: address,
        symbol: vector<u8>,
        is_long: bool,
        size_usd: u64,
        margin: u64,
    ) acquires MarketState, PositionStore, UserPositions {
        assert!(size_usd > 0, E_ZERO_SIZE);
        let user_addr = signer::address_of(user);
        let sym = string::utf8(symbol);

        let state = borrow_global_mut<MarketState>(protocol_addr);
        assert!(table::contains(&state.markets, sym), E_MARKET_NOT_FOUND);
        let market = table::borrow_mut(&mut state.markets, sym);
        assert!(!market.paused, E_MARKET_PAUSED);

        // Leverage check: size / margin <= MAX_LEVERAGE_BPS / 10_000
        let leverage_bps = (size_usd * 10_000) / margin;
        assert!(leverage_bps <= MAX_LEVERAGE_BPS, E_LEVERAGE_TOO_HIGH);

        // Ensure user has enough free collateral
        let free = vault::free_collateral(user_addr);
        assert!(free >= margin, E_INSUFFICIENT_MARGIN);

        // Prevent duplicate open positions per market
        if (!exists<UserPositions>(user_addr)) {
            move_to(user, UserPositions { positions: table::new() });
        };
        let user_pos = borrow_global_mut<UserPositions>(user_addr);
        assert!(!table::contains(&user_pos.positions, sym), E_ALREADY_HAS_POSITION);

        // Lock collateral
        vault::lock_collateral(protocol_addr, protocol_addr, user_addr, margin);

        // Deduct taker fee from margin
        let fee = (size_usd * TAKER_FEE_BPS) / 10_000;
        // fee goes to protocol — tracked via vault.settle_pnl in production

        let pos_id = state.next_position_id;
        state.next_position_id = pos_id + 1;

        // Update OI
        if (is_long) { market.oi_long = market.oi_long + size_usd }
        else { market.oi_short = market.oi_short + size_usd };

        let entry_price = market.mark_price;
        let funding_index_snapshot = market.funding_index;

        // Store position
        let pos_store = borrow_global_mut<PositionStore>(protocol_addr);
        table::add(&mut pos_store.positions, pos_id, Position {
            id: pos_id,
            owner: user_addr,
            symbol: sym,
            is_long,
            size: size_usd,
            margin,
            entry_price,
            funding_index_snapshot,
            opened_at: timestamp::now_seconds(),
        });

        table::add(&mut user_pos.positions, sym, pos_id);

        event::emit_event(&mut state.open_events, PositionOpenedEvent {
            id: pos_id,
            owner: user_addr,
            symbol: sym,
            is_long,
            size: size_usd,
            margin,
            entry_price,
        });
    }

    /// Close an open position and settle PnL.
    public entry fun close_position(
        user: &signer,
        protocol_addr: address,
        symbol: vector<u8>,
    ) acquires MarketState, PositionStore, UserPositions {
        let user_addr = signer::address_of(user);
        let sym = string::utf8(symbol);

        let user_pos = borrow_global_mut<UserPositions>(user_addr);
        assert!(table::contains(&user_pos.positions, sym), E_POSITION_NOT_FOUND);
        let pos_id = *table::borrow(&user_pos.positions, sym);
        table::remove(&mut user_pos.positions, sym);

        let state = borrow_global_mut<MarketState>(protocol_addr);
        let market = table::borrow_mut(&mut state.markets, sym);
        let exit_price = market.mark_price;

        let pos_store = borrow_global_mut<PositionStore>(protocol_addr);
        let pos = table::remove(&mut pos_store.positions, pos_id);

        // Calculate PnL
        let pnl = compute_pnl(&pos, exit_price);

        // Update OI
        if (pos.is_long) { market.oi_long = market.oi_long - pos.size }
        else { market.oi_short = market.oi_short - pos.size };

        // Unlock margin and settle PnL
        vault::unlock_collateral(protocol_addr, protocol_addr, user_addr, pos.margin);
        vault::settle_pnl(protocol_addr, protocol_addr, user_addr, pnl);

        event::emit_event(&mut state.close_events, PositionClosedEvent {
            id: pos.id,
            owner: user_addr,
            symbol: sym,
            pnl,
            exit_price,
        });
    }

    /// Liquidate an undercollateralised position.
    public entry fun liquidate(
        liquidator: &signer,
        protocol_addr: address,
        owner: address,
        symbol: vector<u8>,
    ) acquires MarketState, PositionStore, UserPositions {
        let liq_addr = signer::address_of(liquidator);
        let sym = string::utf8(symbol);

        let user_pos = borrow_global_mut<UserPositions>(owner);
        assert!(table::contains(&user_pos.positions, sym), E_POSITION_NOT_FOUND);
        let pos_id = *table::borrow(&user_pos.positions, sym);

        let state = borrow_global_mut<MarketState>(protocol_addr);
        let market = table::borrow_mut(&mut state.markets, sym);
        let mark_price = market.mark_price;

        let pos_store = borrow_global_mut<PositionStore>(protocol_addr);
        let pos = table::borrow(&pos_store.positions, pos_id);

        // Check position is actually liquidatable
        assert!(is_liquidatable(pos, mark_price), E_NOT_LIQUIDATABLE);

        // Remove position
        table::remove(&mut user_pos.positions, sym);
        let pos = table::remove(&mut pos_store.positions, pos_id);

        if (pos.is_long) { market.oi_long = market.oi_long - pos.size }
        else { market.oi_short = market.oi_short - pos.size };

        // Unlock remaining margin — any surplus goes to protocol, loss is absorbed
        vault::unlock_collateral(protocol_addr, protocol_addr, owner, pos.margin);
        // Deduct full margin as loss (seized by protocol)
        vault::settle_pnl(protocol_addr, protocol_addr, owner, -(pos.margin as i64));

        event::emit_event(&mut state.liquidate_events, LiquidatedEvent {
            id: pos.id,
            owner,
            symbol: sym,
            liquidator: liq_addr,
            mark_price,
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    fun compute_pnl(pos: &Position, exit_price: u64): i64 {
        if (pos.is_long) {
            let delta = (exit_price as i64) - (pos.entry_price as i64);
            (delta * (pos.size as i64)) / (pos.entry_price as i64)
        } else {
            let delta = (pos.entry_price as i64) - (exit_price as i64);
            (delta * (pos.size as i64)) / (pos.entry_price as i64)
        }
    }

    fun is_liquidatable(pos: &Position, mark_price: u64): bool {
        let pnl = compute_pnl(pos, mark_price);
        if (pnl >= 0) return false;
        let loss = (-pnl as u64);
        // Liquidate when loss >= (margin - maintenance_margin)
        let maintenance = (pos.margin * MAINTENANCE_MARGIN_BPS) / 10_000;
        loss >= (pos.margin - maintenance)
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    #[view]
    public fun get_mark_price(protocol_addr: address, symbol: vector<u8>): u64 acquires MarketState {
        let state = borrow_global<MarketState>(protocol_addr);
        let sym = string::utf8(symbol);
        table::borrow(&state.markets, sym).mark_price
    }

    #[view]
    public fun get_position_id(owner: address, symbol: vector<u8>): u64 acquires UserPositions {
        let sym = string::utf8(symbol);
        assert!(exists<UserPositions>(owner), E_POSITION_NOT_FOUND);
        let user_pos = borrow_global<UserPositions>(owner);
        *table::borrow(&user_pos.positions, sym)
    }
}
