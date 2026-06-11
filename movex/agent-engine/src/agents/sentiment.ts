import Groq from 'groq-sdk';

export interface SentimentSignal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a crypto market sentiment analyst specialised in the Movement Network ecosystem.
Analyse the provided headlines/context and return a JSON object with:
- direction: "LONG" | "SHORT" | "NEUTRAL"
- confidence: number between 0 and 1
- reasoning: one sentence explanation

Respond ONLY with valid JSON. Example:
{"direction":"LONG","confidence":0.72,"reasoning":"Bullish on-chain data and positive funding rate signals"}`;

export async function runSentimentAgent(symbol: string): Promise<SentimentSignal> {
  const prompt = `Analyse current market sentiment for ${symbol} on Movement Network.
Consider: recent price action, social media buzz, Movement Network ecosystem news, and macro crypto sentiment.
What is the likely near-term (4-8h) directional bias?`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw.trim());
    return {
      symbol,
      direction: parsed.direction ?? 'NEUTRAL',
      confidence: Math.min(Math.max(parsed.confidence ?? 0.5, 0), 1),
      reasoning: parsed.reasoning ?? 'LLM analysis',
    };
  } catch (err) {
    return { symbol, direction: 'NEUTRAL', confidence: 0.4, reasoning: 'Sentiment API error' };
  }
}
