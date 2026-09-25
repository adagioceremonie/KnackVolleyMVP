import { MatchInfo, Player, PlayerTally, PlayerSeasonStats, SupporterVote, PlaceholderConfig } from '../types';
import { INITIAL_MATCH, INITIAL_MATCHES, INITIAL_PLAYERS, SAMPLE_VOTES } from '../data/initialData';

const STORAGE_KEYS = {
  MATCH: 'knack_roeselare_match_v3',
  MATCHES_LIST: 'knack_roeselare_matches_list_v3',
  PLAYERS: 'knack_roeselare_players_2026_2027',
  VOTES: 'knack_roeselare_votes_v3',
  DEVICE_ID: 'knack_roeselare_device_id_v2',
  ADMIN_PASSWORD: 'knack_roeselare_admin_password_v1',
  ADMIN_AUTH: 'knack_roeselare_admin_auth_v1',
  PLACEHOLDER_CONFIG: 'knack_roeselare_placeholder_config_v1',
  PAGE_VIEWS_PREFIX: 'knack_roeselare_pageviews_v3_',
};

export function getVotingPageViews(matchId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAGE_VIEWS_PREFIX + matchId);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to get page views from localStorage', e);
  }
  return 0;
}

export function saveVotingPageViews(matchId: string, count: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAGE_VIEWS_PREFIX + matchId, count.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('knack_pageviews_changed', { detail: { matchId, count } }));
    }
  } catch (e) {
    console.error('Failed to save page views to localStorage', e);
  }
}

export async function fetchVotingPageViews(matchId: string): Promise<number> {
  const localCount = getVotingPageViews(matchId);
  try {
    const res = await fetch(`/api/pageviews/${encodeURIComponent(matchId)}`);
    if (res.ok) {
      const data = await res.json();
      const serverCount = typeof data.count === 'number' ? data.count : 0;
      const finalCount = Math.max(localCount, serverCount);
      saveVotingPageViews(matchId, finalCount);
      return finalCount;
    }
  } catch (e) {
    // Network error or local dev mode: fallback to local count
  }
  return localCount;
}

export async function incrementVotingPageView(matchId: string): Promise<number> {
  const current = getVotingPageViews(matchId);
  const next = current + 1;
  saveVotingPageViews(matchId, next);

  try {
    const res = await fetch(`/api/pageviews/${encodeURIComponent(matchId)}/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.count === 'number' && data.count > next) {
        saveVotingPageViews(matchId, data.count);
        return data.count;
      }
    }
  } catch (e) {
    // Fallback to local increment
  }
  return next;
}

export async function resetVotingPageViews(matchId: string): Promise<number> {
  saveVotingPageViews(matchId, 0);
  try {
    await fetch(`/api/pageviews/${encodeURIComponent(matchId)}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // Ignored, local is already 0
  }
  return 0;
}

export const DEFAULT_PLACEHOLDER_CONFIG: PlaceholderConfig = {
  style: 'blue_number',
  customImageDataUrl: null,
  customImageName: null,
};

export function getPlaceholderConfig(): PlaceholderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLACEHOLDER_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.style) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load placeholder config', e);
  }
  return DEFAULT_PLACEHOLDER_CONFIG;
}

export function savePlaceholderConfig(config: PlaceholderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLACEHOLDER_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('knack_placeholder_changed', { detail: config }));
  } catch (e) {
    console.error('Failed to save placeholder config', e);
  }
}

const DEFAULT_ADMIN_PASSWORD = 'knack2026';

export function getAdminPassword(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
    return saved && saved.trim().length > 0 ? saved : DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function saveAdminPassword(newPassword: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword.trim());
  } catch (e) {
    console.error('Failed to save admin password', e);
  }
}

export function verifyAdminPassword(attempt: string): boolean {
  const current = getAdminPassword();
  const clean = attempt.trim();
  // Accept current password, default password, or common variant 'knack'
  return clean === current || clean === DEFAULT_ADMIN_PASSWORD || clean.toLowerCase() === 'knack';
}

