import React, { useState, useEffect, useRef } from 'react';
import { MatchInfo, ActiveTab } from '../types';
import {
  Trophy,
  Vote,
  LogOut,
  ShieldCheck,
  Calendar,
  XCircle,
} from 'lucide-react';
import { parseMatchDateTime } from '../utils/storage';

interface NavbarProps {
  match: MatchInfo;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  totalVotesCount: number;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
}

/**
 * Hook to smoothly animate a number count-up and trigger a subtle bump effect.
 */
function useAnimatedCounter(targetValue: number, duration: number = 700) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isBumping, setIsBumping] = useState(false);
  const prevTargetRef = useRef(targetValue);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    const endValue = targetValue;
    prevTargetRef.current = targetValue;

    if (startValue === endValue) return;

    // Trigger subtle bump animation when count increases
    if (endValue > startValue) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 1000);
      return () => clearTimeout(timer);
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return { displayValue, isBumping };
}

export const Navbar: React.FC<NavbarProps> = ({
  match,
  activeTab,
  onTabChange,
  totalVotesCount,
  isAdmin = false,
  onAdminLogout,
}) => {
  const { displayValue: animatedVotes, isBumping } = useAnimatedCounter(totalVotesCount);
  const dateTime = parseMatchDateTime(match.date, match.time);
  const formattedTime = dateTime.time
    ? (dateTime.time.toLowerCase().includes('u') || dateTime.time.toLowerCase().includes('uur')
        ? dateTime.time
        : `${dateTime.time} u.`)
    : '';
  const matchScheduleText = [dateTime.date, formattedTime].filter(Boolean).join(' • ');

  return (
    <header className="bg-gradient-to-r from-[#071C3D] via-[#003B7A] to-[#0A2550] text-white shadow-xl border-b-2 border-[#004B9B] sticky top-0 z-40">
      {/* Top Banner with Match Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Match Context */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-white font-black">{match.homeTeam}</span>
              {match.awayTeam ? (
                <>
                  <span className="text-blue-300 font-semibold text-xs uppercase px-1">vs</span>
                  <span className="text-slate-200 font-semibold">{match.awayTeam}</span>
                </>
              ) : (
                <span className="text-amber-300/90 text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                  Wedstrijd in voorbereiding
                </span>
              )}
            </h1>

            {matchScheduleText && (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-300 bg-black/35 px-2.5 py-1 rounded-lg border border-amber-400/30 shadow-sm text-xs">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{matchScheduleText}</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs & Status */}
        <nav className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/15 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="tab-vote"
              onClick={() => onTabChange('vote')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'vote'
                  ? 'bg-white text-[#003B7A] shadow-lg shadow-black/20 ring-2 ring-white/50'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Vote className="w-4 h-4 text-[#E30613]" />
              <span>Stem hier (3, 2, 1 pt)</span>
            </button>

            <button
              id="tab-standings"
              onClick={() => onTabChange('standings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'standings'
                  ? 'bg-white text-[#003B7A] shadow-lg shadow-black/20 ring-2 ring-white/50'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>
                {match.isVotingOpen ? 'Uitslag & MVP' : 'Podium & Uitslag'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Voting Status Indicator & Vote Count with animation */}
            {match.isVotingOpen ? (
              <div
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap transition-all duration-500 ${
                  isBumping
                    ? 'bg-emerald-500/35 text-white border border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/30 shadow-md scale-105'
                    : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
                      isBumping ? 'animate-ping opacity-85' : 'animate-pulse opacity-75'
                    }`}
                  ></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span>Stemronde geopend</span>
                <span
                  className={`inline-flex items-center font-mono font-semibold transition-all duration-300 ml-0.5 ${
                    isBumping
                      ? 'text-amber-200 font-black scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'text-blue-100 text-[11px]'
                  }`}
                >
                  ({animatedVotes} {animatedVotes === 1 ? 'stem' : 'stemmen'})
                </span>
                {isBumping && (
                  <span className="text-[10px] text-emerald-300 font-extrabold animate-bounce leading-none">
                    +1
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-red-400 font-bold">Stemronde gesloten</span>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Beheerder Actief</span>
                </span>
                {onAdminLogout && (
                  <button
                    id="admin-logout-btn"
                    onClick={onAdminLogout}
                    title="Administrator uitloggen & modules vergrendelen"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-blue-200 hover:text-white bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-300" />
                    <span className="hidden sm:inline">Vergrendel</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

