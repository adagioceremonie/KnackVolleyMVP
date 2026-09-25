import React, { useState, useMemo } from 'react';
import { Player, MatchInfo, SupporterVote } from '../types';
import {
  calculateSeasonStats,
  calculateTallies,
  exportSeasonPointsCSV,
  exportMatchPointsCSV,
  generatePointsReportText,
} from '../utils/storage';
import { PlayerAvatar } from './PlayerAvatar';
import {
  Trophy,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Calendar,
  Layers,
  Award,
  Users,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Star,
  Medal,
} from 'lucide-react';

interface PointsOverviewAdminProps {
  players: Player[];
  matches: MatchInfo[];
  votes: SupporterVote[];
  currentMatch: MatchInfo;
  onSelectActiveMatch?: (match: MatchInfo) => void;
}

export const PointsOverviewAdmin: React.FC<PointsOverviewAdminProps> = ({
  players,
  matches,
  votes,
  currentMatch,
  onSelectActiveMatch,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(currentMatch.id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [copiedType, setCopiedType] = useState<'season' | 'match' | null>(null);

  // Ensure unique list of matches (fallback to currentMatch if empty)
  const uniqueMatches = useMemo(() => {
    const list = matches && matches.length > 0 ? [...matches] : [currentMatch];
    const map = new Map<string, MatchInfo>();
    list.forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    if (!map.has(currentMatch.id)) {
      map.set(currentMatch.id, currentMatch);
    }
    return Array.from(map.values());
  }, [matches, currentMatch]);

  // The active single match selected in the dropdown
  const selectedMatch = useMemo(() => {
    return uniqueMatches.find((m) => m.id === selectedMatchId) || currentMatch;
  }, [uniqueMatches, selectedMatchId, currentMatch]);

  // Tallies for the selected single match
  const matchTallies = useMemo(() => {
    return calculateTallies(players, votes, selectedMatch.id);
  }, [players, votes, selectedMatch.id]);

  // Votes for selected single match
  const selectedMatchVotes = useMemo(() => {
    return votes.filter((v) => v.matchId === selectedMatch.id);
  }, [votes, selectedMatch.id]);

  // Season stats across all matches
  const seasonStats = useMemo(() => {
    return calculateSeasonStats(players, votes, uniqueMatches);
  }, [players, votes, uniqueMatches]);

  // Filtered lists based on search and position
  const filteredSeasonStats = useMemo(() => {
    return seasonStats.filter((s) => {
      const matchSearch =
        s.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.player.number.toString().includes(searchQuery);
      const matchPos = positionFilter === 'all' || s.player.position === positionFilter;
      return matchSearch && matchPos;
    });
  }, [seasonStats, searchQuery, positionFilter]);

  const filteredMatchTallies = useMemo(() => {
    return matchTallies.filter((t) => {
      const matchSearch =
        t.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.player.number.toString().includes(searchQuery);
      const matchPos = positionFilter === 'all' || t.player.position === positionFilter;
      return matchSearch && matchPos;
    });
  }, [matchTallies, searchQuery, positionFilter]);

  // Total points given out overall
  const totalSeasonPoints = useMemo(() => {
    return seasonStats.reduce((acc, s) => acc + s.totalPoints, 0);
  }, [seasonStats]);

  // Total points given out in selected match
  const totalMatchPoints = useMemo(() => {
    return matchTallies.reduce((acc, t) => acc + t.totalPoints, 0);
  }, [matchTallies]);

  // Top player in season
  const seasonLeader = seasonStats.length > 0 && seasonStats[0].totalPoints > 0 ? seasonStats[0] : null;

  // Top player in selected match
  const matchLeader = matchTallies.length > 0 && matchTallies[0].totalPoints > 0 ? matchTallies[0] : null;

  const handleCopyText = (type: 'season' | 'match') => {
    const text =
      type === 'season'
        ? generatePointsReportText('season', seasonStats, uniqueMatches)
        : generatePointsReportText('match', seasonStats, uniqueMatches, selectedMatch, matchTallies);

    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleExportSeasonCSV = () => {
    exportSeasonPointsCSV(seasonStats, uniqueMatches);
  };

  const handleExportMatchCSV = () => {
    exportMatchPointsCSV(matchTallies, selectedMatch);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Puntenklassement & Export
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-extrabold border border-blue-200">
                  Beheersluik
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Raadpleeg en exporteer de volledige puntentotalen per wedstrijd of over alle wedstrijden tezamen.
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-[#003B7A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Alle Wedstrijden Tezamen ({uniqueMatches.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-[#003B7A] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Per Wedstrijd</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights / Key Performance Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {viewMode === 'all' ? 'Totaal Punten Seizoen' : 'Totaal Punten Match'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {viewMode === 'all' ? totalSeasonPoints : totalMatchPoints}
              </span>
              <span className="text-xs font-semibold text-slate-500">ptn</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {viewMode === 'all'
                ? `Verdeeld over ${votes.length} stemmen`
                : `${selectedMatchVotes.length} stemmen voor deze match`}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {viewMode === 'all' ? 'Geregistreerde Matchen' : 'Geselecteerde Match'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {viewMode === 'all' ? uniqueMatches.length : '1'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {viewMode === 'all' ? 'matchen' : 'actief'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block truncate">
              {viewMode === 'all'
                ? `${players.length} spelers in selectie`
                : `${selectedMatch.homeTeam} ${selectedMatch.awayTeam ? `vs ${selectedMatch.awayTeam}` : '(Nieuwe match)'}`}
            </span>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-600" />
              {viewMode === 'all' ? 'Seizoensleider' : 'Match MVP Winnaar'}
            </span>
            {viewMode === 'all' ? (
              seasonLeader ? (
                <div>
                  <div className="text-sm font-black text-amber-950 truncate">
                    #{seasonLeader.player.number} {seasonLeader.player.name}
                  </div>
                  <span className="text-xs font-bold text-amber-700">
                    {seasonLeader.totalPoints} ptn ({seasonLeader.mvpCount}x MVP)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-amber-700 italic">Nog geen punten</span>
              )
            ) : matchLeader ? (
              <div>
                <div className="text-sm font-black text-amber-950 truncate">
                  #{matchLeader.player.number} {matchLeader.player.name}
                </div>
                <span className="text-xs font-bold text-amber-700">
                  {matchLeader.totalPoints} ptn (Goud: {matchLeader.votes3pt}x)
                </span>
              </div>
            ) : (
              <span className="text-xs text-amber-700 italic">Nog geen stemmen</span>
            )}
          </div>

          <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#003B7A]" />
              Stemverdeling (3-2-1)
            </span>
            <div className="text-xs font-bold text-slate-800 space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-700 font-semibold">3pt (Goud):</span>
                <span className="font-bold">
                  {viewMode === 'all'
                    ? seasonStats.reduce((acc, s) => acc + s.votes3pt, 0)
                    : matchTallies.reduce((acc, t) => acc + t.votes3pt, 0)}
                  x
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-semibold">2pt (Zilver):</span>
                <span className="font-bold">
                  {viewMode === 'all'
                    ? seasonStats.reduce((acc, s) => acc + s.votes2pt, 0)
                    : matchTallies.reduce((acc, t) => acc + t.votes2pt, 0)}
                  x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATCH SELECTOR & CONTEXT BAR (Only in 'single' match mode) */}
      {viewMode === 'single' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Selecteer Wedstrijd:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMatch.id}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-[#003B7A] focus:outline-none cursor-pointer"
                >
                  {uniqueMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam}{m.awayTeam ? ` vs ${m.awayTeam}` : ' (Nieuwe wedstrijd)'} — {m.date || 'Geen datum'}{' '}
                      {m.id === currentMatch.id ? '(Huidig Actief)' : ''}
                    </option>
                  ))}
                </select>
                {onSelectActiveMatch && selectedMatch.id !== currentMatch.id && (
                  <button
                    type="button"
                    onClick={() => onSelectActiveMatch(selectedMatch)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#003B7A] rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                  >
                    Maak Actieve Match
                  </button>
                )}
              </div>
            </div>

            {/* Match summary pill */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Uitslag</span>
                <span className="font-black text-slate-900">
                  {selectedMatch.finalScore || 'Nog niet gespeeld'}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Datum & Zaal</span>
                <span className="font-bold text-slate-800">
                  {selectedMatch.date || 'Onbekend'} • {selectedMatch.location || 'REO Arena'}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Stemmen</span>
                <span className="font-black text-blue-900">{selectedMatchVotes.length}</span>
              </div>
            </div>
          </div>

          {/* Quick match selector buttons if multiple matches exist */}
          {uniqueMatches.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 self-center mr-1">
                Snelle keuze:
              </span>
              {uniqueMatches.map((m) => {
                const isSelected = m.id === selectedMatch.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMatchId(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#003B7A] text-white font-bold shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium'
                    }`}
                  >
                    vs {m.awayTeam.replace('Volley', '').replace('Team', '').trim()}{' '}
                    <span className="opacity-70 text-[10px]">({m.date?.split(' ')[0] || 'Match'})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FILTER & EXPORT ACTION TOOLBAR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search and Position Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Zoek speler op naam of nummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003B7A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#003B7A] cursor-pointer"
              >
                <option value="all">Alle Posities</option>
                <option value="Receptie-hoek">Receptie-hoek</option>
                <option value="Spelverdeler">Spelverdeler</option>
                <option value="Middenblokker">Middenblokker</option>
                <option value="Hoofdaanvaller">Hoofdaanvaller</option>
                <option value="Libero">Libero</option>
                <option value="Passer-Loper">Passer-Loper</option>
                <option value="Universeel">Universeel</option>
              </select>
            </div>
          </div>

          {/* Export & Copy Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'all' ? (
              <>
                <button
                  type="button"
                  onClick={handleExportSeasonCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#003B7A] hover:bg-[#002D5E] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  title="Download CSV bestand met alle seizoenstotalen en per match totalen"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Exporteer Seizoen CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText('season')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  title="Kopieer samenvatting naar klembord voor WhatsApp / e-mail"
                >
                  {copiedType === 'season' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Gekopieerd!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Kopieer Tekst</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleExportMatchCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#003B7A] hover:bg-[#002D5E] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  title={`Download CSV bestand van ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Exporteer Match CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText('match')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  title="Kopieer match uitslag naar klembord"
                >
                  {copiedType === 'match' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Gekopieerd!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Kopieer Tekst</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info tip */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
          <span>
            Puntentelling: <strong>1e keuze = 3 ptn (Goud)</strong> •{' '}
            <strong>2e keuze = 2 ptn (Zilver)</strong> •{' '}
            <strong>3e keuze = 1 pt (Brons)</strong>
          </span>
          <span className="font-semibold text-slate-600">
            {viewMode === 'all'
              ? `${filteredSeasonStats.length} spelers weergegeven`
              : `${filteredMatchTallies.length} spelers weergegeven`}
          </span>
        </div>
      </div>

      {/* TABLE VIEW: ALL MATCHES COMBINED (Season Matrix) */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Volledige Lijst — Puntentotaal Alle Wedstrijden Tezamen
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                {uniqueMatches.length} Wedstrijden
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 text-center w-12">Rang</th>
                  <th className="py-3 px-4 w-12">Nr.</th>
                  <th className="py-3 px-4 min-w-[180px]">Speler</th>
                  <th className="py-3 px-4">Positie</th>
                  {uniqueMatches.map((m) => (
                    <th
                      key={m.id}
                      className="py-3 px-3 text-center min-w-[90px] max-w-[120px] bg-slate-200/40 text-[9px]"
                      title={`Match ${m.awayTeam ? `vs ${m.awayTeam}` : ''} (${m.date || ''})`}
                    >
                      <div className="truncate font-black text-slate-800">
                        {m.awayTeam ? `vs ${m.awayTeam.replace('Volley', '').replace('Team', '').trim()}` : 'Match'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-normal">
                        {m.date ? m.date.split(' ')[0] : 'Match'}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center bg-blue-50/80 text-[#003B7A] font-black min-w-[110px]">
                    Totaal Punten
                  </th>
                  <th className="py-3 px-3 text-center min-w-[60px] text-amber-700">3pt 🥇</th>
                  <th className="py-3 px-3 text-center min-w-[60px] text-slate-600">2pt 🥈</th>
                  <th className="py-3 px-3 text-center min-w-[60px] text-amber-900">1pt 🥉</th>
                  <th className="py-3 px-3 text-center min-w-[60px]">MVP's</th>
                  <th className="py-3 px-4 text-center min-w-[70px]">Matchen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredSeasonStats.map((s) => {
                  const isTop1 = s.rank === 1 && s.totalPoints > 0;
                  const isTop2 = s.rank === 2 && s.totalPoints > 0;
                  const isTop3 = s.rank === 3 && s.totalPoints > 0;

                  return (
                    <tr
                      key={s.player.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isTop1 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/30 text-amber-950 font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="font-bold text-slate-400 text-xs">#{s.rank}</span>
                        )}
                      </td>

                      {/* Jersey Number */}
                      <td className="py-3 px-4 font-black text-slate-900">
                        #{s.player.number}
                      </td>

                      {/* Player Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <PlayerAvatar
                            player={s.player}
                            size="sm"
                            className="shadow-xs shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {s.player.name}
                            </span>
                            {s.player.isCaptain && (
                              <span className="text-[10px] font-black text-amber-700 uppercase">
                                Kapitein
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-4 text-slate-600 font-normal">
                        {s.player.position}
                      </td>

                      {/* Match columns */}
                      {uniqueMatches.map((m) => {
                        const ptsInMatch = s.pointsPerMatch[m.id] ?? 0;
                        return (
                          <td
                            key={m.id}
                            className={`py-3 px-3 text-center border-l border-slate-100 ${
                              ptsInMatch > 0
                                ? 'font-bold text-blue-900 bg-blue-50/20'
                                : 'text-slate-300 font-normal'
                            }`}
                          >
                            {ptsInMatch > 0 ? (
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-blue-100/70 text-[#003B7A]">
                                {ptsInMatch}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                        );
                      })}

                      {/* Total Points */}
                      <td className="py-3 px-4 text-center bg-blue-50/40 border-l border-r border-blue-100 font-black text-sm text-[#003B7A]">
                        {s.totalPoints}
                      </td>

                      {/* 3pt Votes */}
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">
                        {s.votes3pt > 0 ? `${s.votes3pt}x` : '-'}
                      </td>

                      {/* 2pt Votes */}
                      <td className="py-3 px-3 text-center text-slate-600 font-bold">
                        {s.votes2pt > 0 ? `${s.votes2pt}x` : '-'}
                      </td>

                      {/* 1pt Votes */}
                      <td className="py-3 px-3 text-center text-amber-900 font-bold">
                        {s.votes1pt > 0 ? `${s.votes1pt}x` : '-'}
                      </td>

                      {/* MVP Count */}
                      <td className="py-3 px-3 text-center">
                        {s.mvpCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
                            <Trophy className="w-2.5 h-2.5 text-amber-600" />
                            {s.mvpCount}x
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Matches with points */}
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {s.matchesVoted} / {uniqueMatches.length}
                      </td>
                    </tr>
                  );
                })}

                {filteredSeasonStats.length === 0 && (
                  <tr>
                    <td
                      colSpan={10 + uniqueMatches.length}
                      className="py-8 text-center text-slate-400 italic"
                    >
                      Geen spelers gevonden die voldoen aan de zoekfilter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE VIEW: SINGLE MATCH TALLIES */}
      {viewMode === 'single' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Puntentotaal voor Match: {selectedMatch.homeTeam} {selectedMatch.awayTeam ? `vs ${selectedMatch.awayTeam}` : ''}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#003B7A] text-[10px] font-black">
                {selectedMatchVotes.length} Stemmen
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Datum: {selectedMatch.date || 'Onbekend'} • Zaal: {selectedMatch.location || 'REO Arena'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 text-center w-14">Rang</th>
                  <th className="py-3 px-4 w-12">Nr.</th>
                  <th className="py-3 px-4 min-w-[200px]">Speler</th>
                  <th className="py-3 px-4">Positie</th>
                  <th className="py-3 px-4 text-center bg-blue-50/80 text-[#003B7A] font-black min-w-[120px]">
                    Match Punten
                  </th>
                  <th className="py-3 px-4 text-center min-w-[90px] text-amber-700">
                    3pt Stemmen 🥇
                  </th>
                  <th className="py-3 px-4 text-center min-w-[90px] text-slate-600">
                    2pt Stemmen 🥈
                  </th>
                  <th className="py-3 px-4 text-center min-w-[90px] text-amber-900">
                    1pt Stemmen 🥉
                  </th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Aantal Stembiljetten</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">% van Stemmers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredMatchTallies.map((t) => {
                  const isTop1 = t.rank === 1 && t.totalPoints > 0;
                  const isTop2 = t.rank === 2 && t.totalPoints > 0;
                  const isTop3 = t.rank === 3 && t.totalPoints > 0;
                  const votePercentage =
                    selectedMatchVotes.length > 0
                      ? Math.round((t.totalBallots / selectedMatchVotes.length) * 100)
                      : 0;

                  return (
                    <tr
                      key={t.player.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isTop1 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/30 text-amber-950 font-black text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="font-bold text-slate-400 text-xs">#{t.rank}</span>
                        )}
                      </td>

                      {/* Jersey Number */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        #{t.player.number}
                      </td>

                      {/* Player Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar
                            player={t.player}
                            size="md"
                            className="shadow-xs shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {t.player.name}
                            </span>
                            {t.player.isCaptain && (
                              <span className="text-[10px] font-black text-amber-700 uppercase">
                                Kapitein
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {t.player.position}
                      </td>

                      {/* Match Points */}
                      <td className="py-3.5 px-4 text-center bg-blue-50/40 border-l border-r border-blue-100 font-black text-base text-[#003B7A]">
                        {t.totalPoints} <span className="text-[11px] font-semibold">ptn</span>
                      </td>

                      {/* 3pt Votes */}
                      <td className="py-3.5 px-4 text-center text-amber-700 font-black text-xs">
                        {t.votes3pt > 0 ? `${t.votes3pt} stemmen` : '-'}
                      </td>

                      {/* 2pt Votes */}
                      <td className="py-3.5 px-4 text-center text-slate-600 font-black text-xs">
                        {t.votes2pt > 0 ? `${t.votes2pt} stemmen` : '-'}
                      </td>

                      {/* 1pt Votes */}
                      <td className="py-3.5 px-4 text-center text-amber-900 font-black text-xs">
                        {t.votes1pt > 0 ? `${t.votes1pt} stemmen` : '-'}
                      </td>

                      {/* Ballot Mentions */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {t.totalBallots}x
                      </td>

                      {/* Vote Share % */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {votePercentage > 0 ? `${votePercentage}%` : '0%'}
                      </td>
                    </tr>
                  );
                })}

                {filteredMatchTallies.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                      Geen spelers gevonden voor deze wedstrijd.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
