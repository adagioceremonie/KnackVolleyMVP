import { useState, useEffect, useMemo, useRef } from 'react';
import { MatchInfo, Player, SupporterVote, ActiveTab, VoteChoices } from './types';
import {
  loadMatchInfo,
  saveMatchInfo,
  loadMatchesList,
  saveMatchesList,
  loadPlayers,
  savePlayers,
  loadVotes,
  saveVotes,
  getVoterDeviceId,
  calculateTallies,
  generateReceiptCode,
  isAdminAuthenticated,
  setAdminAuthenticated,
  isMatchPastMidnight,
  incrementVotingPageView,
  resetVotingPageViews,
  fetchVotingPageViews,
} from './utils/storage';
import confetti from 'canvas-confetti';
import { INITIAL_MATCH, INITIAL_MATCHES, INITIAL_PLAYERS, SAMPLE_VOTES } from './data/initialData';
import { Navbar } from './components/Navbar';
import { VotingSection } from './components/VotingSection';
import { Leaderboard } from './components/Leaderboard';
import { VotesAudit } from './components/VotesAudit';
import { AdminPanel } from './components/AdminPanel';
import { PlayerAdmin } from './components/PlayerAdmin';
import { CeremonyModal } from './components/CeremonyModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Users,
  ListChecks,
  Settings2,
  LogOut,
} from 'lucide-react';

