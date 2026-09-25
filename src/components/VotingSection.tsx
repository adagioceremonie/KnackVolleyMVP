import React, { useState, useMemo, useEffect } from 'react';
import { Player, MatchInfo, SupporterVote, VoteChoices } from '../types';
import {
  Trophy,
  Medal,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
  ShieldCheck,
  Hash,
  Clock,
  Timer,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerAvatar } from './PlayerAvatar';
import { generateMatchFacebookShareText, getRemainingTimeUntilMidnight } from '../utils/storage';

interface VotingSectionProps {
  match: MatchInfo;
  players: Player[];
  userVote: SupporterVote | null;
  totalVotesCount: number;
  onCastVote: (vote: {
    supporterNote?: string;
    choices: VoteChoices;
  }) => void;
  onGoToStandings: () => void;
}

export const VotingSection: React.FC<VotingSectionProps> = ({
  match,
  players,
  userVote,
  totalVotesCount,
  onCastVote,
  onGoToStandings,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(() => getRemainingTimeUntilMidnight(match.date));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getRemainingTimeUntilMidnight(match.date));
    }, 1000);
    return () => clearInterval(timer);
  }, [match.date]);

  // Selected player IDs for the 3 awards
  const [first3ptId, setFirst3ptId] = useState<string | null>(null);
  const [second2ptId, setSecond2ptId] = useState<string | null>(null);
  const [third1ptId, setThird1ptId] = useState<string | null>(null);

  const activePlayers = useMemo(() => {
    return players.filter((p) => p.active);
  }, [players]);

  const filteredPlayers = activePlayers;

  const getPlayerById = (id: string | null) => {
    if (!id) return null;
    return players.find((p) => p.id === id) || null;
  };

  const p1 = getPlayerById(first3ptId);
  const p2 = getPlayerById(second2ptId);
  const p3 = getPlayerById(third1ptId);

  // Assign points to player
  const handleAssignPoints = (playerId: string, points: 3 | 2 | 1) => {
    setErrorMsg(null);

    // If player is already selected in another slot, clear that slot
    if (points === 3) {
      if (second2ptId === playerId) setSecond2ptId(null);
      if (third1ptId === playerId) setThird1ptId(null);
      setFirst3ptId(playerId);
    } else if (points === 2) {
      if (first3ptId === playerId) setFirst3ptId(null);
      if (third1ptId === playerId) setThird1ptId(null);
      setSecond2ptId(playerId);
    } else if (points === 1) {
      if (first3ptId === playerId) setFirst3ptId(null);
      if (second2ptId === playerId) setSecond2ptId(null);
      setThird1ptId(playerId);
    }
  };

  const handleClearSlot = (points: 3 | 2 | 1) => {
    if (points === 3) setFirst3ptId(null);
    if (points === 2) setSecond2ptId(null);
    if (points === 1) setThird1ptId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!first3ptId || !second2ptId || !third1ptId) {
      setErrorMsg(
        'Duid respectievelijk een speler aan voor 3 punten, 2 punten én 1 punt uit de officiële spelerskern van Knack Roeselare.'
      );
      return;
    }

    if (
      first3ptId === second2ptId ||
      first3ptId === third1ptId ||
      second2ptId === third1ptId
    ) {
      setErrorMsg('Elke speler kan slechts éénmaal punten ontvangen.');
      return;
    }

    // Cast anonymous vote
    onCastVote({
      choices: {
        first3ptPlayerId: first3ptId,
        second2ptPlayerId: second2ptId,
        third1ptPlayerId: third1ptId,
      },
    });

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#3B82F6', '#10B981', '#ffffff'],
    });
  };

  // If voting is closed (e.g. past midnight) and user hasn't voted yet
  if (!match.isVotingOpen && !userVote) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl">
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Trophy className="w-10 h-10 text-amber-600" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-rose-500/15 text-rose-800 font-bold text-xs px-3.5 py-1.5 rounded-full border border-rose-500/30 mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>De stemronde is afgesloten</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
            Het Officiële Podium is Geafficheerd!
          </h2>
          <p className="text-slate-600 mb-6 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            De stemronde voor {match.homeTeam} vs {match.awayTeam} is om middernacht van de wedstrijddag automatisch afgesloten. De definitieve supporterspunten en het podium met de Speler van de Wedstrijd zijn nu bekend!
          </p>
          <button
            id="btn-closed-go-standings"
            onClick={onGoToStandings}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-7 py-4 rounded-2xl shadow-xl shadow-amber-500/25 transition-transform active:scale-95 text-base cursor-pointer"
          >
            <Trophy className="w-5 h-5" />
            <span>Bekijk het Podium & MVP Uitslag</span>
          </button>
        </div>
      </div>
    );
  }

  // DIRECT FEEDBACK CONFIRMATION: If already voted (Anonymous confirmation receipt)
  if (userVote) {
    const v3 = getPlayerById(userVote.choices.first3ptPlayerId);
    const v2 = getPlayerById(userVote.choices.second2ptPlayerId);
    const v1 = getPlayerById(userVote.choices.third1ptPlayerId);
    const voteTime = new Date(userVote.timestamp).toLocaleTimeString('nl-BE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Instant Feedback Success Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 text-white px-6 py-8 text-center relative overflow-hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Stem succesvol ontvangen!
            </h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-md mx-auto">
              Jouw anonieme stem is veilig geregistreerd en telt officieel mee voor de MVP-verkiezing.
            </p>

            {/* Anonymous Security Receipt Token */}
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-400/30 text-emerald-200 text-xs px-4 py-1.5 rounded-full font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Ontvangstbewijs: <strong>{userVote.receiptCode}</strong></span>
              <span className="text-emerald-400">&bull; {voteTime}</span>
            </div>
          </div>

          {/* Voted Choices Summary */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Jouw Toegekende Punten
                </h3>
                <span className="text-xs text-slate-400">
                  Volledig anoniem opgeslagen. Noch de spelers noch de clubleiding kunnen zien van wie deze stem afkomstig is.
                </span>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {userVote.anonymousId}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 3 Points */}
              <div className="bg-amber-50/90 rounded-2xl p-4 border-2 border-amber-300 relative flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm mb-2">
                  3 pt
                </div>
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                  1ste Plaats (Goud)
                </div>
                {v3 ? (
                  <>
                    <PlayerAvatar player={v3} size="lg" className="mb-2" />
                    <div className="text-lg font-black text-slate-900">
                      #{v3.number} {v3.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {v3.position}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Speler</span>
                )}
              </div>

              {/* 2 Points */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-300 relative flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-sm shadow-sm mb-2">
                  2 pt
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  2de Plaats (Zilver)
                </div>
                {v2 ? (
                  <>
                    <PlayerAvatar player={v2} size="lg" className="mb-2" />
                    <div className="text-lg font-black text-slate-900">
                      #{v2.number} {v2.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {v2.position}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Speler</span>
                )}
              </div>

              {/* 1 Point */}
              <div className="bg-amber-900/5 rounded-2xl p-4 border-2 border-amber-700/30 relative flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-amber-800 text-white font-black flex items-center justify-center text-sm shadow-sm mb-2">
                  1 pt
                </div>
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2">
                  3de Plaats (Brons)
                </div>
                {v1 ? (
                  <>
                    <PlayerAvatar player={v1} size="lg" className="mb-2" />
                    <div className="text-lg font-black text-slate-900">
                      #{v1.number} {v1.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {v1.position}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Speler</span>
                )}
              </div>
            </div>

            {userVote.supporterNote && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-6 text-center text-xs text-slate-600 italic">
                "{userVote.supporterNote}"
              </div>
            )}

            {/* Results Reveal Notification Box */}
            <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200 flex items-start gap-3 mb-6">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <div className="font-bold text-sm mb-0.5">
                  {match.isVotingOpen
                    ? 'Stemresultaten worden onthuld na sluiting'
                    : 'De stemming is gesloten - bekijk nu de uitslag!'}
                </div>
                <div>
                  {match.isVotingOpen
                    ? 'Om beïnvloeding tijdens de wedstrijd te vermijden, zijn de tussenstanden momenteel verzegeld. Zodra de ploegleiding de stemronde sluit, worden de punten en de MVP hier direct in real-time getoond!'
                    : 'De wedstrijdleiding heeft de stemming afgesloten. Je kunt nu direct de real-time uitslag en de podiumceremonie bekijken!'}
                </div>
              </div>
            </div>

            {/* Share on Facebook with Full Match Info */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Nodig andere Knack-supporters uit om ook te stemmen!
              </span>
              <button
                type="button"
                onClick={() => {
                  const shareText = generateMatchFacebookShareText(match);
                  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareText).catch(() => {});
                  }
                  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    currentUrl
                  )}&quote=${encodeURIComponent(shareText)}&hashtag=${encodeURIComponent('#KnackVolley')}`;
                  window.open(fbShareUrl, 'facebook-share', 'width=640,height=600,scrollbars=1');
                }}
                className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Deel match & stemming op Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voting form: User has not voted yet
  const totalChosen = [first3ptId, second2ptId, third1ptId].filter(Boolean).length;
  const isReadyToSubmit =
    totalChosen === 3 &&
    first3ptId !== second2ptId &&
    first3ptId !== third1ptId &&
    second2ptId !== third1ptId;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        {/* Step 1: Selected Podium Slots (3pt, 2pt, 1pt) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-black">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Jouw 3, 2 en 1 punten toewijzing
              </h3>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
              Aangeduid: <span className="font-bold text-slate-900">{totalChosen}/3 spelers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Slot 3 PUNTEN */}
            <div
              className={`rounded-2xl p-4 transition-all relative border-2 ${
                p1
                  ? 'bg-gradient-to-b from-amber-50 to-amber-100/60 border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-slate-50/80 border-dashed border-slate-300 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                    3
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
                      3 Punten
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Beste speler (Goud)</span>
                  </div>
                </div>
                {p1 && (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(3)}
                    className="text-xs font-medium text-slate-400 hover:text-rose-600 px-2 py-1 rounded bg-white/80 hover:bg-white transition-colors"
                  >
                    Wissen
                  </button>
                )}
              </div>

              {p1 ? (
                <div className="bg-white rounded-xl p-3 border border-amber-200 flex items-center gap-3">
                  <PlayerAvatar player={p1} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-base truncate">
                      {p1.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {p1.position}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center flex items-center justify-center min-h-[72px]">
                  <Trophy className="w-7 h-7 text-amber-400/50" />
                </div>
              )}
            </div>

            {/* Slot 2 PUNTEN */}
            <div
              className={`rounded-2xl p-4 transition-all relative border-2 ${
                p2
                  ? 'bg-gradient-to-b from-slate-50 to-slate-100 border-slate-400 shadow-md'
                  : 'bg-slate-50/80 border-dashed border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                    2
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      2 Punten
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">2de beste speler (Zilver)</span>
                  </div>
                </div>
                {p2 && (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(2)}
                    className="text-xs font-medium text-slate-400 hover:text-rose-600 px-2 py-1 rounded bg-white/80 hover:bg-white transition-colors"
                  >
                    Wissen
                  </button>
                )}
              </div>

              {p2 ? (
                <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                  <PlayerAvatar player={p2} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-base truncate">
                      {p2.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {p2.position}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center flex items-center justify-center min-h-[72px]">
                  <Medal className="w-7 h-7 text-slate-400/50" />
                </div>
              )}
            </div>

            {/* Slot 1 PUNT */}
            <div
              className={`rounded-2xl p-4 transition-all relative border-2 ${
                p3
                  ? 'bg-gradient-to-b from-amber-900/5 to-amber-900/10 border-amber-600/40 shadow-md'
                  : 'bg-slate-50/80 border-dashed border-slate-300 hover:border-amber-600/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-sm">
                    1
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                      1 Punt
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">3de beste speler (Brons)</span>
                  </div>
                </div>
                {p3 && (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(1)}
                    className="text-xs font-medium text-slate-400 hover:text-rose-600 px-2 py-1 rounded bg-white/80 hover:bg-white transition-colors"
                  >
                    Wissen
                  </button>
                )}
              </div>

              {p3 ? (
                <div className="bg-white rounded-xl p-3 border border-amber-700/20 flex items-center gap-3">
                  <PlayerAvatar player={p3} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-base truncate">
                      {p3.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {p3.position}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center flex items-center justify-center min-h-[72px]">
                  <Award className="w-7 h-7 text-amber-700/50" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Spelerslijst (Official Squad Roster) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-black">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Klik bij de gewenste speler op +3 pt, +2 pt of +1 pt
              </h3>
            </div>
          </div>

          {/* Player Grid from Official Roster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPlayers.map((player) => {
              const assignedPoints =
                first3ptId === player.id
                  ? 3
                  : second2ptId === player.id
                  ? 2
                  : third1ptId === player.id
                  ? 1
                  : null;

              return (
                <div
                  key={player.id}
                  id={`player-card-${player.id}`}
                  className={`rounded-2xl p-4 border transition-all ${
                    assignedPoints
                      ? assignedPoints === 3
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                        : assignedPoints === 2
                        ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300'
                        : 'bg-amber-900/10 border-amber-600 ring-2 ring-amber-600/30'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Player photo / avatar with number badge */}
                    <PlayerAvatar player={player} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {player.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {player.position}
                      </div>
                    </div>
                  </div>

                  {/* Quick assign action buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    {assignedPoints ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-white/90 px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                          {assignedPoints === 3 && '🥇 3 Punten toegekend'}
                          {assignedPoints === 2 && '🥈 2 Punten toegekend'}
                          {assignedPoints === 1 && '🥉 1 Punt toegekend'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearSlot(assignedPoints)}
                          className="text-xs font-semibold text-rose-600 hover:underline px-2 py-1"
                        >
                          Verwijder
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 w-full">
                        <button
                          type="button"
                          id={`btn-give-3-${player.id}`}
                          onClick={() => handleAssignPoints(player.id, 3)}
                          className="text-xs font-bold py-1.5 rounded-lg bg-amber-100 hover:bg-amber-400 text-amber-950 hover:text-slate-950 transition-colors border border-amber-300 cursor-pointer"
                          title="Ken 3 punten toe aan deze speler"
                        >
                          +3 pt
                        </button>
                        <button
                          type="button"
                          id={`btn-give-2-${player.id}`}
                          onClick={() => handleAssignPoints(player.id, 2)}
                          className="text-xs font-bold py-1.5 rounded-lg bg-slate-100 hover:bg-slate-300 text-slate-800 hover:text-slate-950 transition-colors border border-slate-300 cursor-pointer"
                          title="Ken 2 punten toe aan deze speler"
                        >
                          +2 pt
                        </button>
                        <button
                          type="button"
                          id={`btn-give-1-${player.id}`}
                          onClick={() => handleAssignPoints(player.id, 1)}
                          className="text-xs font-bold py-1.5 rounded-lg bg-amber-900/10 hover:bg-amber-800 hover:text-white text-amber-900 transition-colors border border-amber-700/20 cursor-pointer"
                          title="Ken 1 punt toe aan deze speler"
                        >
                          +1 pt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Errors */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Bar with Direct Feedback Guidance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xl sticky bottom-4 z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            {isReadyToSubmit ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Klaar! Klik op 'Bevestig & verstuur je anonieme stem' voor je digitale ontvangstbevestiging.
              </span>
            ) : (
              <span>
                Nog aan te duiden:{' '}
                <strong>
                  {!first3ptId && '3 punten speler, '}
                  {!second2ptId && '2 punten speler, '}
                  {!third1ptId && '1 punt speler'}
                </strong>
              </span>
            )}
          </div>

          <button
            type="submit"
            id="btn-submit-ballot"
            disabled={!isReadyToSubmit}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-base transition-all shadow-md ${
              isReadyToSubmit
                ? 'bg-gradient-to-r from-[#003B7A] via-[#004B9B] to-[#0A2550] hover:from-[#004B9B] hover:to-[#002D60] text-white shadow-blue-900/30 active:scale-95 cursor-pointer ring-2 ring-blue-400/40'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${isReadyToSubmit ? 'text-blue-200' : 'text-slate-400'}`} />
            <span>Bevestig & verstuur je anonieme stem</span>
          </button>
        </div>
      </form>
    </div>
  );
};