export function isAdminAuthenticated(): boolean {
  try {
    // Check localStorage (remembered) or sessionStorage
    const local = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (local === 'true') return true;
    const session = sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    return session === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(authenticated: boolean, remember: boolean = true): void {
  try {
    if (authenticated) {
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      } else {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  } catch (e) {
    console.error('Failed to update admin auth status', e);
  }
}

// Get or generate unique device id for 1-vote-per-device rule
export function getVoterDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = 'supporter-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return 'fallback-supporter-id';
  }
}

export function parseMatchDateTime(dateStr: string = '', timeStr?: string): { date: string; time: string } {
  if (timeStr && timeStr.trim()) {
    return { date: dateStr.trim(), time: timeStr.trim() };
  }
  const clean = (dateStr || '').trim();
  if (!clean) {
    return { date: '', time: '' };
  }

  const timeRegex = /(?:,\s*|\s+-\s+|\s+om\s+|\s+at\s+|\s+)((\d{1,2}[:.uUhH]\d{2})\s*(?:uur|u)?)$/i;
  const match = clean.match(timeRegex);
  if (match && match.index !== undefined) {
    const time = match[1].trim();
    const date = clean.substring(0, match.index).trim();
    return { date, time };
  }

  return { date: clean, time: '' };
}

const DUTCH_MONTHS: { [key: string]: number } = {
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maart: 2, mrt: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  augustus: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

export function getMatchMidnightTimestamp(dateStr: string = ''): number | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.toLowerCase().trim();

  // Pattern 1: YYYY-MM-DD
  const isoMatch = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    // Midnight ending the match day (i.e. next day at 00:00:00)
    return new Date(year, month, day + 1, 0, 0, 0, 0).getTime();
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numDateMatch = clean.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (numDateMatch) {
    const day = parseInt(numDateMatch[1], 10);
    const month = parseInt(numDateMatch[2], 10) - 1;
    const year = parseInt(numDateMatch[3], 10);
    return new Date(year, month, day + 1, 0, 0, 0, 0).getTime();
  }

  // Pattern 3: Dutch text e.g. "Zaterdag 26 september 2026", "26 sept 2026"
  const textMatch = clean.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthName = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);
    if (DUTCH_MONTHS[monthName] !== undefined) {
      return new Date(year, DUTCH_MONTHS[monthName], day + 1, 0, 0, 0, 0).getTime();
    }
  }

  // Fallback: standard Date.parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
  }

  return null;
}

export function isMatchPastMidnight(match: MatchInfo, now: number = Date.now()): boolean {
  if (match.autoCloseMidnight === false) return false;
  const midnightTime = getMatchMidnightTimestamp(match.date);
  if (!midnightTime) return false;
  return now >= midnightTime;
}

export function getRemainingTimeUntilMidnight(
  dateStr: string = '',
  now: number = Date.now()
): { hours: number; minutes: number; seconds: number; isPast: boolean; formatted: string; targetMidnight: number } | null {
  const midnightTime = getMatchMidnightTimestamp(dateStr);
  if (!midnightTime) return null;

  const diffMs = midnightTime - now;
  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      formatted: '00:00:00',
      targetMidnight: midnightTime,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = hours > 24 
    ? `${Math.floor(hours / 24)}d ${pad(hours % 24)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    hours,
    minutes,
    seconds,
    isPast: false,
    formatted,
    targetMidnight: midnightTime,
  };
}

function isDeletedMatch(m: { id?: string; awayTeam?: string; matchId?: string }): boolean {
  const id = m.id || m.matchId;
  if (id === 'match-knack-2026-2027-02' || id === 'match-knack-2026-2027-03') return true;
  if (m.awayTeam && (
    m.awayTeam.toLowerCase().includes('menen') || 
    m.awayTeam.toLowerCase().includes('aalst') ||
    m.awayTeam.toLowerCase().includes('maaseik')
  )) {
    return true;
  }
  return false;
}

export function loadMatchInfo(): MatchInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.homeTeam && parsed.homeTeam.includes('Knack') && !isDeletedMatch(parsed)) {
        if (parsed.location && parsed.location.includes('Schiervelde')) {
          parsed.location = parsed.location.replace(/Schiervelde/g, 'REO Arena');
        }
        if (!parsed.time && parsed.date) {
          const parsedDT = parseMatchDateTime(parsed.date);
          if (parsedDT.time) {
            parsed.date = parsedDT.date;
            parsed.time = parsedDT.time;
          }
        }
        if (parsed.id) {
          parsed.votingPageViews = getVotingPageViews(parsed.id);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load match info', e);
  }
  const match = { ...INITIAL_MATCH };
  match.votingPageViews = getVotingPageViews(match.id);
  saveMatchInfo(match);
  return match;
}

export function saveMatchInfo(match: MatchInfo): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCH, JSON.stringify(match));
    const currentList = loadMatchesList();
    const idx = currentList.findIndex((m) => m.id === match.id);
    if (idx >= 0) {
      currentList[idx] = match;
    } else {
      currentList.unshift(match);
    }
    saveMatchesList(currentList);
  } catch (e) {
    console.error('Failed to save match info', e);
  }
}

export function loadMatchesList(): MatchInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed
          .filter((m) => !isDeletedMatch(m))
          .map((m) => ({
            ...m,
            votingPageViews: getVotingPageViews(m.id),
          }));
        if (filtered.length > 0) {
          // Persist the filtered list
          if (filtered.length !== parsed.length) {
            saveMatchesList(filtered);
          }
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load matches list', e);
  }
  const initial = INITIAL_MATCHES.map((m) => ({
    ...m,
    votingPageViews: getVotingPageViews(m.id),
  }));
  saveMatchesList(initial);
  return initial;
}

export function saveMatchesList(matches: MatchInfo[]): void {
  try {
    const cleanMatches = matches.filter((m) => !isDeletedMatch(m));
    localStorage.setItem(STORAGE_KEYS.MATCHES_LIST, JSON.stringify(cleanMatches));
  } catch (e) {
    console.error('Failed to save matches list', e);
  }
}

export function loadPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Verify it has Knack 2026-2027 squad players
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(player => {
          // If player has custom uploaded photo or explicit data URL, preserve it
          if (player.photoUrl && (player.photoUrl.startsWith('data:') || player.photoUrl.startsWith('blob:'))) {
            return player;
          }
          const defaultMatch = INITIAL_PLAYERS.find(dp => dp.id === player.id || dp.name === player.name || dp.number === player.number);
          if (defaultMatch && defaultMatch.photoUrl) {
            // If player has old legacy unsplash URLs, upgrade to official SVG card
            if (!player.photoUrl || player.photoUrl.includes('unsplash.com')) {
              return { ...player, photoUrl: defaultMatch.photoUrl };
            }
          }
          return player;
        });
      }
    }
  } catch (e) {
    console.error('Failed to load players', e);
  }
  return INITIAL_PLAYERS;
}

export function savePlayers(players: Player[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (e) {
    console.error('Failed to save players', e);
  }
}

export function generateReceiptCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MVP-KNACK-${segment1}-${segment2}`;
}