export default function App() {
  const [match, setMatch] = useState<MatchInfo>(loadMatchInfo);
  const [matches, setMatches] = useState<MatchInfo[]>(loadMatchesList);
  const [players, setPlayers] = useState<Player[]>(loadPlayers);
  const [votes, setVotes] = useState<SupporterVote[]>(loadVotes);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vote');
  const [voterDeviceId, setVoterDeviceId] = useState<string>(getVoterDeviceId);
  const [isCeremonyOpen, setIsCeremonyOpen] = useState<boolean>(false);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingAuthTab, setPendingAuthTab] = useState<ActiveTab | null>(null);

  // Sync state to local storage
  useEffect(() => {
    saveMatchInfo(match);
    setMatches((prev) => {
      const list = [...prev];
      const idx = list.findIndex((m) => m.id === match.id);
      if (idx >= 0) {
        list[idx] = match;
      } else {
        list.unshift(match);
      }
      saveMatchesList(list);
      return list;
    });
  }, [match]);

  useEffect(() => {
    savePlayers(players);
  }, [players]);

  useEffect(() => {
    saveVotes(votes);
  }, [votes]);

  // Dynamically update document title and OpenGraph meta tags with full match info for Facebook and social sharing
  useEffect(() => {
    const matchTitle = `${match.homeTeam} vs ${match.awayTeam} | Knack Volley MVP Stemming`;
    const scoreText = match.finalScore && match.finalScore !== '0 - 0' ? ` (Uitslag: ${match.finalScore})` : '';
    const dateText = match.date ? ` op ${match.date}` : '';
    const timeText = match.time ? ` om ${match.time}` : '';
    const descText = `Officiële MVP-stemming: ${match.homeTeam} vs ${match.awayTeam}${scoreText}${dateText}${timeText} in ${match.location || 'REO Arena'}. Competitie: ${match.competition || 'Lotto Volley League'}. Breng jouw 3-2-1 stem uit voor de Speler van de Wedstrijd!`;

    document.title = matchTitle;

    const setMetaTag = (attr: string, key: string, content: string) => {
      let meta = document.querySelector(`meta[${attr}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('name', 'description', descText);
    setMetaTag('property', 'og:title', `${match.homeTeam} vs ${match.awayTeam} - Knack Volley MVP`);
    setMetaTag('property', 'og:description', descText);
    setMetaTag('property', 'og:type', 'website');
    if (typeof window !== 'undefined') {
      setMetaTag('property', 'og:url', window.location.href);
    }
  }, [match]);

  // Automatic midnight auto-close: Sluit de stemming automatisch af om middernacht van de wedstrijddag en afficheer het podium
  useEffect(() => {
    const checkMidnightAutoClose = () => {
      if (match.isVotingOpen && match.autoCloseMidnight !== false) {
        if (isMatchPastMidnight(match, Date.now())) {
          setMatch((prev) => ({
            ...prev,
            isVotingOpen: false,
            mvpAnnounced: true,
            closedAtMidnight: true,
          }));

          // Trigger celebratory confetti when the podium is automatically revealed!
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.55 },
            colors: ['#003B7A', '#F59E0B', '#FFFFFF', '#0284C7', '#E30613'],
          });
        }
      }
    };

    checkMidnightAutoClose();
    const interval = setInterval(checkMidnightAutoClose, 1000);
    return () => clearInterval(interval);
  }, [match.isVotingOpen, match.autoCloseMidnight, match.date]);

  // Sync initial page views count from server/storage
  useEffect(() => {
    fetchVotingPageViews(match.id).then((count) => {
      setMatch((prev) => (prev.id === match.id ? { ...prev, votingPageViews: count } : prev));
    });
  }, [match.id]);

  // Listen for real-time page views changes across tabs
  useEffect(() => {
    const handlePageViewsChanged = (e: any) => {
      if (e.detail && e.detail.matchId === match.id) {
        setMatch((prev) => ({ ...prev, votingPageViews: e.detail.count }));
      }
    };
    window.addEventListener('knack_pageviews_changed', handlePageViewsChanged);
    return () => window.removeEventListener('knack_pageviews_changed', handlePageViewsChanged);
  }, [match.id]);

  // Track each time the voting page is opened for this match
  const initialRecordedRef = useRef(false);
  const prevTabRef = useRef<ActiveTab>(activeTab);

  useEffect(() => {
    if (!initialRecordedRef.current) {
      initialRecordedRef.current = true;
      if (activeTab === 'vote') {
        incrementVotingPageView(match.id).then((count) => {
          setMatch((prev) => (prev.id === match.id ? { ...prev, votingPageViews: count } : prev));
        });
      }
    } else if (prevTabRef.current !== 'vote' && activeTab === 'vote') {
      incrementVotingPageView(match.id).then((count) => {
        setMatch((prev) => (prev.id === match.id ? { ...prev, votingPageViews: count } : prev));
      });
    }
    prevTabRef.current = activeTab;
  }, [activeTab, match.id]);

  // Find if current device/supporter has already cast a vote in this match
  const userVote = useMemo(() => {
    return (
      votes.find(
        (v) => v.matchId === match.id && v.voterDeviceId === voterDeviceId
      ) || null
    );
  }, [votes, match.id, voterDeviceId]);

  // Calculate live tallies and standings
  const tallies = useMemo(() => {
    return calculateTallies(players, votes, match.id);
  }, [players, votes, match.id]);

  const matchVotes = useMemo(() => {
    return votes.filter((v) => v.matchId === match.id);
  }, [votes, match.id]);

  // Handler: Supporter submits anonymous ballot
  const handleCastVote = ({
    supporterNote,
    choices,
  }: {
    supporterNote?: string;
    choices: VoteChoices;
  }) => {
    const newVote: SupporterVote = {
      id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      matchId: match.id,
      anonymousId: `Supporter #${matchVotes.length + 1}`,
      receiptCode: generateReceiptCode(),
      supporterNote,
      voterDeviceId,
      timestamp: Date.now(),
      choices,
    };

    setVotes((prev) => [newVote, ...prev]);
  };

  // Admin actions
  const handleResetAllVotes = () => {
    setVotes([]);
    resetVotingPageViews(match.id);
    setMatch((prev) => ({ ...prev, votingPageViews: 0 }));
  };

  const handleResetPageViews = () => {
    resetVotingPageViews(match.id);
    setMatch((prev) => ({ ...prev, votingPageViews: 0 }));
  };

  const handleStartNewMatch = (newMatchData?: Partial<MatchInfo>) => {
    const newMatchId = `match-knack-${Date.now()}`;
    resetVotingPageViews(newMatchId);
    setVotes([]);
    const updatedMatch: MatchInfo = {
      ...INITIAL_MATCH,
      id: newMatchId,
      homeTeam: 'Knack Volley Roeselare',
      awayTeam: newMatchData?.awayTeam || 'Decospan Volley Team Menen',
      date: newMatchData?.date || '',
      time: newMatchData?.time || '20:30',
      location: newMatchData?.location || 'REO Arena, Roeselare',
      competition: newMatchData?.competition || 'Lotto Volley League Heren',
      season: '2026-2027',
      finalScore: '',
      setScores: [],
      isVotingOpen: true,
      mvpAnnounced: false,
      closedAtMidnight: false,
      votingPageViews: 0,
      ...newMatchData,
    };
    setMatch(updatedMatch);
    setMatches((prev) => [updatedMatch, ...prev.filter((m) => m.id !== updatedMatch.id)]);
  };

  const handleClearAllMatches = () => {
    resetVotingPageViews(INITIAL_MATCH.id);
    setMatch({ ...INITIAL_MATCH, votingPageViews: 0 });
    setMatches([]);
    saveMatchesList([]);
    setVotes([]);
    saveVotes([]);
  };

  const handleAddSampleVotes = () => {
    setVotes(SAMPLE_VOTES);
  };

  const handleRestoreDefaults = () => {
    resetVotingPageViews(INITIAL_MATCH.id);
    setMatch({ ...INITIAL_MATCH, votingPageViews: 0 });
    setMatches(INITIAL_MATCHES);
    saveMatchesList(INITIAL_MATCHES);
    setPlayers(INITIAL_PLAYERS);
    setVotes([]);
  };

  const handleDeleteVote = (voteId: string) => {
    setVotes((prev) => prev.filter((v) => v.id !== voteId));
  };

  const handleToggleVotingOpen = () => {
    setMatch((prev) => ({
      ...prev,
      isVotingOpen: !prev.isVotingOpen,
    }));
  };

  const handleProtectedTabClick = (tab: ActiveTab) => {
    if (!isAdmin) {
      setPendingAuthTab(tab);
      setIsAuthModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleAdminAuthSuccess = (remember: boolean) => {
    setIsAdmin(true);
    setAdminAuthenticated(true, remember);
    setIsAuthModalOpen(false);
    if (pendingAuthTab) {
      setActiveTab(pendingAuthTab);
      setPendingAuthTab(null);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminAuthenticated(false);
    if (activeTab === 'players' || activeTab === 'admin' || activeTab === 'votes-list') {
      setActiveTab('vote');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#004B9B] selection:text-white">
      {/* Top Navigation Bar with Knack Logo & Club Colors */}
      <Navbar
        match={match}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalVotesCount={matchVotes.length}
        isAdmin={isAdmin}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'vote' && (
          <VotingSection
            match={match}
            players={players}
            userVote={userVote}
            totalVotesCount={matchVotes.length}
            onCastVote={handleCastVote}
            onGoToStandings={() => setActiveTab('standings')}
          />
        )}

        {activeTab === 'standings' && (
          <Leaderboard
            tallies={tallies}
            match={match}
            totalVotesCount={matchVotes.length}
            hasUserVoted={Boolean(userVote)}
            onOpenCeremony={() => setIsCeremonyOpen(true)}
            onGoToVoting={() => setActiveTab('vote')}
            onToggleVotingOpen={handleToggleVotingOpen}
          />
        )}

        {activeTab === 'players' && (
          isAdmin ? (
            <PlayerAdmin
              players={players}
              onUpdatePlayers={setPlayers}
              homeTeamName={match.homeTeam}
              onLogout={handleAdminLogout}
            />
          ) : (
            <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border-2 border-blue-900/15 shadow-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#003B7A]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Toegang Beperkt</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Spelerskern is Beveiligd
              </h3>
              <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                Enkel de administrator heeft toegang tot het beheren van de spelerslijst, rugnummers en selecties van Knack Volley Roeselare.
              </p>
              <button
                onClick={() => {
                  setPendingAuthTab('players');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#003B7A] to-[#0A2550] hover:brightness-110 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Voer Administrator Paswoord In
              </button>
            </div>
          )
        )}

        {activeTab === 'votes-list' && (
          isAdmin ? (
            <VotesAudit
              votes={votes}
              players={players}
              match={match}
              onDeleteVote={handleDeleteVote}
            />
          ) : (
            <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border-2 border-blue-900/15 shadow-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#003B7A]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Toegang Beperkt</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Stemmenoverzicht is Beveiligd
              </h3>
              <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                De gedetailleerde stemmenlijst is uitsluitend in te kijken door de administrator.
              </p>
              <button
                onClick={() => {
                  setPendingAuthTab('votes-list');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#003B7A] to-[#0A2550] hover:brightness-110 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Voer Administrator Paswoord In
              </button>
            </div>
          )
        )}

        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminPanel
              match={match}
              matches={matches}
              players={players}
              votes={votes}
              onUpdateMatch={setMatch}
              onUpdatePlayers={setPlayers}
              onResetAllVotes={handleResetAllVotes}
              onResetPageViews={handleResetPageViews}
              onStartNewMatch={handleStartNewMatch}
              onClearAllMatches={handleClearAllMatches}
              totalVotesCount={matchVotes.length}
              onAddSampleVotes={handleAddSampleVotes}
              onRestoreDefaults={handleRestoreDefaults}
              onLogout={handleAdminLogout}
            />
          ) : (
            <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border-2 border-blue-900/15 shadow-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#003B7A]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Toegang Beperkt</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Wedstrijdbeheer is Beveiligd
              </h3>
              <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                Het beheerpaneel voor matchgegevens, stemrondes en instellingen is uitsluitend toegankelijk voor de administrator.
              </p>
              <button
                onClick={() => {
                  setPendingAuthTab('admin');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#003B7A] to-[#0A2550] hover:brightness-110 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Voer Administrator Paswoord In
              </button>
            </div>
          )
        )}
      </main>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        targetSectionName={
          pendingAuthTab === 'players'
            ? 'Spelerskern'
            : pendingAuthTab === 'votes-list'
            ? 'Stemmenoverzicht'
            : 'Beheer'
        }
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => {
          setIsAuthModalOpen(false);
          setPendingAuthTab(null);
        }}
      />

      {/* Official Knack Club Footer */}
      <footer className="bg-gradient-to-r from-[#071C3D] via-[#003B7A] to-[#0A2550] border-t-2 border-[#004B9B] text-blue-100 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          {/* Twee Knoppen: Stemmen, Beheer */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <button
              id="footer-tab-votes-list"
              onClick={() => {
                handleProtectedTabClick('votes-list');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                activeTab === 'votes-list'
                  ? 'bg-white text-[#003B7A] ring-2 ring-white/60 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/20'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Stemmen</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-black/25 rounded-full font-mono">
                {matchVotes.length}
              </span>
              {isAdmin ? (
                <Unlock className="w-3 h-3 text-emerald-300 ml-0.5" />
              ) : (
                <Lock className="w-3 h-3 text-amber-300/80 ml-0.5" />
              )}
            </button>

            <button
              id="footer-tab-admin"
              onClick={() => {
                handleProtectedTabClick('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                activeTab === 'admin'
                  ? 'bg-white text-[#003B7A] ring-2 ring-white/60 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/20'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Beheer</span>
              {isAdmin ? (
                <Unlock className="w-3 h-3 text-emerald-300 ml-0.5" />
              ) : (
                <Lock className="w-3 h-3 text-amber-300/80 ml-0.5" />
              )}
            </button>

            {isAdmin && (
              <button
                id="footer-admin-logout-btn"
                onClick={handleAdminLogout}
                title="Administrator uitloggen & modules vergrendelen"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white border border-red-400/30 transition-all cursor-pointer ml-1"
              >
                <LogOut className="w-3 h-3 text-red-300" />
                <span>Vergrendel</span>
              </button>
            )}
          </div>

          <div className="font-black text-white text-sm flex items-center justify-center gap-2">
            <span>{match.homeTeam}</span>
            <span className="text-blue-300 font-normal">&bull;</span>
            <span className="text-blue-200">Heren Seizoen 2026-2027</span>
            <span className="text-blue-300 font-normal">&bull;</span>
            <span>REO Arena, Roeselare</span>
          </div>
          <div className="mt-1.5 text-blue-200/80">
            Officiële Supportersverkiezing Speler van de Match &bull; Puntenverdeling: 3pt, 2pt, 1pt &bull; 100% Anoniem
          </div>
        </div>
      </footer>

      {/* MVP Announcement Ceremony Modal */}
      <CeremonyModal
        isOpen={isCeremonyOpen}
        onClose={() => setIsCeremonyOpen(false)}
        tallies={tallies}
        match={match}
      />
    </div>
  );
}
