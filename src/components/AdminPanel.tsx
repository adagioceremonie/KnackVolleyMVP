import React, { useState, useEffect } from 'react';
import { MatchInfo, Player, SupporterVote, VolleyballPosition } from '../types';
import { PlayerAdmin } from './PlayerAdmin';
import { PointsOverviewAdmin } from './PointsOverviewAdmin';
import {
  Settings2,
  Lock,
  Unlock,
  Save,
  RotateCcw,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  MapPin,
  Trophy,
  KeyRound,
  ShieldCheck,
  Timer,
  Clock,
  LogOut,
  Eye,
  Activity,
  PlusCircle,
  X,
  Award,
} from 'lucide-react';
import { getAdminPassword, saveAdminPassword, parseMatchDateTime, getRemainingTimeUntilMidnight } from '../utils/storage';

interface AdminPanelProps {
  match: MatchInfo;
  matches?: MatchInfo[];
  players: Player[];
  votes?: SupporterVote[];
  initialSubTab?: 'players' | 'match' | 'points';
  totalVotesCount?: number;
  onUpdateMatch: (match: MatchInfo) => void;
  onUpdatePlayers: (players: Player[]) => void;
  onResetAllVotes: () => void;
  onResetPageViews?: () => void;
  onStartNewMatch?: (newMatchData: Partial<MatchInfo>) => void;
  onClearAllMatches?: () => void;
  onAddSampleVotes: () => void;
  onRestoreDefaults: () => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  match,
  matches = [match],
  players,
  votes = [],
  initialSubTab = 'players',
  totalVotesCount = 0,
  onUpdateMatch,
  onUpdatePlayers,
  onResetAllVotes,
  onResetPageViews,
  onStartNewMatch,
  onClearAllMatches,
  onAddSampleVotes,
  onRestoreDefaults,
  onLogout,
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'players' | 'match' | 'points'>(initialSubTab);

  // Local edit states for match
  const [homeTeam, setHomeTeam] = useState(match.homeTeam);
  const [awayTeam, setAwayTeam] = useState(match.awayTeam);
  const [finalScore, setFinalScore] = useState(match.finalScore);
  const [setScoresStr, setSetScoresStr] = useState(match.setScores.join(', '));
  const initialDateTime = parseMatchDateTime(match.date, match.time);
  const [date, setDate] = useState(initialDateTime.date);
  const [time, setTime] = useState(initialDateTime.time);
  const [location, setLocation] = useState(match.location);
  const [competition, setCompetition] = useState(match.competition || 'Lotto Volley League Heren');
  const [savedMatchSuccess, setSavedMatchSuccess] = useState(false);

  // New Match Modal state
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState(false);
  const [newAwayTeam, setNewAwayTeam] = useState('Volley Haasrode Leuven');
  const [newDate, setNewDate] = useState('Zaterdag 10 oktober 2026');
  const [newTime, setNewTime] = useState('20:30');
  const [newLocation, setNewLocation] = useState('REO Arena, Roeselare');
  const [newCompetition, setNewCompetition] = useState('Lotto Volley League Heren');
  const [counterResetSuccess, setCounterResetSuccess] = useState(false);

