/// Collateral vault — users deposit USDCx, earn margin for perp trading.
/// Each user has one Vault resource holding their free + locked collateral.
module movex::vault {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    // ── Errors ────────────────────────────────────────────────────────────────

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_INSUFFICIENT_FREE_COLLATERAL: u64 = 4;
    const E_NOT_AUTHORIZED: u64 = 5;
    const E_ZERO_AMOUNT: u64 = 6;

    // ── Coin type phantom ─────────────────────────────────────────────────────

    /// Phantom type for USDCx — the native Circle stablecoin on Movement.
    struct USDCx {}

    // ── Resources ─────────────────────────────────────────────────────────────

    /// Global protocol state stored at the deployer address.
    struct VaultState has key {
        /// Total USDCx deposited across all users.
        total_deposits: u64,
        /// Protocol fee accumulated (in USDCx micro-units, 6 decimals).
        protocol_fees: u64,
        /// Addresses authorised to lock/unlock collateral (e.g. market module).
        authorized_callers: vector<address>,
        deposit_events: event::EventHandle<DepositEvent>,
        withdraw_events: event::EventHandle<WithdrawEvent>,
    }

    /// Per-user collateral account.
    struct UserVault has key {
        /// Total deposited (free + locked).
        total: u64,
        /// Locked by open positions — cannot be withdrawn.
        locked: u64,
    }

    // ── Events ────────────────────────────────────────────────────────────────

    struct DepositEvent has drop, store {
        user: address,
        amount: u64,
    }

    struct WithdrawEvent has drop, store {
        user: address,
        amount: u64,
    }

    // ── Initialisation ────────────────────────────────────────────────────────

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<VaultState>(admin_addr), E_ALREADY_INITIALIZED);

        move_to(admin, VaultState {
            total_deposits: 0,
            protocol_fees: 0,
            authorized_callers: vector[admin_addr],
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            withdraw_events: account::new_event_handle<WithdrawEvent>(admin),
        });
    }

    // ── User-facing ───────────────────────────────────────────────────────────

    /// Deposit USDCx into the vault.
    public entry fun deposit<CoinType>(
        user: &signer,
        protocol_addr: address,
        amount: u64,
    ) acquires VaultState, UserVault {
        assert!(amount > 0, E_ZERO_AMOUNT);
        let user_addr = signer::address_of(user);

        // Pull coin from user wallet → protocol escrow
        let deposited = coin::withdraw<CoinType>(user, amount);
        coin::deposit<CoinType>(protocol_addr, deposited);

        // Create vault if first deposit
        if (!exists<UserVault>(user_addr)) {
            move_to(user, UserVault { total: 0, locked: 0 });
        };

        let uv = borrow_global_mut<UserVault>(user_addr);
        uv.total = uv.total + amount;

        let state = borrow_global_mut<VaultState>(protocol_addr);
        state.total_deposits = state.total_deposits + amount;
        event::emit_event(&mut state.deposit_events, DepositEvent { user: user_addr, amount });
    }

    /// Withdraw free (unlocked) collateral.
    public entry fun withdraw<CoinType>(
        user: &signer,
        protocol_addr: address,
        amount: u64,
    ) acquires VaultState, UserVault {
        assert!(amount > 0, E_ZERO_AMOUNT);
        let user_addr = signer::address_of(user);
        assert!(exists<UserVault>(user_addr), E_NOT_INITIALIZED);

        let uv = borrow_global_mut<UserVault>(user_addr);
        let free = uv.total - uv.locked;
        assert!(free >= amount, E_INSUFFICIENT_FREE_COLLATERAL);

        uv.total = uv.total - amount;

        let state = borrow_global_mut<VaultState>(protocol_addr);
        state.total_deposits = state.total_deposits - amount;

        // Transfer from protocol escrow → user
        let payout = coin::withdraw<CoinType>(&account::create_signer_with_capability(
            &account::create_test_signer_cap(protocol_addr) // replaced by stored cap in prod
        ), amount);
        coin::deposit<CoinType>(user_addr, payout);

        event::emit_event(&mut state.withdraw_events, WithdrawEvent { user: user_addr, amount });
    }

    // ── Internal (called by market / liquidation modules) ─────────────────────

    /// Lock `amount` of a user's free collateral as margin for a position.
    public fun lock_collateral(
        caller: address,
        protocol_addr: address,
        user: address,
        amount: u64,
    ) acquires VaultState, UserVault {
        assert_authorized(caller, protocol_addr);
        assert!(exists<UserVault>(user), E_NOT_INITIALIZED);

        let uv = borrow_global_mut<UserVault>(user);
        let free = uv.total - uv.locked;
        assert!(free >= amount, E_INSUFFICIENT_FREE_COLLATERAL);
        uv.locked = uv.locked + amount;
    }

    /// Unlock `amount` of collateral (position closed or liquidated).
    public fun unlock_collateral(
        caller: address,
        protocol_addr: address,
        user: address,
        amount: u64,
    ) acquires VaultState, UserVault {
        assert_authorized(caller, protocol_addr);
        let uv = borrow_global_mut<UserVault>(user);
        uv.locked = if (uv.locked >= amount) { uv.locked - amount } else { 0 };
    }

    /// Realise PnL: add to or subtract from user total (for settlement).
    public fun settle_pnl(
        caller: address,
        protocol_addr: address,
        user: address,
        pnl: i64, // positive = profit, negative = loss
    ) acquires VaultState, UserVault {
        assert_authorized(caller, protocol_addr);
        let uv = borrow_global_mut<UserVault>(user);
        if (pnl >= 0) {
            uv.total = uv.total + (pnl as u64);
        } else {
            let loss = ((-pnl) as u64);
            uv.total = if (uv.total >= loss) { uv.total - loss } else { 0 };
        };
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    #[view]
    public fun free_collateral(user: address): u64 acquires UserVault {
        if (!exists<UserVault>(user)) return 0;
        let uv = borrow_global<UserVault>(user);
        uv.total - uv.locked
    }

    #[view]
    public fun total_collateral(user: address): u64 acquires UserVault {
        if (!exists<UserVault>(user)) return 0;
        borrow_global<UserVault>(user).total
    }

    #[view]
    public fun locked_collateral(user: address): u64 acquires UserVault {
        if (!exists<UserVault>(user)) return 0;
        borrow_global<UserVault>(user).locked
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    fun assert_authorized(caller: address, protocol_addr: address) acquires VaultState {
        let state = borrow_global<VaultState>(protocol_addr);
        assert!(
            std::vector::contains(&state.authorized_callers, &caller),
            E_NOT_AUTHORIZED,
        );
    }
}
