export interface Post {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  preview: string;
  createdAt: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  bio: string;
  category: string;
  requiredINJ: number;
  avatarColor: string; // tailwind bg color class
  initials: string;
  posts: Post[];
  subscribers: number;
}

export const CREATORS: Creator[] = [
  {
    id: "inj-alpha",
    name: "INJ Alpha",
    handle: "@injalpha",
    bio: "Deep-dive research on Injective Protocol, validator updates, ecosystem developments, and governance proposals.",
    category: "Research",
    requiredINJ: 5,
    avatarColor: "bg-brand-600",
    initials: "IA",
    subscribers: 1240,
    posts: [
      {
        id: "p1",
        creatorId: "inj-alpha",
        title: "Injective Q4 Ecosystem Report",
        content:
          "The Injective ecosystem saw record on-chain volume in Q4, driven by increased perp trading activity and new protocol integrations. Validators showed strong uptime consistency above 99.8%. Governance participation hit an all-time high with 67% of staked INJ voting on the latest proposals.\n\nKey developments included the launch of three new spot markets, a 12% increase in total value locked across all dApps, and the introduction of new burn auction mechanisms.",
        preview: "The Injective ecosystem saw record on-chain volume in Q4, driven by increased perp trading activity…",
        createdAt: "2024-12-10",
      },
      {
        id: "p2",
        creatorId: "inj-alpha",
        title: "Validator Analysis: Top 10 by Performance",
        content:
          "An in-depth breakdown of the top 10 Injective validators by combined uptime, commission rates, and governance participation. We examined 6 months of on-chain data to produce these rankings.\n\nValidator A leads with 99.98% uptime and 5% commission. Validators B through D maintain competitive performance with community-oriented governance habits.",
        preview: "An in-depth breakdown of the top 10 Injective validators by combined uptime and commission rates…",
        createdAt: "2024-12-05",
      },
      {
        id: "p3",
        creatorId: "inj-alpha",
        title: "INJ Tokenomics Deep Dive",
        content:
          "INJ operates a deflationary model via weekly burn auctions. Over the past 90 days, 187,000 INJ has been burned, reducing circulating supply steadily. Staking yield currently sits at 13.2% APR with 62% of circulating supply staked.\n\nThis analysis covers the full tokenomics model including emission schedules, burn mechanics, and long-term supply projections.",
        preview: "INJ operates a deflationary model via weekly burn auctions. Over the past 90 days…",
        createdAt: "2024-11-28",
      },
    ],
  },
  {
    id: "perp-signals",
    name: "Perp Signals",
    handle: "@perpsignals",
    bio: "Actionable insights on Injective perpetual markets — funding rates, open interest, and orderbook analysis.",
    category: "Trading Intel",
    requiredINJ: 10,
    avatarColor: "bg-purple-600",
    initials: "PS",
    subscribers: 890,
    posts: [
      {
        id: "p4",
        creatorId: "perp-signals",
        title: "INJ/USDT Perp — Funding Rate Divergence",
        content:
          "Funding rates on INJ/USDT perps turned significantly positive at +0.042% per 8h, suggesting elevated long demand relative to spot. Historical analysis shows that sustained positive funding above 0.04% precedes mean reversion within 48–72 hours in 73% of cases since Q2 2023.\n\nOpen interest stands at $18.2M, up 23% from last week. Long/short ratio is currently 1.41.",
        preview: "Funding rates on INJ/USDT perps turned significantly positive at +0.042% per 8h…",
        createdAt: "2024-12-11",
      },
      {
        id: "p5",
        creatorId: "perp-signals",
        title: "Orderbook Heat Map — Key Levels",
        content:
          "The current orderbook shows a significant bid wall at $22.40–22.60 (combined $3.1M) and a resistance cluster at $24.80–25.20 ($2.7M). Liquidity is concentrated in the mid-range, indicating range-bound price action is likely near-term.\n\nTwo large orders (>$500K each) were placed just below spot price in the last 6 hours, pointing to institutional accumulation behavior.",
        preview: "The current orderbook shows a significant bid wall at $22.40–22.60 with combined depth of $3.1M…",
        createdAt: "2024-12-09",
      },
    ],
  },
  {
    id: "onchain-lens",
    name: "On-Chain Lens",
    handle: "@onchainlens",
    bio: "Wallet flow analysis, large transaction tracking, and staking behavior on the Injective network.",
    category: "On-Chain",
    requiredINJ: 3,
    avatarColor: "bg-green-600",
    initials: "OL",
    subscribers: 2100,
    posts: [
      {
        id: "p6",
        creatorId: "onchain-lens",
        title: "Whale Alert: Large INJ Movements",
        content:
          "Three wallets moved a combined 420,000 INJ in the past 24 hours. Wallet A (inj1...x4f2) transferred 180,000 INJ to an exchange hot wallet — first outflow from this address in 11 months. Wallets B and C moved funds internally between subaccounts, suggesting rebalancing rather than selling intent.\n\nTracking these wallets over the next 72 hours for further indicators.",
        preview: "Three wallets moved a combined 420,000 INJ in the past 24 hours. Wallet A transferred 180,000 INJ…",
        createdAt: "2024-12-12",
      },
      {
        id: "p7",
        creatorId: "onchain-lens",
        title: "Staking Inflows vs. Exchange Outflows",
        content:
          "Net staking inflows have exceeded exchange outflows by 2.4x over the past 30 days — a bullish signal historically correlated with price appreciation in 68% of similar 30-day windows on Injective.\n\nTotal staked INJ grew from 142M to 148.6M, while exchange reserves dropped from 31M to 27.4M. The divergence accelerated in the last 10 days.",
        preview: "Net staking inflows have exceeded exchange outflows by 2.4x over the past 30 days…",
        createdAt: "2024-12-08",
      },
      {
        id: "p8",
        creatorId: "onchain-lens",
        title: "New Wallet Cohort Analysis — November",
        content:
          "In November, 14,200 new wallets interacted with the Injective chain for the first time — a 31% increase from October. Of these, 38% staked INJ within their first 7 days, and 22% interacted with at least one dApp within 48 hours.\n\nNew wallet retention rate (active after 30 days) stands at 41%, above the 90-day average of 35%.",
        preview: "In November, 14,200 new wallets interacted with the Injective chain for the first time…",
        createdAt: "2024-12-01",
      },
    ],
  },
  {
    id: "inj-narrative",
    name: "INJ Narrative",
    handle: "@injnarrative",
    bio: "Ecosystem news, protocol updates, and the broader narrative surrounding Injective and its position in DeFi.",
    category: "News & Analysis",
    requiredINJ: 1,
    avatarColor: "bg-yellow-600",
    initials: "IN",
    subscribers: 3400,
    posts: [
      {
        id: "p9",
        creatorId: "inj-narrative",
        title: "Injective's Role in the Modular Blockchain Thesis",
        content:
          "Injective occupies a unique position in the modular blockchain landscape — it operates as an application-specific chain optimized for financial use cases while maintaining interoperability through IBC and bridging to EVM ecosystems.\n\nAs the modular thesis gains traction, Injective's architecture allows it to benefit from shared security models while retaining fast finality. This piece explores why that matters for DeFi builders in 2025.",
        preview: "Injective occupies a unique position in the modular blockchain landscape…",
        createdAt: "2024-12-11",
      },
      {
        id: "p10",
        creatorId: "inj-narrative",
        title: "Top 5 dApps to Watch on Injective in 2025",
        content:
          "Five protocols building on Injective are positioned for significant growth in 2025. We cover Helix, Mito, DojoSwap, Black Panther Finance, and Frontrunner — analyzing their TVL trajectory, user growth, and unique value propositions within the Injective ecosystem.\n\nHigh-level summary: DeFi infrastructure on Injective is maturing rapidly, with combined TVL across these five protocols growing 340% YoY.",
        preview: "Five protocols building on Injective are positioned for significant growth in 2025…",
        createdAt: "2024-12-07",
      },
    ],
  },
];

export function getCreatorById(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}
