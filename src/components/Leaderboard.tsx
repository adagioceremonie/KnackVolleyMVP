import React, { useState, useEffect, useRef } from 'react';
import { PlayerTally, MatchInfo } from '../types';
import {
  Trophy,
  Medal,
  Award,
  Share2,
  Sparkles,
  Check,
  ShieldCheck,
  Vote,
  Clock,
  Timer,
  Eye,
  ArrowRight,
  CheckCircle2,
  Camera,
  Loader2,
  Download,
  X,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { generateShareText, getRemainingTimeUntilMidnight } from '../utils/storage';
import { copyPodiumToClipboard, downloadPodiumImage } from '../utils/podiumCapture';
import { PlayerAvatar } from './PlayerAvatar';

interface LeaderboardProps {
  tallies: PlayerTally[];
  match: MatchInfo;
  totalVotesCount: number;
  hasUserVoted: boolean;
  onOpenCeremony: () => void;
  onGoToVoting: () => void;
  onToggleVotingOpen: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  tallies,
  match,
  totalVotesCount,
  hasUserVoted,
  onOpenCeremony,
  onGoToVoting,
  onToggleVotingOpen,
}) => {
  const [copied, setCopied] = useState(false);
  const [adminPreviewUnlocked, setAdminPreviewUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(() => getRemainingTimeUntilMidnight(match.date));

  // Podium snapshot & clipboard photo copy states
  const podiumRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [copyPhotoStatus, setCopyPhotoStatus] = useState<'idle' | 'copied' | 'downloaded'>('idle');
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type: 'success' | 'info' | 'error';
    previewUrl?: string;
  } | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getRemainingTimeUntilMidnight(match.date));
    }, 1000);
    return () => clearInterval(timer);
  }, [match.date]);

  const top1 = tallies[0];
  const top2 = tallies[1];
  const top3 = tallies[2];

  const totalPointsDistributed = tallies.reduce((sum, t) => sum + t.totalPoints, 0);

  const handleCopyShare = () => {
    const text = generateShareText(match, tallies, totalVotesCount);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  /**
   * Captures the podium card as high-resolution image and copies directly to the clipboard.
   * Provides automatic fallback if clipboard image write is not permitted by the browser.
   */
  const handleCopyPodiumPhoto = async () => {
    if (!podiumRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const fileName = `podium-knack-volley-${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-vs-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}.png`;
      const result = await copyPodiumToClipboard(podiumRef.current, fileName);

      if (result.success) {
        if (result.method === 'clipboard') {
          setCopyPhotoStatus('copied');
          setToastMessage({
            title: 'Podiumfoto gekopieerd naar klembord! 📋',
            description: 'De foto van het podium staat op je klembord. Je kunt deze direct plakken (Ctrl+V) in WhatsApp, mail of sociale media.',
            type: 'success',
            previewUrl: result.dataUrl,
          });
          setTimeout(() => setCopyPhotoStatus('idle'), 3500);
        } else {
          setCopyPhotoStatus('downloaded');
          setToastMessage({
            title: 'Podiumfoto gedownload! 📥',
            description: result.error || 'De foto is succesvol gegenereerd en opgeslagen als PNG-afbeelding.',
            type: 'info',
            previewUrl: result.dataUrl,
          });
          setTimeout(() => setCopyPhotoStatus('idle'), 3500);
        }
      } else {
        setToastMessage({
          title: 'Foto maken mislukt',
          description: result.error || 'Er trad een onverwachte fout op bij het vastleggen van het podium.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setToastMessage({
        title: 'Fout bij foto maken',
        description: err?.message || 'Probeer het opnieuw.',
        type: 'error',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadPodiumPhoto = async () => {
    if (!podiumRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const fileName = `knack-podium-${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}.png`;
      const result = await downloadPodiumImage(podiumRef.current, fileName);
      if (result.success) {
        setToastMessage({
          title: 'Podiumfoto gedownload! 📥',
          description: 'Het PNG-bestand is opgeslagen op je apparaat.',
          type: 'success',
          previewUrl: result.dataUrl,
        });
      } else {
        setToastMessage({
          title: 'Downloaden mislukt',
          description: result.error || 'Kon de afbeelding niet genereren.',
          type: 'error',
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // IF VOTING IS STILL OPEN AND ADMIN PREVIEW IS NOT TRIGGERED:
  // Strictly hide results from supporters as requested!
  if (match.isVotingOpen && !adminPreviewUnlocked) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Stemresultaten verzegeld tot sluiting
          </h2>

          <p className="text-slate-600 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            Om een eerlijke en onbevooroordeelde verkiezing te waarborgen, worden de
            punten en het podium pas <strong>in real-time onthuld na de sluiting</strong>. De stemronde sluit <strong>automatisch om middernacht van de wedstrijddag</strong> (00:00u).
          </p>

          {/* Countdown timer until automatic midnight close */}
          {countdown && !countdown.isPast && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-4 max-w-md mx-auto mb-6 shadow-sm">
              <div className="flex items-center justify-center gap-2.5 text-amber-900 mb-1">
                <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Automatische Sluiting & Podiumonthulling
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 tracking-wider">
                {countdown.formatted}
              </div>
            </div>
          )}

          {/* Real-time Vote Count Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto mb-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-base">
              {totalVotesCount}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">
                Anonieme Stemmen Ontvangen
              </div>
              <div className="text-[11px] text-slate-500">
                Veilig opgeslagen &bull; Real-time teller
              </div>
            </div>
          </div>

          {/* Supporter Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!hasUserVoted ? (
              <button
                id="btn-vote-now-from-sealed"
                onClick={onGoToVoting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-transform text-sm cursor-pointer"
              >
                <Vote className="w-4 h-4" />
                <span>Breng Jouw Anonieme Stem Uit</span>
              </button>
            ) : (
              <button
                id="btn-view-receipt-from-sealed"
                onClick={onGoToVoting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md text-sm transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Jouw Stembevestiging Bekijken</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS ARE UNLOCKED (AFTER VOTING IS CLOSED, OR IN ADMIN PREVIEW):
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Auto-closed at midnight celebratory banner */}
      <div className="mb-6 bg-gradient-to-r from-[#071C3D] via-[#003B7A] to-[#0A2550] text-white rounded-3xl p-5 border-2 border-amber-400/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg shrink-0">
            🏆
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-1 border border-amber-400/30">
              <Sparkles className="w-3 h-3" />
              Officieel Geafficheerd Podium
            </div>
            <h3 className="text-lg font-black text-white">
              Knack Volley MVP Verkiezing Afgesloten
            </h3>
            <p className="text-xs text-blue-100">
              De stemming is gesloten om middernacht van de wedstrijddag. Hieronder staat de officiële uitslag en het supporterspodium!
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCeremony}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Podiumceremonie Bekijken</span>
        </button>
      </div>

      {/* Admin Preview Notice if voting is still open */}
      {match.isVotingOpen && adminPreviewUnlocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Wedstrijdleiding Voorvertoning:</strong> De stemming is nog geopend voor supporters. Supporters zien deze uitslag pas zodra je de stemronde sluit.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleVotingOpen()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg"
            >
              Sluit Stemming Nu Definitief
            </button>
            <button
              onClick={() => setAdminPreviewUnlocked(false)}
              className="text-amber-800 underline"
            >
              Verberg
            </button>
          </div>
        </div>
      )}

      {/* Header controls & summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Officiële Match MVP Uitslag
            </h2>
            {!match.isVotingOpen && (
              <span className="bg-rose-100 text-rose-900 font-extrabold text-xs px-3 py-1 rounded-full border border-rose-300 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                De stemronde is afgesloten
              </span>
            )}
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Stemming is gesloten &bull; Gebaseerd op <strong>{totalVotesCount}</strong> anonieme supporterstemmen ({totalPointsDistributed} punten toegekend).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Button to take photo of the podium and copy to clipboard when voting is closed */}
          {!match.isVotingOpen && (
            <button
              id="btn-copy-podium-photo-header"
              onClick={handleCopyPodiumPhoto}
              disabled={isCapturing}
              title="Maak een foto van het podium en kopieer direct naar het klembord"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#003B7A] to-[#004B9B] hover:from-[#004B9B] hover:to-blue-600 text-white font-black px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-sm cursor-pointer border border-blue-400/40"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Foto maken...</span>
                </>
              ) : copyPhotoStatus === 'copied' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Podiumfoto gekopieerd!</span>
                </>
              ) : copyPhotoStatus === 'downloaded' ? (
                <>
                  <Download className="w-4 h-4 text-sky-300" />
                  <span className="text-sky-200">Podiumfoto opgeslagen!</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Foto van podium kopiëren</span>
                </>
              )}
            </button>
          )}

          <button
            id="btn-open-ceremony"
            onClick={onOpenCeremony}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-transform text-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start MVP Onthullingsceremonie</span>
          </button>

          <button
            id="btn-share-results"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm text-sm transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Uitslag gekopieerd!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Deel op WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {totalVotesCount === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Nog geen stemmen uitgebracht
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Open de stemming opnieuw in het beheerpaneel om stemmen te ontvangen.
          </p>
          <button
            onClick={onGoToVoting}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-md"
          >
            Ga naar Stemmen
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Visual Podium */}
          <div
            ref={podiumRef}
            id="knack-official-podium-card"
            className="bg-gradient-to-b from-[#071C3D] via-[#003B7A] to-[#0A2550] text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border-2 border-[#004B9B] relative overflow-hidden"
          >
            {/* Action Bar on top of podium card - excluded from snapshot */}
            {!match.isVotingOpen && (
              <div className="exclude-from-photo flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Officieel Supporterspodium &bull; Match MVP</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-copy-podium-photo-card"
                    onClick={handleCopyPodiumPhoto}
                    disabled={isCapturing}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl shadow-md text-xs cursor-pointer active:scale-95 transition-all"
                    title="Maak een foto van dit podium en kopieer direct naar het klembord"
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        <span>Foto maken...</span>
                      </>
                    ) : copyPhotoStatus === 'copied' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950 font-bold" />
                        <span>Gekopieerd naar klembord!</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5 text-slate-950" />
                        <span>📸 Foto maken & kopiëren</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadPodiumPhoto}
                    disabled={isCapturing}
                    title="Download podiumfoto als PNG bestand"
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-medium px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border border-white/15"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-200" />
                    <span className="hidden sm:inline">PNG</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center text-center mb-6">
              <span className="text-xs uppercase font-extrabold tracking-widest text-blue-200">
                Officiële Match Uitslag &bull; Knack Volley Roeselare
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                De 3 meest waardevolle spelers van de match
              </h3>
              <p className="text-xs text-blue-200/80 mt-1 font-medium">
                {match.homeTeam} vs {match.awayTeam} &bull; {match.date} &bull; {match.location || 'REO Arena'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4">
              {/* 2nd Place (Silver) */}
              {top2 && (
                <div className="order-2 md:order-1 flex flex-col items-center">
                  <div className="relative mb-3 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-xs shadow-md mb-2">
                      2
                    </div>
                    <div className="p-1 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-400 shadow-xl">
                      <PlayerAvatar player={top2.player} size="lg" />
                    </div>
                  </div>
                  <div className="text-center w-full bg-slate-800/80 rounded-2xl p-4 border border-slate-700 min-h-[160px] flex flex-col justify-between">
                    <div>
                      <div className="font-black text-lg text-white truncate">
                        {top2.player.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {top2.player.position}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/60">
                      <div className="text-2xl font-black text-slate-200">
                        {top2.totalPoints} <span className="text-xs font-normal text-slate-400">ptn</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        3pt: {top2.votes3pt} &bull; 2pt: {top2.votes2pt} &bull; 1pt: {top2.votes1pt}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold / MVP) */}
              {top1 && (
                <div className="order-1 md:order-2 flex flex-col items-center -mt-4">
                  <div className="relative mb-3 flex flex-col items-center">
                    <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-lg shadow-amber-400/40 mb-2 animate-bounce">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>MATCH MVP</span>
                    </div>
                    <div className="p-1.5 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-2xl shadow-amber-500/40 ring-4 ring-amber-300/30">
                      <PlayerAvatar player={top1.player} size="xl" />
                    </div>
                  </div>
                  <div className="text-center w-full bg-gradient-to-b from-slate-800 to-slate-850 rounded-2xl p-5 border-2 border-amber-400/70 shadow-2xl min-h-[190px] flex flex-col justify-between">
                    <div>
                      <div className="font-black text-xl text-amber-400 truncate">
                        {top1.player.name}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {top1.player.position}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-400/20">
                      <div className="text-3xl font-black text-white">
                        {top1.totalPoints} <span className="text-sm font-semibold text-amber-400">punten</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1 font-mono">
                        🥇 {top1.votes3pt}x 3pt &bull; 🥈 {top1.votes2pt}x 2pt &bull; 🥉 {top1.votes1pt}x 1pt
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {top3 && (
                <div className="order-3 flex flex-col items-center">
                  <div className="relative mb-3 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-xs shadow-md mb-2">
                      3
                    </div>
                    <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-800 shadow-xl">
                      <PlayerAvatar player={top3.player} size="lg" />
                    </div>
                  </div>
                  <div className="text-center w-full bg-slate-800/80 rounded-2xl p-4 border border-slate-700 min-h-[160px] flex flex-col justify-between">
                    <div>
                      <div className="font-black text-lg text-white truncate">
                        {top3.player.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {top3.player.position}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/60">
                      <div className="text-2xl font-black text-amber-200">
                        {top3.totalPoints} <span className="text-xs font-normal text-slate-400">ptn</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        3pt: {top3.votes3pt} &bull; 2pt: {top3.votes2pt} &bull; 1pt: {top3.votes1pt}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Embedded match branding footer inside podium photo */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-blue-200/70 gap-2">
              <span className="font-semibold">Knack Volley Roeselare Supporter Verkiezing</span>
              <span className="font-mono">Totaal: {totalVotesCount} supporterstemmen ({totalPointsDistributed} ptn toegekend)</span>
            </div>
          </div>

          {/* Full Squad Ranking Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Volledige Rangschikking van de Ploeg
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Regel: 3pt (1ste) + 2pt (2de) + 1pt (3de)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-16">Plaats</th>
                    <th className="py-3 px-4">Speler</th>
                    <th className="py-3 px-4">Positie</th>
                    <th className="py-3 px-4 text-center">
                      <span className="text-amber-600 font-bold">3pt</span>
                    </th>
                    <th className="py-3 px-4 text-center">
                      <span className="text-slate-600 font-bold">2pt</span>
                    </th>
                    <th className="py-3 px-4 text-center">
                      <span className="text-amber-800 font-bold">1pt</span>
                    </th>
                    <th className="py-3 px-4 text-right">Totaal Punten</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tallies.map((item) => {
                    const isMVP = item.rank === 1 && item.totalPoints > 0;
                    const percentOfPoints =
                      totalPointsDistributed > 0
                        ? Math.round((item.totalPoints / totalPointsDistributed) * 100)
                        : 0;

                    return (
                      <tr
                        key={item.player.id}
                        id={`rank-row-${item.player.id}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isMVP ? 'bg-amber-50/50 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.rank === 1 && item.totalPoints > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                              1
                            </span>
                          ) : item.rank === 2 && item.totalPoints > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-black">
                              2
                            </span>
                          ) : item.rank === 3 && item.totalPoints > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-800/20 text-amber-900 text-xs font-black">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 pl-1.5">{item.rank}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar player={item.player} size="xs" />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{item.player.name}</span>
                                {item.player.isCaptain && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded border border-amber-300">
                                    C
                                  </span>
                                )}
                                {isMVP && (
                                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    MVP
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {item.player.position}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              item.votes3pt > 0
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            {item.votes3pt}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              item.votes2pt > 0
                                ? 'bg-slate-200 text-slate-800 font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            {item.votes2pt}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              item.votes1pt > 0
                                ? 'bg-amber-900/10 text-amber-900 font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            {item.votes1pt}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-slate-900">
                              {item.totalPoints}{' '}
                              <span className="text-xs font-normal text-slate-500">ptn</span>
                            </span>
                            {totalPointsDistributed > 0 && (
                              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className="bg-amber-500 h-full rounded-full"
                                  style={{ width: `${percentOfPoints}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Floating toast notification for podium photo capture & clipboard copy */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in max-w-md w-[calc(100vw-3rem)] bg-slate-900/95 text-white border-2 border-emerald-400/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              toastMessage.type === 'error'
                ? 'bg-red-500/20 text-red-400'
                : toastMessage.type === 'info'
                ? 'bg-sky-500/20 text-sky-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : toastMessage.type === 'info' ? (
              <Download className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-black text-sm text-white">
              {toastMessage.title}
            </div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              {toastMessage.description}
            </p>
            {toastMessage.previewUrl && (
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  onClick={() => {
                    setPreviewModalUrl(toastMessage.previewUrl!);
                    setIsPreviewModalOpen(true);
                  }}
                  className="text-amber-300 hover:text-amber-200 underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Foto bekijken</span>
                </button>
                <button
                  onClick={handleDownloadPodiumPhoto}
                  className="text-blue-300 hover:text-blue-200 underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG Opslaan</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Modal for captured photo */}
      {isPreviewModalOpen && previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-[#004B9B] rounded-3xl max-w-3xl w-full p-5 sm:p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  📸
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white">
                    Officiële Knack Volley Podiumfoto
                  </h3>
                  <p className="text-xs text-blue-200">
                    {match.homeTeam} vs {match.awayTeam} &bull; {match.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-2 max-h-[60vh] flex items-center justify-center">
              <img
                src={previewModalUrl}
                alt="Knack Volley Podium Snapshot"
                className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 text-center sm:text-left">
                💡 Tip: Plak direct met <strong>Ctrl+V</strong> (Cmd+V op Mac) in WhatsApp, mail of sociale media.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewModalUrl}
                  download={`podium-knack-${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}.png`}
                  className="inline-flex items-center gap-1.5 bg-[#004B9B] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Downloaden (PNG)</span>
                </a>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
