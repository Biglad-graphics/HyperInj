import { NextRequest, NextResponse } from "next/server";
import { getMarketData } from "@/lib/marketData";
import { computeDecision, TradeDecision } from "@/lib/tradeLogic";

const ASSET_RE = /\b(BTC|ETH|INJ|SOL|BNB|ATOM|AVAX|MATIC|ARB|OP)\b/i;

async function tryAIExplanation(
  prompt: string,
  asset: string,
  fallback: string
): Promise<string> {
  const agenticUrl =
    process.env.NEXT_PUBLIC_AGENTIC_API_URL ||
    "https://hyperinj-1.onrender.com";

  try {
    const result = await Promise.race<{ explanation?: string } | null>([
      fetch(`${agenticUrl}/trade-signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, asset }),
        signal: AbortSignal.timeout(1500),
      }).then((r) => (r.ok ? r.json() : null)),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("ai_timeout")), 1500)
      ),
    ]);
    if (result && typeof result.explanation === "string" && result.explanation) {
      return result.explanation;
    }
  } catch {
    // Timed out or failed — use rule-based fallback
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = typeof body.prompt === "string" ? body.prompt : "";
    const assetMatch = prompt.match(ASSET_RE);
    const asset = assetMatch ? assetMatch[0].toUpperCase() : "INJ";

    // Layers 1 + 2: instant (cached market data + pure logic)
    const { price, change24h } = await getMarketData(asset);
    const decision: TradeDecision = computeDecision(asset, price, change24h);

    // Layer 3: optional AI explanation (non-blocking, 1.5s timeout)
    const explanation = await tryAIExplanation(
      prompt,
      asset,
      decision.explanation
    );

    return NextResponse.json({
      success: true,
      data: { ...decision, explanation },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
