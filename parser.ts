// Script-based first-pass parser for golf input
// No AI needed — regex patterns for common golf phrases

export interface ParsedGolfInput {
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
  confidence: number;
}

const SCORE_NAMES: Record<string, number> = {
  'ace': -3,
  'hole in one': -3,
  'albatross': -3,
  'double eagle': -3,
  'eagle': -2,
  'birdie': -1,
  'par': 0,
  'bogey': 1,
  'bogie': 1,
  'bogey ': 1,
  'double bogey': 2,
  'double': 2,
  'triple bogey': 3,
  'triple': 3,
  'quad': 4,
  'quadruple bogey': 4,
  'snowman': 4, // relative to par 4
};

const CLUB_PATTERNS = [
  /\b(driver|1[- ]?wood)\b/i,
  /\b(3[- ]?wood|3w)\b/i,
  /\b(5[- ]?wood|5w)\b/i,
  /\b(7[- ]?wood|7w)\b/i,
  /\b(2[- ]?hybrid|2h)\b/i,
  /\b(3[- ]?hybrid|3h)\b/i,
  /\b(4[- ]?hybrid|4h)\b/i,
  /\b(5[- ]?hybrid|5h)\b/i,
  /\b(\d)[- ]?iron\b/i,
  /\bhit\s+(?:a\s+)?(\d)\b/i,
  /\b(pw|pitching wedge)\b/i,
  /\b(sw|sand wedge)\b/i,
  /\b(lw|lob wedge)\b/i,
  /\b(gw|gap wedge)\b/i,
  /\b(aw|approach wedge)\b/i,
  /\b(\d{2})\s*degree\b/i,
  /\b(putter)\b/i,
];

const CLUB_NORMALIZE: Record<string, string> = {
  '1 wood': 'Driver', '1-wood': 'Driver', '1wood': 'Driver', 'driver': 'Driver',
  '3 wood': '3-Wood', '3-wood': '3-Wood', '3w': '3-Wood',
  '5 wood': '5-Wood', '5-wood': '5-Wood', '5w': '5-Wood',
  '7 wood': '7-Wood', '7-wood': '7-Wood', '7w': '7-Wood',
  '2 hybrid': '2-Hybrid', '2-hybrid': '2-Hybrid', '2h': '2-Hybrid',
  '3 hybrid': '3-Hybrid', '3-hybrid': '3-Hybrid', '3h': '3-Hybrid',
  '4 hybrid': '4-Hybrid', '4-hybrid': '4-Hybrid', '4h': '4-Hybrid',
  '5 hybrid': '5-Hybrid', '5-hybrid': '5-Hybrid', '5h': '5-Hybrid',
  'pw': 'PW', 'pitching wedge': 'PW',
  'sw': 'SW', 'sand wedge': 'SW',
  'lw': 'LW', 'lob wedge': 'LW',
  'gw': 'GW', 'gap wedge': 'GW',
  'aw': 'AW', 'approach wedge': 'AW',
  'putter': 'Putter',
};

// Common speech-to-text misrecognitions for golf terms
const STT_CORRECTIONS: [RegExp, string][] = [
  // "whole" → "hole"
  [/\bwhole\s+(\d)/gi, 'hole $1'],
  // "boogie/boogeee/boogey" → "bogey"
  [/\bboog[ie]{2,}[y]?\b/gi, 'bogey'],
  // "pets/pats/puts/petts" → "putts"
  [/\b(three|two|one|1|2|3|4)\s+pe?[aet]+s\b/gi, '$1 putts'],
  [/\bpe?[aet]+s\b/gi, 'putts'],
  // "birdy" → "birdie"
  [/\bbirdy\b/gi, 'birdie'],
  // "eagle/egal" misheard
  [/\begal\b/gi, 'eagle'],
  // "par three/par for" confusions
  [/\bpart\b/gi, 'par'],
  // "iron" misheard as "i earn/i run"
  [/\b(\d)\s*i\s*(?:earn|run|urn)\b/gi, '$1 iron'],
  // "whole in one" → "hole in one"
  [/\bwhole in one\b/gi, 'hole in one'],
  // "three pet/three pat" → "three putt"
  [/\b(three|two|one|3|2|1)\s*(?:pet|pat|patt|put)\b/gi, '$1 putt'],
  // "fore" → "four" (number context)
  [/\bfore\s+(iron|wood|hybrid)\b/gi, 'four $1'],
  // "wait/weight" → "wedge"
  [/\b(pitching|sand|lob|gap)\s*(?:wait|weight|which)\b/gi, '$1 wedge'],
  // Number words that STT might spell out
  [/\bto\s+putts\b/gi, 'two putts'],
  [/\bfor\s+putts\b/gi, 'four putts'],
  [/\bwon\s+putt\b/gi, 'one putt'],
];

