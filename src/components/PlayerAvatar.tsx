import React, { useState, useEffect } from 'react';
import { Player, PlaceholderConfig, PlaceholderStyleId } from '../types';
import { getPlaceholderConfig } from '../utils/storage';

interface PlayerAvatarProps {
  player: Player;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showNumberBadge?: boolean;
  showCaptainBadge?: boolean;
  variant?: 'circle' | 'rounded';
  className?: string;
  badgePosition?: 'bottom-right' | 'top-right' | 'bottom-left';
  overridePlaceholderStyle?: PlaceholderStyleId;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  size = 'md',
  showNumberBadge = true,
  showCaptainBadge = true,
  variant = 'rounded',
  className = '',
  overridePlaceholderStyle,
}) => {
  const [imageError, setImageError] = useState(false);
  const [placeholderConfig, setPlaceholderConfig] = useState<PlaceholderConfig>(getPlaceholderConfig);

  useEffect(() => {
    const handlePlaceholderChange = (e: any) => {
      if (e.detail) {
        setPlaceholderConfig(e.detail);
      } else {
        setPlaceholderConfig(getPlaceholderConfig());
      }
    };
    window.addEventListener('knack_placeholder_changed', handlePlaceholderChange);
    window.addEventListener('storage', handlePlaceholderChange);
    return () => {
      window.removeEventListener('knack_placeholder_changed', handlePlaceholderChange);
      window.removeEventListener('storage', handlePlaceholderChange);
    };
  }, []);

  // Size dimensions mapping
  const sizeMap = {
    xs: {
      box: 'w-8 h-8',
      text: 'text-xs',
      badge: 'w-4 h-4 text-[9px] -bottom-1 -right-1',
      badgeTop: 'w-3.5 h-3.5 text-[8px] -top-1 -right-1',
      rounded: variant === 'circle' ? 'rounded-full' : 'rounded-lg',
      iconSize: 12,
    },
    sm: {
      box: 'w-10 h-10',
      text: 'text-sm',
      badge: 'w-4.5 h-4.5 text-[10px] -bottom-1 -right-1',
      badgeTop: 'w-4 h-4 text-[9px] -top-1 -right-1',
      rounded: variant === 'circle' ? 'rounded-full' : 'rounded-xl',
      iconSize: 16,
    },
    md: {
      box: 'w-14 h-14',
      text: 'text-lg',
      badge: 'w-6 h-6 text-xs -bottom-1.5 -right-1.5',
      badgeTop: 'w-5 h-5 text-[10px] -top-1 -right-1',
      rounded: variant === 'circle' ? 'rounded-full' : 'rounded-2xl',
      iconSize: 22,
    },
    lg: {
      box: 'w-20 h-20',
      text: 'text-2xl',
      badge: 'w-7 h-7 text-xs -bottom-1 -right-1',
      badgeTop: 'w-6 h-6 text-xs -top-1 -right-1',
      rounded: variant === 'circle' ? 'rounded-full' : 'rounded-2xl',
      iconSize: 32,
    },
    xl: {
      box: 'w-24 h-24',
      text: 'text-3xl',
      badge: 'w-8 h-8 text-sm -bottom-1.5 -right-1.5',
      badgeTop: 'w-7 h-7 text-xs -top-1.5 -right-1.5',
      rounded: variant === 'circle' ? 'rounded-full' : 'rounded-3xl',
      iconSize: 40,
    },
    '2xl': {
      box: 'w-32 h-32',
      text: 'text-4xl',
      badge: 'w-10 h-10 text-base -bottom-2 -right-2',
      badgeTop: 'w-8 h-8 text-xs -top-1.5 -right-1.5',
      rounded: variant === 'circle' ? 'rounded-full' : 'rounded-3xl',
      iconSize: 52,
    },
  };

  const currentSize = sizeMap[size];
  const hasPhoto = Boolean(player.photoUrl && !imageError);
  const activeStyle = overridePlaceholderStyle || player.customPlaceholderStyle || placeholderConfig.style || 'blue_number';

  // Render chosen placeholder style when player has no photo
  const renderPlaceholderContent = () => {
    // 1. Custom Uploaded Image
    if (activeStyle === 'custom_uploaded' && placeholderConfig.customImageDataUrl) {
      return (
        <div className="relative w-full h-full">
          <img
            src={placeholderConfig.customImageDataUrl}
            alt="Placeholder"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 flex items-end justify-center pb-0.5">
            <span className="font-mono font-black text-white drop-shadow-md text-xs sm:text-sm">
              #{player.number}
            </span>
          </div>
        </div>
      );
    }

    // 2. Silhouette Navy (Dark navy with volleyball player vector silhouette)
    if (activeStyle === 'silhouette_navy') {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#071C3D] via-[#003B7A] to-[#0A2550] flex items-center justify-center overflow-hidden">
          {/* Volleyball player silhouette SVG in background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-35 scale-110 text-sky-200 fill-current"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="22" r="10" />
            <path d="M50 35 C38 35 30 45 30 58 L38 58 L42 85 L58 85 L62 58 L70 58 C70 45 62 35 50 35 Z" />
            <circle cx="75" cy="18" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2,2" />
          </svg>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className={`${currentSize.text} font-black text-white drop-shadow-md tracking-tight`}>
              {player.number}
            </span>
            {size !== 'xs' && (
              <span className="text-[9px] font-black uppercase text-sky-300 tracking-widest opacity-90">
                KNACK
              </span>
            )}
          </div>
        </div>
      );
    }

    // 3. Jersey Stripes (Knack jersey vector with red/gold accents)
    if (activeStyle === 'jersey_stripes') {
      return (
        <div className="relative w-full h-full bg-[#003B7A] flex items-center justify-center overflow-hidden">
          {/* Jersey stripes background */}
          <div className="absolute inset-0 flex">
            <div className="w-1/4 h-full bg-[#071C3D]" />
            <div className="w-1/12 h-full bg-[#E30613]" />
            <div className="w-1/3 h-full bg-[#004B9B]" />
            <div className="w-1/12 h-full bg-[#F59E0B]" />
            <div className="flex-1 h-full bg-[#071C3D]" />
          </div>
          {/* Collar curve */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-2.5 bg-white/20 rounded-b-full border-b border-white/40" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className={`${currentSize.text} font-black text-white drop-shadow-lg tracking-tight font-mono`}>
              {player.number}
            </span>
          </div>
        </div>
      );
    }

    // 4. Action Spike (Volleyball smash action with cyan energy glow)
    if (activeStyle === 'action_spike') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-[#0A2550] via-[#0284C7] to-[#071C3D] flex items-center justify-center overflow-hidden">
          {/* Volleyball icon / spike graphic */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400/30 blur-xs" />
          <svg
            className="absolute inset-0 w-full h-full opacity-40 text-cyan-200 fill-current"
            viewBox="0 0 100 100"
          >
            <path d="M20 70 Q45 30 75 25" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="3,3" />
            <circle cx="75" cy="25" r="7" />
          </svg>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className={`${currentSize.text} font-black text-white drop-shadow-md tracking-tight`}>
              {player.number}
            </span>
            {size !== 'xs' && (
              <span className="text-[8px] font-extrabold uppercase text-amber-300">
                VOLLEY
              </span>
            )}
          </div>
        </div>
      );
    }

    // 5. Golden MVP (Luxurious gold & dark bronze laurel wreath)
    if (activeStyle === 'golden_mvp') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-[#78350F] via-[#D97706] to-[#451A03] flex items-center justify-center overflow-hidden border border-amber-300/40">
          <div className="absolute inset-0 bg-radial from-amber-300/30 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className={`${currentSize.text} font-black text-amber-100 drop-shadow-md tracking-tight`}>
              {player.number}
            </span>
            {size !== 'xs' && (
              <span className="text-[8px] font-black uppercase text-amber-200 tracking-wider">
                ★ MVP ★
              </span>
            )}
          </div>
        </div>
      );
    }

    // Default 6. Classic Blue Number
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#003B7A] to-[#0A2550] flex items-center justify-center">
        <span className={`${currentSize.text} tracking-tight text-white font-black drop-shadow-sm`}>
          {player.number}
        </span>
      </div>
    );
  };

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      <div
        className={`${currentSize.box} ${currentSize.rounded} overflow-hidden shadow-sm flex items-center justify-center font-black transition-transform ${
          hasPhoto
            ? 'bg-gradient-to-b from-slate-50 via-sky-50/60 to-slate-100 border-2 border-slate-200/90'
            : 'border-2 border-white/20'
        }`}
      >
        {hasPhoto ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          renderPlaceholderContent()
        )}
      </div>

      {/* Jersey Number Badge (if photo is present or specified) */}
      {showNumberBadge && hasPhoto && (
        <span
          className={`absolute ${currentSize.badge} rounded-full bg-[#004B9B] text-white font-black flex items-center justify-center border-2 border-white shadow-md z-10`}
          title={`Rugnummer #${player.number}`}
        >
          {player.number}
        </span>
      )}

      {/* Captain badge */}
      {showCaptainBadge && player.isCaptain && (
        <span
          className={`absolute ${currentSize.badgeTop} rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center border-2 border-white shadow-md z-10`}
          title="Kapitein Knack Volley"
        >
          C
        </span>
      )}
    </div>
  );
};