  // Admin Password Management State
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(() => getRemainingTimeUntilMidnight(match.date));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getRemainingTimeUntilMidnight(match.date));
    }, 1000);
    return () => clearInterval(timer);
  }, [match.date]);

  const handleToggleAutoCloseMidnight = () => {
    onUpdateMatch({
      ...match,
      autoCloseMidnight: match.autoCloseMidnight === false ? true : false,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 3) {
      setPasswordChangeError('Het nieuwe paswoord moet minstens 3 tekens bevatten.');
      return;
    }
    saveAdminPassword(newAdminPassword.trim());
    setNewAdminPassword('');
    setPasswordChangeError(null);
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 4000);
  };

  const handleSaveMatchInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSets = setScoresStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateMatch({
      ...match,
      homeTeam,
      awayTeam,
      finalScore,
      setScores: parsedSets,
      date,
      time,
      location,
      competition,
    });

    setSavedMatchSuccess(true);
    setTimeout(() => setSavedMatchSuccess(false), 3000);
  };

  const handleToggleVotingStatus = () => {
    onUpdateMatch({
      ...match,
      isVotingOpen: !match.isVotingOpen,
    });
  };

  const handleResetCounter = () => {
    if (
      window.confirm(
        'Weet je zeker dat je de teller van het aantal geopende stempagina\'s voor deze wedstrijd op 0 wilt zetten?'
      )
    ) {
      if (onResetPageViews) {
        onResetPageViews();
      } else {
        onUpdateMatch({
          ...match,
          votingPageViews: 0,
        });
      }
      setCounterResetSuccess(true);
      setTimeout(() => setCounterResetSuccess(false), 3500);
    }
  };

  const handleStartNewMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onStartNewMatch) {
      onStartNewMatch({
        awayTeam: newAwayTeam,
        date: newDate,
        time: newTime,
        location: newLocation,
        competition: newCompetition,
        finalScore: '',
        setScores: [],
        isVotingOpen: true,
        mvpAnnounced: false,
        closedAtMidnight: false,
        votingPageViews: 0,
      });
    } else {
      onUpdateMatch({
        ...match,
        id: `match-knack-${Date.now()}`,
        awayTeam: newAwayTeam,
        date: newDate,
        time: newTime,
        location: newLocation,
        competition: newCompetition,
        finalScore: '',
        setScores: [],
        isVotingOpen: true,
        mvpAnnounced: false,
        closedAtMidnight: false,
        votingPageViews: 0,
      });
      if (onResetPageViews) onResetPageViews();
      onResetAllVotes();
    }

    setAwayTeam(newAwayTeam);
    setDate(newDate);
    setTime(newTime);
    setLocation(newLocation);
    setCompetition(newCompetition);
    setFinalScore('');
    setSetScoresStr('');
    setIsNewMatchModalOpen(false);
    setCounterResetSuccess(true);
    setTimeout(() => setCounterResetSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Admin Sub-navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Beheerderspaneel
            </h2>
            <p className="text-xs text-slate-500">
              Beheer de selectie van {match.homeTeam}, wedstrijduitslagen en stemronde.
            </p>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
          <button
            id="subtab-players"
            type="button"
            onClick={() => setAdminSubTab('players')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === 'players'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Spelerslijst Beheren ({players.length})</span>
          </button>

          <button
            id="subtab-match"
            type="button"
            onClick={() => setAdminSubTab('match')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === 'match'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-slate-700" />
            <span>Wedstrijd & Stemronde</span>
          </button>

          <button
            id="subtab-points"
            type="button"
            onClick={() => setAdminSubTab('points')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              adminSubTab === 'points'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Puntenklassement & Export</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Dedicated Player Roster Manager */}
      {adminSubTab === 'players' && (
        <PlayerAdmin
          players={players}
          onUpdatePlayers={onUpdatePlayers}
          homeTeamName={match.homeTeam}
        />
      )}

      {/* SUB-TAB 2: Match info & Voting Controls */}
      {adminSubTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Wedstrijdgegevens
                  </h3>
                  {savedMatchSuccess && (
                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Opgeslagen!
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewMatchModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Aanvang Nieuwe Wedstrijd</span>
                </button>
              </div>

              <form onSubmit={handleSaveMatchInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Thuisploeg
                    </label>
                    <input
                      type="text"
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Uitploeg
                    </label>
                    <input
                      type="text"
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Wedstrijddatum
                    </label>
                    <input
                      type="text"
                      placeholder="Bv. Zaterdag 26 september 2026"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Aanvangsuur
                    </label>
                    <input
                      type="text"
                      placeholder="Bv. 20:30"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Sporthal / Zaal
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Competitie / Reeks
                    </label>
                    <input
                      type="text"
                      value={competition}
                      onChange={(e) => setCompetition(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Wedstrijd Opslaan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Col: Quick Actions & Status */}
          <div className="space-y-6">
            {/* Live Teller Stempagina Geopend Card */}
            <div className="bg-gradient-to-br from-[#071C3D] via-[#003B7A] to-[#0A2550] text-white rounded-3xl p-6 shadow-md border-2 border-blue-900/40 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/25">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tight">
                      Teller Stempagina
                    </h3>
                    <p className="text-[11px] text-blue-200">
                      Aantal keer geopend deze match
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Live</span>
                </span>
              </div>

              {/* Big Digital Counter Display */}
              <div className="bg-black/35 rounded-2xl p-4 border border-white/10 my-3 text-center">
                <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight">
                  {match.votingPageViews ?? 0}
                </div>
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mt-1">
                  {(match.votingPageViews ?? 0) === 1 ? 'keer geopend' : 'keren geopend'}
                </div>
                <div className="text-[11px] text-amber-200/80 font-medium mt-1 truncate">
                  {match.homeTeam} vs {match.awayTeam}
                </div>
              </div>

              {/* Conversion & Breakdown Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                  <span className="text-blue-200 block text-[10px]">Uitgebrachte stemmen</span>
                  <span className="text-sm font-black text-white font-mono">{totalVotesCount ?? 0}</span>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                  <span className="text-blue-200 block text-[10px]">Conversiegraad</span>
                  <span className="text-sm font-black text-white font-mono">
                    {(match.votingPageViews ?? 0) > 0
                      ? `${Math.min(100, Math.round(((totalVotesCount ?? 0) / (match.votingPageViews || 1)) * 100))}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* Context Note */}
              <p className="text-[11px] text-blue-200/90 mt-3 leading-relaxed bg-blue-900/40 p-2.5 rounded-xl border border-blue-800/60">
                ℹ️ Houdt bij hoe vaak de stempagina door supporters geopend is. <strong>Bij aanvang van een nieuwe wedstrijd wordt deze teller automatisch op nul gezet.</strong>
              </p>

              {counterResetSuccess && (
                <div className="text-emerald-300 text-xs font-bold flex items-center gap-1.5 mt-2 bg-emerald-950/60 p-2 rounded-xl border border-emerald-500/40 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Paginateller succesvol op 0 gezet!</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/15">
                <button
                  type="button"
                  onClick={handleResetCounter}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Zet stempagina-teller op 0 voor deze match"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zet teller op 0</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewMatchModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-amber-400/20 cursor-pointer"
                  title="Start direct een nieuwe wedstrijd en reset teller"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nieuwe Match</span>
                </button>
              </div>
            </div>

            {/* Voting Switch */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Stemronde Status
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Open de stemming na het laatste fluitsignaal en sluit wanneer de MVP wordt uitgereikt.
              </p>

              <button
                onClick={handleToggleVotingStatus}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  match.isVotingOpen
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                {match.isVotingOpen ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sluit Stemming & Onthul MVP Handmatig</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Open Stemming voor Supporters</span>
                  </>
                )}
              </button>
            </div>

            {/* Automatic Midnight Close Settings Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Automatisch Afsluiten om Middernacht
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    match.autoCloseMidnight !== false
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {match.autoCloseMidnight !== false ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Sluit automatisch de stemming af om <strong>00:00u</strong> aan het einde van de wedstrijddag (<strong>{match.date || 'wedstrijddag'}</strong>) en afficheert direct het podium.
              </p>

              {match.autoCloseMidnight !== false && countdown && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {countdown.isPast
                        ? 'Middernacht is reeds verstreken (stemming gesloten)'
                        : 'Tijd tot middernacht:'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-amber-700 text-sm">
                    {countdown.formatted}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleAutoCloseMidnight}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {match.autoCloseMidnight !== false
                  ? 'Automatische middernacht-sluiting pauzeren'
                  : 'Automatische middernacht-sluiting activeren'}
              </button>
            </div>

            {/* Administrator Beveiliging & Paswoord */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#003B7A]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Administrator Beveiliging
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Actief
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Beheer het paswoord waarmee de delen <strong>Spelerskern</strong> en <strong>Beheer</strong> worden afgeschermd van supporters.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <label
                    htmlFor="change-admin-password-input"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Nieuw Paswoord Instellen
                  </label>
                  <input
                    id="change-admin-password-input"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => {
                      setNewAdminPassword(e.target.value);
                      setPasswordChangeError(null);
                    }}
                    placeholder="********"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#003B7A] outline-none font-medium"
                  />
                  {passwordChangeError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">
                      {passwordChangeError}
                    </p>
                  )}
                  {passwordChangeSuccess && (
                    <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paswoord succesvol gewijzigd!
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#003B7A] hover:bg-[#0A2550] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Paswoord Opslaan
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Modules direct vergrendelen"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Vergrendel</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Demo & Reset Tools */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Onderhoud & Testen
              </h3>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={onAddSampleVotes}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Genereer 3 Voorbeeldstemmen</span>
                  </div>
                  <span className="text-slate-400">+3</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Weet je zeker dat je alle uitgebrachte stemmen én de teller van geopende stempagina\'s wilt wissen voor een nieuwe wedstrijd? De stand en de paginateller worden beiden op 0 gezet.'
                      )
                    ) {
                      onResetAllVotes();
                      if (onResetPageViews) onResetPageViews();
                      setCounterResetSuccess(true);
                      setTimeout(() => setCounterResetSuccess(false), 3500);
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Wis Stemmen & Reset Teller (Nieuwe Match)</span>
                  </div>
                  <span className="text-rose-500 text-[10px] font-bold">Alles 0</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Weet je zeker dat je alle wedstrijden wilt verwijderen uit de database? Alle gekoppelde stemmen en matchrecords worden gewist.'
                      )
                    ) {
                      if (onClearAllMatches) {
                        onClearAllMatches();
                      } else {
                        onResetAllVotes();
                      }
                      if (onResetPageViews) onResetPageViews();
                      setAwayTeam('');
                      setDate('');
                      setTime('');
                      setFinalScore('');
                      setSetScoresStr('');
                      setCounterResetSuccess(true);
                      setTimeout(() => setCounterResetSuccess(false), 3500);
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-700 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-red-600" />
                    <span>Verwijder Alle Wedstrijden</span>
                  </div>
                  <span className="text-red-500 text-[10px] font-bold">Leegmaken</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCounter}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Zet Alleen Paginateller op 0</span>
                  </div>
                  <span className="text-amber-700 font-mono text-[11px] font-bold">Teller = 0</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Standaard ploeg en match opnieuw instellen (zonder voorbeeldstemmen)?'
                      )
                    ) {
                      onRestoreDefaults();
                      if (onResetPageViews) onResetPageViews();
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>Herstel Fabrieksinstellingen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Puntenklassement & Export (Per wedstrijd & alle wedstrijden tezamen) */}
      {adminSubTab === 'points' && (
        <PointsOverviewAdmin
          players={players}
          matches={matches}
          votes={votes}
          currentMatch={match}
          onSelectActiveMatch={onUpdateMatch}
        />
      )}

      {/* Modal: Aanvang Nieuwe Wedstrijd */}
      {isNewMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsNewMatchModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Aanvang Nieuwe Wedstrijd
                </h3>
                <p className="text-xs text-slate-500">
                  Configureer de volgende match & zet teller op 0
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-5 text-xs text-amber-900 leading-relaxed">
              <strong>ℹ️ Automatische reset:</strong> Bij aanvang van deze nieuwe wedstrijd wordt de teller van het aantal geopende stempagina's automatisch op <strong>nul</strong> gezet en worden voorgaande stemmen gewist voor een schone start.
            </div>

            <form onSubmit={handleStartNewMatchSubmit} className="space-y-4">
              {/* Quick opponent chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Snelle keuze tegenstander:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Decospan Volley Team Menen',
                    'Greenyard Maaseik',
                    'Lindemans Aalst',
                    'Tectum Achel',
                    'Volley Haasrode Leuven',
                    'Caruur Volley Gent',
                    'Waremme Volley',
                    'Guibertin Volley',
                  ].map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setNewAwayTeam(team)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                        newAwayTeam === team
                          ? 'bg-[#003B7A] text-white shadow-sm font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium'
                      }`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uitploeg / Tegenstander
                </label>
                <input
                  type="text"
                  required
                  value={newAwayTeam}
                  onChange={(e) => setNewAwayTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wedstrijddatum
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bv. Zaterdag 3 oktober 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aanvangsuur
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bv. 20:30"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sporthal / Zaal
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Competitie
                  </label>
                  <input
                    type="text"
                    value={newCompetition}
                    onChange={(e) => setNewCompetition(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewMatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#003B7A] to-[#0A2550] hover:brightness-110 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Start Nieuwe Wedstrijd (Reset Teller)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

