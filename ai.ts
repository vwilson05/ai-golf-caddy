import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface GolfInputResult {
  hole?: number;
  score?: number;
  scoreName?: string;
  par?: number;
  putts?: number;
  penalties?: number;
  penaltyType?: string;
  fairway?: boolean | null;
  fairwayMiss?: string;
  gir?: boolean;
  club?: string;
  distance?: number;
  journal?: string;
  betUpdate?: string;
  pressInfo?: string;
}

export async function parseGolfInput(text: string, roundContext?: any): Promise<GolfInputResult> {
  const contextStr = roundContext
    ? `\nCurrent round context: ${JSON.stringify(roundContext)}`
    : '';

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `You are a golf input parser. Parse this natural language golf input into structured data.
Return ONLY a JSON object with these fields (omit any that aren't mentioned):
- hole: number (1-18)
- score: number (absolute score for the hole, e.g. 4 for par on a par 4)
- scoreName: string (eagle/birdie/par/bogey/double bogey/etc)
- par: number (par for the hole if mentioned)
- putts: number
- penalties: number
- penaltyType: string (OB/Water/Lost Ball/Penalty/Lateral/Unplayable)
- fairway: boolean or null
- fairwayMiss: string (left/right)
- gir: boolean
- club: string (normalized, e.g. "8-Iron", "Driver", "PW", "56°")
- distance: number (yards to pin for approach)
- journal: string (any descriptive/narrative content about the shot or hole)
- betUpdate: string (any betting-related info: who won hole, match status)
- pressInfo: string (any press-related info)

For score, convert relative terms to absolute: birdie on par 4 = 3, bogey on par 4 = 5. If par isn't specified, assume par 4.
${contextStr}

Input: "${text}"

JSON:`
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  try {
    const jsonStr = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}

export async function generateCaddyAdvice(
  player: any,
  hole: any,
  stats: any,
  conditions?: any
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `You are an AI golf caddy. Give brief, actionable advice for this situation.

Player: ${JSON.stringify(player)}
Hole: ${JSON.stringify(hole)}
Player Stats: ${JSON.stringify(stats)}
${conditions ? `Conditions: ${JSON.stringify(conditions)}` : ''}

Give 2-3 sentences of specific caddy advice. Be conversational, like a real caddy. Reference their stats if relevant. Don't be generic.`
    }],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}

export async function generateRoundSummary(
  round: any,
  holeScores: any[],
  bets?: any[]
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `You are an AI golf caddy writing a round summary. Be like a caddy recapping the round at the 19th hole.

Round: ${JSON.stringify(round)}
Hole Scores: ${JSON.stringify(holeScores)}
${bets ? `Bets: ${JSON.stringify(bets)}` : ''}

Write a 3-4 paragraph narrative summary. Mention highlights (birdies, eagles), lowlights, key stats, betting outcomes, and overall assessment. Be conversational and specific.`
    }],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}

export async function generateStatInsights(playerStats: any): Promise<string[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are an AI golf caddy analyzing a player's stats. Generate 3-5 specific, actionable insights.

Stats: ${JSON.stringify(playerStats)}

Return a JSON array of strings, each being one insight. Be specific with numbers. Examples:
- "Your putting inside 10ft improved 8% this month"
- "You're hitting 67% of fairways but only 45% GIR - your iron play needs work"
- "Par 3s are your best holes at 0.3 over par average"

JSON array:`
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') return [];

  try {
    const jsonStr = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return [content.text];
  }
}