function correctSTT(text: string): string {
  let corrected = text;
  for (const [pattern, replacement] of STT_CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }
  return corrected;
}

export function parseGolfInput(text: string): ParsedGolfInput {
  const result: ParsedGolfInput = { confidence: 0 };
  let matches = 0;
  const lower = correctSTT(text.toLowerCase().trim());

  // Extract hole number
  const holePatterns = [
    /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth)\s+hole/i,
    /hole\s+(\d{1,2})(?!\d)/i,
    /on\s+(\d{1,2})(?!\d)\b/i,
    /\#(\d{1,2})(?!\d)\b/,
  ];

  const wordToNum: Record<string, number> = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
    seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
    thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16,
    seventeenth: 17, eighteenth: 18,
  };

  for (const pat of holePatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = wordToNum[m[1].toLowerCase()] || parseInt(m[1]);
      if (val >= 1 && val <= 18) {
        result.hole = val;
        matches++;
        break;
      }
    }
  }

  // Extract score name (check longer phrases first)
  const scoreOrder = [
    'hole in one', 'double eagle', 'albatross', 'quadruple bogey',
    'triple bogey', 'double bogey', 'double', 'triple', 'quad',
    'eagle', 'birdie', 'bogey', 'bogie', 'par', 'ace', 'snowman',
  ];

  for (const name of scoreOrder) {
    if (lower.includes(name)) {
      result.scoreName = name;
      result.score = SCORE_NAMES[name];
      matches++;
      break;
    }
  }

  // Extract explicit score: "made a 4", "got a 6", "shot 72", "scored a 5"
  if (result.score === undefined) {
    const explicitScore = lower.match(/(?:made|got|shot|scored|took)\s+(?:a\s+)?(\d{1,2})/i);
    if (explicitScore) {
      const val = parseInt(explicitScore[1]);
      if (val >= 1 && val <= 15) {
        result.score = val;
        matches++;
      }
    }
  }

  // Extract putts
  const puttPatterns = [
    /(\d)[- ]?putt(?:s|ed)?/i,
    /(\bone|two|three|four)\s+putt/i,
  ];
  const wordNums: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };

  for (const pat of puttPatterns) {
    const m = lower.match(pat);
    if (m) {
      result.putts = wordNums[m[1].toLowerCase()] || parseInt(m[1]);
      matches++;
      break;
    }
  }

  // Extract penalties
  const penaltyPatterns = [
    { pat: /\b(ob|out of bounds)\b/i, type: 'OB' },
    { pat: /\b(in the water|into the water|hit the water|went in the water|water ball|water hazard penalty)\b/i, type: 'Water' },
    { pat: /\b(lost ball)\b/i, type: 'Lost Ball' },
    { pat: /\b(penalty|drop|took a drop)\b/i, type: 'Penalty' },
    { pat: /\b(lateral)\b/i, type: 'Lateral' },
    { pat: /\b(unplayable)\b/i, type: 'Unplayable' },
  ];

  for (const { pat, type } of penaltyPatterns) {
    if (pat.test(lower)) {
      result.penalties = (result.penalties || 0) + 1;
      result.penaltyType = type;
      matches++;
      break;
    }
  }

  // Extract fairway
  if (/hit\s+(?:the\s+)?fairway/i.test(lower) || /in\s+the\s+fairway/i.test(lower) || /fairway\s+hit/i.test(lower)) {
    result.fairway = true;
    matches++;
  } else if (/missed\s+(?:the\s+)?fairway/i.test(lower) || /missed\s+(right|left)/i.test(lower)) {
    result.fairway = false;
    const dir = lower.match(/missed\s+(?:the\s+fairway\s+)?(right|left)/i);
    if (dir) result.fairwayMiss = dir[1];
    matches++;
  }

  // Extract GIR
  if (/\bgir\b/i.test(lower) || /green\s+in\s+reg/i.test(lower) || /hit\s+the\s+green/i.test(lower) || /on\s+the\s+green\s+in/i.test(lower)) {
    result.gir = true;
    matches++;
  }

  // Extract club
  // Special handling for N-iron
  const ironMatch = lower.match(/(\d)[- ]?iron/i);
  if (ironMatch) {
    result.club = `${ironMatch[1]}-Iron`;
    matches++;
  }

  // "hit a N" pattern (for irons)
  if (!result.club) {
    const hitMatch = lower.match(/hit\s+(?:a\s+)?(\d)\b(?!\s*(?:putt|wood|hybrid|foot|feet|yard))/i);
    if (hitMatch) {
      const num = parseInt(hitMatch[1]);
      if (num >= 2 && num <= 9) {
        result.club = `${num}-Iron`;
        matches++;
      }
    }
  }

  // Named clubs
  if (!result.club) {
    for (const pat of CLUB_PATTERNS) {
      const m = lower.match(pat);
      if (m) {
        const key = m[1].toLowerCase();
        if (CLUB_NORMALIZE[key]) {
          result.club = CLUB_NORMALIZE[key];
        } else if (/^\d{2}$/.test(m[1])) {
          result.club = `${m[1]}°`;
        }
        if (result.club) {
          matches++;
          break;
        }
      }
    }
  }

  // Extract distance
  const distPatterns = [
    /(\d{2,3})\s*(?:yards?|yds?)\s*(?:out|in)?/i,
    /had\s+(\d{2,3})\s*(?:in|out|left)/i,
    /(\d{2,3})\s*(?:in|out)\b/i,
    /from\s+(\d{2,3})/i,
  ];

  for (const pat of distPatterns) {
    const m = lower.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 30 && val <= 350) {
        result.distance = val;
        matches++;
        break;
      }
    }
  }

  // Extract bet updates
  if (/\b(?:team|we|our\s+team)\s+(?:win|won|wins)\b/i.test(lower) ||
      /\b(?:won\s+the\s+hole|halved|tied|push)\b/i.test(lower) ||
      /\b(?:up|down)\s+\d\b/i.test(lower)) {
    result.betUpdate = lower;
    matches++;
  }

  // Extract press info
  if (/press/i.test(lower)) {
    result.pressInfo = lower;
    matches++;
  }

  // Extract journal-like notes (sentences with descriptive language)
  const journalPhrases = lower.match(/(?:landed|pin high|short sided|lip out|burned the edge|just missed|great shot|terrible|skulled|chunked|thinned|piped|striped|flushed|smoked|hammered|crushed)[^,.]*/gi);
  if (journalPhrases) {
    result.journal = journalPhrases.join('. ').trim();
    matches++;
  }

  // Calculate confidence based on how many fields we extracted
  const totalPossible = 8; // hole, score, putts, penalty, fairway, club, distance, bet
  result.confidence = Math.min(1, matches / Math.max(2, Math.min(totalPossible, matches + 2)));

  // If we got at least hole + score, higher confidence
  if (result.hole && (result.score !== undefined || result.scoreName)) {
    result.confidence = Math.max(result.confidence, 0.7);
  }

  // If we got nothing meaningful, very low confidence
  if (matches === 0) {
    result.confidence = 0;
  }

  return result;
}

// Convert relative score to absolute given par
export function resolveScore(parsed: ParsedGolfInput, holePar: number = 4): number | undefined {
  if (parsed.score !== undefined) {
    // If score is relative (from score name), add to par
    if (parsed.scoreName && parsed.score <= 4 && parsed.score >= -3) {
      return holePar + parsed.score;
    }
    // Otherwise it's absolute
    return parsed.score;
  }
  return undefined;
}
