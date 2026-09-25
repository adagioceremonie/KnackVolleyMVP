import React, { useState, useEffect, useRef } from 'react';
import { PlayerTally, MatchInfo } from '../types';
import {
  Trophy,
  Medal,
  Award,
  X,
  ChevronRight,
  RotateCcw,
  Camera,
  Check,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { copyPodiumToClipboard } from '../utils/podiumCapture';
import { PlayerAvatar } from './PlayerAvatar';

interface CeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tallies: PlayerTally[];
  match: MatchInfo;
}

export const CeremonyModal: React.FC<CeremonyModalProps> = ({
  isOpen,
  onClose,
  tallies,
  match,
}) => {
  // Reveal steps: 1 = 3rd place, 2 = 2nd place, 3 = 1st Place MVP!
  const [step, setStep] = useState<number>(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const top1 = tallies[0];
  const top2 = tallies[1];
  const top3 = tallies[2];

  const handleCopyCeremonyPhoto = async () => {
    if (!cardRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const fileName = `ceremonie-knack-mvp-${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}.png`;
      const result = await copyPodiumToClipboard(cardRef.current, fileName);
      if (result.success) {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 3000);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 3 && isOpen) {
      // Big confetti burst in Knack Roeselare Blue, White, Gold and Red
      const duration = 2.8 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#004B9B', '#F59E0B', '#FFFFFF', '#0A2550', '#E30613'],
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#004B9B', '#F59E0B', '#FFFFFF', '#0A2550', '#E30613'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div
        ref={cardRef}
        className="bg-slate-900 border-2 border-[#004B9B] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative text-white"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="exclude-from-photo absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top visual Header (Eindstand removed) */}
        <div className="p-6 text-center border-b border-white/10 bg-gradient-to-r from-[#071C3D] via-[#003B7A] to-[#0A2550]">
          <span className="text-amber-400 text-xs uppercase font-extrabold tracking-widest block mb-1">
            Officiële Match MVP Ceremonie
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Onthulling Speler van de Match
          </h2>
          <div className="text-xs text-blue-200 mt-1">
            {match.homeTeam} vs {match.awayTeam} &bull; REO Arena
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                step === 1
                  ? 'bg-amber-800 text-amber-200 border border-amber-600'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🥉 3de Plaats
            </button>
            <button
              onClick={() => setStep(2)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                step === 2
                  ? 'bg-slate-300 text-slate-900'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🥈 2de Plaats
            </button>
            <button
              onClick={() => setStep(3)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                step === 3
                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🏆 MATCH MVP
            </button>
          </div>
        </div>

        {/* Main Stage Content */}
        <div className="p-6 sm:p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
          {/* Step 1: 3rd Place */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <span className="text-amber-500 text-xs uppercase font-extrabold tracking-widest mb-2 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-600" />
                3de Plaats &bull; Bronzen Vermelding
              </span>
              {top3 ? (
                <>
                  <div className="mb-4">
                    <PlayerAvatar player={top3.player} size="xl" className="border-4 border-amber-700 shadow-2xl mx-auto" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {top3.player.name}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {top3.player.position} &bull; Knack Volley Roeselare
                  </p>
                  <div className="mt-4 bg-slate-800/80 px-4 py-2 rounded-xl text-sm font-bold text-amber-300 border border-slate-700">
                    {top3.totalPoints} Punten <span className="text-xs text-slate-400 font-normal">({top3.votes3pt}x 3pt &bull; {top3.votes2pt}x 2pt &bull; {top3.votes1pt}x 1pt)</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400">Nog onvoldoende stemmen geregistreerd.</div>
              )}
            </div>
          )}

          {/* Step 2: 2nd Place */}
          {step === 2 && (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <span className="text-slate-300 text-xs uppercase font-extrabold tracking-widest mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-300" />
                2de Plaats &bull; Zilveren Vermelding
              </span>
              {top2 ? (
                <>
                  <div className="mb-4">
                    <PlayerAvatar player={top2.player} size="xl" className="border-4 border-slate-300 shadow-2xl mx-auto" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {top2.player.name}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {top2.player.position} &bull; Knack Volley Roeselare
                  </p>
                  <div className="mt-4 bg-slate-800/80 px-4 py-2 rounded-xl text-sm font-bold text-slate-200 border border-slate-700">
                    {top2.totalPoints} Punten <span className="text-xs text-slate-400 font-normal">({top2.votes3pt}x 3pt &bull; {top2.votes2pt}x 2pt &bull; {top2.votes1pt}x 1pt)</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400">Nog onvoldoende stemmen geregistreerd.</div>
              )}
            </div>
          )}

          {/* Step 3: MVP Winner! */}
          {step === 3 && (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full shadow-lg shadow-amber-400/40 mb-3 animate-bounce">
                <Trophy className="w-4 h-4" />
                <span>OFFICIËLE SUPPORTERS KNACK MVP VAN DE MATCH</span>
              </div>
              {top1 ? (
                <>
                  <div className="mb-4 transform scale-105">
                    <PlayerAvatar player={top1.player} size="2xl" className="border-4 border-amber-300 shadow-2xl shadow-amber-500/50 mx-auto" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {top1.player.name}
                  </h3>
                  <p className="text-amber-400 text-base font-bold mt-1">
                    {top1.player.position} &bull; Knack Volley Roeselare
                  </p>
                  <div className="mt-4 bg-amber-500/20 border border-amber-400/40 px-5 py-2.5 rounded-2xl text-base font-black text-amber-300">
                    🏆 {top1.totalPoints} Totale Punten
                    <span className="block text-xs font-normal text-slate-300 mt-0.5">
                      Verkozen door de supporters in REO Arena
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400">Nog geen stemmen uitgebracht.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="exclude-from-photo p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={() => setStep(1)}
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Herstart</span>
          </button>

          <div className="flex items-center gap-2">
            {step === 3 && (
              <button
                onClick={handleCopyCeremonyPhoto}
                disabled={isCapturing}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title="Kopieer foto van deze officiële MVP ceremonie naar het klembord"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Foto maken...</span>
                  </>
                ) : copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950 font-bold" />
                    <span>Foto op klembord!</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span>Kopieer foto</span>
                  </>
                )}
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((prev) => Math.min(3, prev + 1))}
                className="bg-[#004B9B] hover:bg-blue-600 text-white font-black px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <span>Volgende Onthulling</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm cursor-pointer"
              >
                Sluiten
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