export function loadVotes(): SupporterVote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTES);
    if (raw) {
      const parsed: any[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed
          .filter((v) => !isDeletedMatch(v))
          .map((v, idx) => ({
            id: v.id || `vote-${idx}`,
            matchId: v.matchId || INITIAL_MATCH.id,
            anonymousId: v.anonymousId || `Supporter #${idx + 1}`,
            receiptCode: v.receiptCode || `MVP-KNACK-${idx + 1}`,
            voterDeviceId: v.voterDeviceId || `device-${idx}`,
            timestamp: v.timestamp || Date.now(),
            choices: v.choices,
            supporterNote: v.supporterNote,
          }));
        if (filtered.length !== parsed.length) {
          saveVotes(filtered);
        }
        return filtered;
      }
    }
  } catch (e) {
    console.error('Failed to load votes', e);
  }
  return [];
}

export function saveVotes(votes: SupporterVote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
  } catch (e) {
    console.error('Failed to save votes', e);
  }
}

// Calculate the rankings and point tallies according to the rules:
// 3 points for 1st, 2 points for 2nd, 1 point for 3rd
export function calculateTallies(players: Player[], votes: SupporterVote[], matchId: string): PlayerTally[] {
  const matchVotes = votes.filter((v) => v.matchId === matchId);

  const talliesMap = new Map<string, { totalPoints: number; votes3pt: number; votes2pt: number; votes1pt: number; totalBallots: number }>();

  // Initialize for all players
  for (const player of players) {
    talliesMap.set(player.id, {
      totalPoints: 0,
      votes3pt: 0,
      votes2pt: 0,
      votes1pt: 0,
      totalBallots: 0,
    });
  }

  for (const vote of matchVotes) {
    const { first3ptPlayerId, second2ptPlayerId, third1ptPlayerId } = vote.choices;

    if (first3ptPlayerId && talliesMap.has(first3ptPlayerId)) {
      const entry = talliesMap.get(first3ptPlayerId)!;
      entry.votes3pt += 1;
      entry.totalPoints += 3;
      entry.totalBallots += 1;
    }
    if (second2ptPlayerId && talliesMap.has(second2ptPlayerId)) {
      const entry = talliesMap.get(second2ptPlayerId)!;
      entry.votes2pt += 1;
      entry.totalPoints += 2;
      entry.totalBallots += 1;
    }
    if (third1ptPlayerId && talliesMap.has(third1ptPlayerId)) {
      const entry = talliesMap.get(third1ptPlayerId)!;
      entry.votes1pt += 1;
      entry.totalPoints += 1;
      entry.totalBallots += 1;
    }
  }

  const result: PlayerTally[] = players.map((player) => {
    const stats = talliesMap.get(player.id) || {
      totalPoints: 0,
      votes3pt: 0,
      votes2pt: 0,
      votes1pt: 0,
      totalBallots: 0,
    };
    return {
      player,
      totalPoints: stats.totalPoints,
      votes3pt: stats.votes3pt,
      votes2pt: stats.votes2pt,
      votes1pt: stats.votes1pt,
      totalBallots: stats.totalBallots,
      rank: 1,
    };
  });

  // Sort descending: totalPoints -> votes3pt -> votes2pt -> votes1pt -> player jersey number
  result.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.votes3pt !== a.votes3pt) return b.votes3pt - a.votes3pt;
    if (b.votes2pt !== a.votes2pt) return b.votes2pt - a.votes2pt;
    if (b.votes1pt !== a.votes1pt) return b.votes1pt - a.votes1pt;
    return a.player.number - b.player.number;
  });

  // Assign ranks
  result.forEach((item, index) => {
    item.rank = index + 1;
  });

  return result;
}

