import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X, ArrowLeft, KeyRound } from 'lucide-react';
import { verifyAdminPassword } from '../utils/storage';

interface AdminAuthModalProps {
  isOpen: boolean;
  targetSectionName: string; // e.g. "Spelerskern" or "Beheer"
  onSuccess: (remember: boolean) => void;
  onCancel: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  targetSectionName,
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Voer het administrator-paswoord in');
      return;
    }

    if (verifyAdminPassword(password)) {
      setError(null);
      setPassword('');
      onSuccess(rememberMe);
    } else {
      setError('Onjuist paswoord. Probeer het opnieuw.');
    }
  };

  return (
    <div
      id="admin-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-blue-900/20 overflow-hidden relative">
        {/* Header with Knack Branding */}
        <div className="bg-gradient-to-r from-[#071C3D] via-[#003B7A] to-[#0A2550] p-6 text-white text-center relative">
          <button
            id="close-auth-modal-btn"
            onClick={onCancel}
            aria-label="Sluiten"
            className="absolute top-4 right-4 text-blue-200 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wide uppercase mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Administrator Toegang</span>
          </div>

          <h3 id="auth-modal-title" className="text-xl font-black tracking-tight text-white">
            Beveiligd Onderdeel: {targetSectionName}
          </h3>
          <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto">
            Enkel bevoegde club- en ploegverantwoordelijken hebben toegang tot dit gedeelte.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Administrator Paswoord
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Voer paswoord in..."
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#003B7A] focus:bg-white rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 transition-all outline-none"
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title={showPassword ? 'Verberg paswoord' : 'Toon paswoord'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1.5 animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}

            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Standaard paswoord: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">********</code>
              </span>
            </div>
          </div>

          <div className="mb-6 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
              <input
                type="checkbox"
                id="remember-admin-session-chk"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#003B7A] focus:ring-[#003B7A] border-slate-300 rounded cursor-pointer"
              />
              <span>Sessie onthouden op dit apparaat</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              id="cancel-auth-btn"
              onClick={onCancel}
              className="flex-1 order-2 sm:order-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Terug naar stemming</span>
            </button>

            <button
              type="submit"
              id="confirm-auth-btn"
              className="flex-1 order-1 sm:order-2 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#003B7A] to-[#0A2550] hover:brightness-110 shadow-lg shadow-blue-950/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Toegang Bevestigen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
