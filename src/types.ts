export type VolleyballPosition =
  | 'Receptie-hoek'
  | 'Spelverdeler'
  | 'Middenblokker'
  | 'Hoofdaanvaller'
  | 'Libero'
  | 'Passer-Loper'
  | 'Universeel';

export type PlaceholderStyleId =
  | 'blue_number' // Klassiek Knack Blauw met rugnummer
  | 'silhouette_navy' // Knack Volley Club Silhouet
  | 'jersey_stripes' // Knack Uitrusting / Jersey Vector
  | 'action_spike' // Dynamische Smash Actie Silhouet
  | 'golden_mvp' // Gouden MVP Laureaat
  | 'custom_uploaded'; // Door beheerder geüploade custom afbeelding

export interface PlaceholderConfig {
  style: PlaceholderStyleId;
  customImageDataUrl?: string | null;
  customImageName?: string | null;
}

export interface Player {
  id: string;
  number: number;
  name: string;
  position: VolleyballPosition;
  active: boolean;
  photoUrl?: string;
  customPlaceholderStyle?: PlaceholderStyleId;
  avatarColor?: string;
  isCaptain?: boolean;
  nationality?: string;
}

export interface MatchInfo {
  id: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: string; // e.g. "3 - 1"
  setScores: string[]; // e.g. ["25-22", "23-25", "25-19", "25-21"]
  date: string;
  time?: string;
  location: string;
  competition: string;
  season: string;
  isVotingOpen: boolean;
  mvpAnnounced: boolean;
  autoCloseMidnight?: boolean; // Defaults to true: automatically close voting at midnight of match day & reveal podium
  closedAtMidnight?: boolean; // Set to true when auto-closed at midnight
  votingPageViews?: number; // Aantal keer de stempagina geopend werd voor deze wedstrijd
}

export interface VoteChoices {
  first3ptPlayerId: string; // 3 points
  second2ptPlayerId: string; // 2 points
  third1ptPlayerId: string; // 1 point
}

export interface SupporterVote {
  id: string;
  matchId: string;
  anonymousId: string; // e.g. "Supporter #12"
  receiptCode: string; // e.g. "MVP-4F8A-92"
  voterDeviceId: string; // hashed/stored locally for 1-vote prevention
  timestamp: number;
  choices: VoteChoices;
  supporterNote?: string;
}

export interface PlayerTally {
  player: Player;
  totalPoints: number;
  votes3pt: number;
  votes2pt: number;
  votes1pt: number;
  totalBallots: number; // how many ballots mentioned this player
  rank: number;
}

export interface PlayerSeasonStats {
  player: Player;
  totalPoints: number;
  matchesVoted: number;
  votes3pt: number;
  votes2pt: number;
  votes1pt: number;
  totalBallots: number;
  mvpCount: number;
  pointsPerMatch: Record<string, number>; // matchId -> total points in that match
  rank: number;
}

export type ActiveTab = 'vote' | 'standings' | 'players' | 'votes-list' | 'admin';