// Calculate cumulative stats across all matches for every player
export function calculateSeasonStats(
  players: Player[],
  votes: SupporterVote[],
  matches: MatchInfo[]
): PlayerSeasonStats[] {
  // Precompute tallies per match
  const matchTalliesMap = new Map<string, PlayerTally[]>();
  for (const match of matches) {
    matchTalliesMap.set(match.id, calculateTallies(players, votes, match.id));
  }

  // Pre-initialize stats for all players
  const statsMap = new Map<
    string,
    {
      totalPoints: number;
      matchesVoted: number;
      votes3pt: number;
      votes2pt: number;
      votes1pt: number;
      totalBallots: number;
      mvpCount: number;
      pointsPerMatch: Record<string, number>;
    }
  >();

  for (const player of players) {
    statsMap.set(player.id, {
      totalPoints: 0,
      matchesVoted: 0,
      votes3pt: 0,
      votes2pt: 0,
      votes1pt: 0,
      totalBallots: 0,
      mvpCount: 0,
      pointsPerMatch: {},
    });
  }

  // Accumulate points and counts per match
  for (const match of matches) {
    const tallies = matchTalliesMap.get(match.id) || [];
    // If any points in this match, top 1 is MVP (if totalPoints > 0)
    if (tallies.length > 0 && tallies[0].totalPoints > 0) {
      const mvpPlayerId = tallies[0].player.id;
      const mvpEntry = statsMap.get(mvpPlayerId);
      if (mvpEntry) {
        mvpEntry.mvpCount += 1;
      }
    }

    for (const tally of tallies) {
      const entry = statsMap.get(tally.player.id);
      if (entry) {
        entry.pointsPerMatch[match.id] = tally.totalPoints;
        entry.totalPoints += tally.totalPoints;
        entry.votes3pt += tally.votes3pt;
        entry.votes2pt += tally.votes2pt;
        entry.votes1pt += tally.votes1pt;
        entry.totalBallots += tally.totalBallots;
        if (tally.totalPoints > 0) {
          entry.matchesVoted += 1;
        }
      }
    }
  }

  const results: PlayerSeasonStats[] = players.map((player) => {
    const s = statsMap.get(player.id)!;
    return {
      player,
      totalPoints: s.totalPoints,
      matchesVoted: s.matchesVoted,
      votes3pt: s.votes3pt,
      votes2pt: s.votes2pt,
      votes1pt: s.votes1pt,
      totalBallots: s.totalBallots,
      mvpCount: s.mvpCount,
      pointsPerMatch: s.pointsPerMatch,
      rank: 1,
    };
  });

  // Sort descending: totalPoints -> mvpCount -> votes3pt -> votes2pt -> votes1pt -> jersey number
  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
    if (b.votes3pt !== a.votes3pt) return b.votes3pt - a.votes3pt;
    if (b.votes2pt !== a.votes2pt) return b.votes2pt - a.votes2pt;
    if (b.votes1pt !== a.votes1pt) return b.votes1pt - a.votes1pt;
    return a.player.number - b.player.number;
  });

  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  return results;
}

// Export Season Total Points across all matches as CSV
export function exportSeasonPointsCSV(
  stats: PlayerSeasonStats[],
  matches: MatchInfo[]
): void {
  const headers = [
    'Rang',
    'Rugnummer',
    'Naam',
    'Positie',
    ...matches.map((m) => `Match: ${m.homeTeam} vs ${m.awayTeam} (${m.date || 'Datum onbekend'})`),
    'Totaal Punten Seizoen',
    '3-Punt Stemmen (Goud)',
    '2-Punt Stemmen (Zilver)',
    '1-Punt Stemmen (Brons)',
    'Aantal Keer MVP',
    'Aantal Matchen Gepunt',
  ];

  const rows: string[][] = [headers];

  stats.forEach((s) => {
    const row = [
      s.rank.toString(),
      `#${s.player.number}`,
      `"${s.player.name}"`,
      `"${s.player.position}"`,
      ...matches.map((m) => (s.pointsPerMatch[m.id] ?? 0).toString()),
      s.totalPoints.toString(),
      s.votes3pt.toString(),
      s.votes2pt.toString(),
      s.votes1pt.toString(),
      s.mvpCount.toString(),
      s.matchesVoted.toString(),
    ];
    rows.push(row);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `knack_volley_seizoensklassement_alle_wedstrijden_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Single Match Points as CSV
export function exportMatchPointsCSV(
  tallies: PlayerTally[],
  match: MatchInfo
): void {
  const headers = [
    'Rang',
    'Rugnummer',
    'Naam',
    'Positie',
    'Punten Match',
    '3-Punt Stemmen (Goud)',
    '2-Punt Stemmen (Zilver)',
    '1-Punt Stemmen (Brons)',
    'Aantal Stembiljetten',
    'Wedstrijd',
    'Datum',
    'Locatie',
  ];

  const rows: string[][] = [headers];

  tallies.forEach((t) => {
    const row = [
      t.rank.toString(),
      `#${t.player.number}`,
      `"${t.player.name}"`,
      `"${t.player.position}"`,
      t.totalPoints.toString(),
      t.votes3pt.toString(),
      t.votes2pt.toString(),
      t.votes1pt.toString(),
      t.totalBallots.toString(),
      `"${match.homeTeam} vs ${match.awayTeam}"`,
      `"${match.date || ''}"`,
      `"${match.location || ''}"`,
    ];
    rows.push(row);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanOpponent = match.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `knack_volley_punten_${cleanOpponent}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate clean plain text report for clipboard copying
export function generatePointsReportText(
  mode: 'season' | 'match',
  stats: PlayerSeasonStats[],
  matches: MatchInfo[],
  selectedMatch?: MatchInfo,
  matchTallies?: PlayerTally[]
): string {
  if (mode === 'match' && selectedMatch && matchTallies) {
    let report = `🏐 KNACK VOLLEY ROESELARE - PUNTENTOTAAL PER WEDSTRIJD 🏐\n`;
    report += `Wedstrijd: ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}\n`;
    if (selectedMatch.date) report += `Datum: ${selectedMatch.date}\n`;
    if (selectedMatch.location) report += `Locatie: ${selectedMatch.location}\n`;
    if (selectedMatch.finalScore) report += `Uitslag: ${selectedMatch.finalScore}\n`;
    report += `\n------------------------------------------------------------\n`;
    report += `RANG | SPELER                      | PUNTEN | 3PT | 2PT | 1PT\n`;
    report += `------------------------------------------------------------\n`;
    matchTallies.forEach((t) => {
      const nameCol = `#${t.player.number} ${t.player.name}`.padEnd(28, ' ');
      const rankCol = `#${t.rank}`.padEnd(4, ' ');
      const ptsCol = `${t.totalPoints} ptn`.padEnd(7, ' ');
      report += `${rankCol} | ${nameCol} | ${ptsCol} | ${t.votes3pt}x  | ${t.votes2pt}x  | ${t.votes1pt}x\n`;
    });
    report += `------------------------------------------------------------\n`;
    return report;
  }

  // Season report across all matches
  let report = `🏐 KNACK VOLLEY ROESELARE - SEIZOENSKLASSEMENT (ALLE WEDSTRIJDEN) 🏐\n`;
  report += `Aantal geregistreerde wedstrijden: ${matches.length}\n`;
  report += `\n----------------------------------------------------------------------\n`;
  report += `RANG | SPELER                      | TOTAAL | MVP'S | 3PT | 2PT | 1PT\n`;
  report += `----------------------------------------------------------------------\n`;
  stats.forEach((s) => {
    const nameCol = `#${s.player.number} ${s.player.name}`.padEnd(28, ' ');
    const rankCol = `#${s.rank}`.padEnd(4, ' ');
    const ptsCol = `${s.totalPoints} ptn`.padEnd(7, ' ');
    const mvpCol = `${s.mvpCount}x`.padEnd(5, ' ');
    report += `${rankCol} | ${nameCol} | ${ptsCol} | ${mvpCol} | ${s.votes3pt}x  | ${s.votes2pt}x  | ${s.votes1pt}x\n`;
  });
  report += `----------------------------------------------------------------------\n`;
  return report;
}

// Generate shareable WhatsApp / social media message
export function generateMatchFacebookShareText(match: MatchInfo, tallies?: PlayerTally[], totalVotes?: number): string {
  const parts: string[] = [];
  parts.push(`🏐 KNACK VOLLEY ROESELARE - MVP STEMMING 💙🤍`);
  parts.push(``);
  parts.push(`⚔️ Wedstrijd: ${match.homeTeam} vs ${match.awayTeam}`);
  if (match.competition) {
    parts.push(`🏆 Competitie: ${match.competition}${match.season ? ` (${match.season})` : ''}`);
  }
  if (match.finalScore && match.finalScore.trim() !== '' && match.finalScore !== '0 - 0') {
    const setInfo = match.setScores && match.setScores.length > 0 ? ` [${match.setScores.join(', ')}]` : '';
    parts.push(`📊 Uitslag: ${match.finalScore}${setInfo}`);
  }
  if (match.date) {
    const timeStr = match.time ? ` om ${match.time.includes('u') ? match.time : match.time + ' uur'}` : '';
    parts.push(`📅 Datum & Tijd: ${match.date}${timeStr}`);
  }
  if (match.location) {
    parts.push(`📍 Locatie: ${match.location}`);
  }

  parts.push(``);
  if (match.isVotingOpen) {
    parts.push(`🗳️ De supportersstemming is NU geopend! Breng jouw 3, 2 en 1 punt stemmen uit voor de Man van de Wedstrijd.`);
  } else if (tallies && tallies.length > 0 && tallies[0].totalPoints > 0) {
    const mvp = tallies[0];
    parts.push(`👑 Officiële MVP van de wedstrijd: #${mvp.player.number} ${mvp.player.name} (${mvp.player.position}) met ${mvp.totalPoints} punten!`);
  } else {
    parts.push(`🔒 De supportersstemming voor deze wedstrijd is afgerond.`);
  }

  const url = typeof window !== 'undefined' ? window.location.href : '';
  if (url) {
    parts.push(`👉 Stem of volg de uitslag live: ${url}`);
  }
  parts.push(``);
  parts.push(`#KnackVolley #Roeselare #Volleybal #LottoVolleyLeague #MVP #ForzaKnack`);

  return parts.join('\n');
}

export function generateShareText(match: MatchInfo, tallies: PlayerTally[], totalVotes: number): string {
  const top3 = tallies.slice(0, 3);
  const mvp = top3[0];

  let text = `🏐 *MVP VERKIEZING RESULTAAT - ${match.homeTeam.toUpperCase()}* 🏐\n`;
  text += `Locatie: ${match.location}\n`;
  text += `Match: ${match.homeTeam} vs ${match.awayTeam}\n`;
  text += `Aantal uitgebrachte supporterstemmen: ${totalVotes}\n\n`;

  if (mvp && mvp.totalPoints > 0) {
    text += `👑 *OFFICIËLE MATCH MVP (Seizoen ${match.season || '2026-2027'})*:\n`;
    text += `🥇 #${mvp.player.number} ${mvp.player.name} (${mvp.player.position}${mvp.player.isCaptain ? ' - Kapitein' : ''}) - ${mvp.totalPoints} punten!\n\n`;
  }

  text += `📊 *Top 3 Klassement:*\n`;
  top3.forEach((t, i) => {
    const medals = ['🥇', '🥈', '🥉'];
    text += `${medals[i]} #${t.player.number} ${t.player.name}: ${t.totalPoints} ptn (3pt: ${t.votes3pt}x, 2pt: ${t.votes2pt}x, 1pt: ${t.votes1pt}x)\n`;
  });

  text += `\nForza Knack! 💙🤍 Bedankt aan alle supporters voor het stemmen in REO Arena! 👏`;
  return text;
}
