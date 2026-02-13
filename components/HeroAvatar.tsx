
import React from 'react';
import { Appearance, User } from '../types';
import { SHOP_ITEMS } from '../constants';

interface HeroAvatarProps {
  appearance?: Appearance;
  user?: User;
  size?: number;
  className?: string;
}

const HeroAvatar: React.FC<HeroAvatarProps> = ({ appearance, user, size = 120, className = "" }) => {
  // Defensive check to prevent destructuring errors
  const safeAppearance: Appearance = appearance || {
    skinColor: '#ffdbac',
    hairStyle: 'short',
    hairColor: '#4a3728',
    eyeStyle: 'round',
    eyeColor: '#4b8eb5',
    expression: 'neutral',
    outfitColor: '#3f3f46'
  };

  const { skinColor, hairStyle, hairColor, eyeStyle, eyeColor, expression, outfitColor, outfitId } = safeAppearance;
  const isBroken = user?.isBroken;

  // Fix: Added optional chaining for equipment access
  const headItem = user?.equipment?.head ? SHOP_ITEMS.find(i => i.id === user.equipment?.head) : null;
  const bodyItem = user?.equipment?.body ? SHOP_ITEMS.find(i => i.id === user.equipment?.body) : null;

  const finalSkinColor = isBroken ? "#94a3b8" : skinColor;
  let finalOutfitColor = isBroken ? "#334155" : (outfitColor || "#27272a");

  if (outfitId === 'skin-royal') finalOutfitColor = "#6b21a8";
  if (outfitId === 'skin-dark') finalOutfitColor = "#0f172a";
  if (bodyItem?.id === 'body-1') finalOutfitColor = "#52525b";
  if (bodyItem?.id === 'body-0') finalOutfitColor = "#92400e";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`hero-float ${className}`} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f472b6" floodOpacity="0.2"/>
        </filter>
        <radialGradient id="faceShade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </radialGradient>
        <filter id="skullShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5"/>
        </filter>
      </defs>

      {/* Camada de Cabelo Traseira */}
      {!isBroken && !headItem && (
        <g fill={hairColor}>
          {hairStyle === 'long' && <path d="M 15 40 Q 0 70 15 95 L 85 95 Q 100 70 85 40 Z" />}
          {hairStyle === 'bob' && <path d="M 18 40 Q 10 75 30 85 L 70 85 Q 90 75 82 40 Z" />}
          {hairStyle === 'braids' && (
            <g>
              <path d="M 22 45 Q 5 65 15 95" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
              <path d="M 78 45 Q 95 65 85 95" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
            </g>
          )}
          {hairStyle === 'hood' && <path d="M 12 45 Q 0 70 12 98 L 88 98 Q 100 70 88 45 Z" fill="#18181b" />}
        </g>
      )}

      {/* Traje / Corpo */}
      <path d="M 15 85 Q 50 65 85 85 L 98 160 L 2 160 Z" fill={finalOutfitColor} filter="url(#pinkGlow)" />

      {/* Cabeça ou Caveira */}
      {!isBroken ? (
        <g>
          <circle cx="50" cy="45" r="30" fill={finalSkinColor} />
          <circle cx="50" cy="45" r="30" fill="url(#faceShade)" />
          
          <g transform="translate(0, -1)">
            {eyeStyle === 'round' && (
              <g>
                <circle cx="40" cy="48" r="5" fill="white" />
                <circle cx="40" cy="48" r="2.5" fill={eyeColor} />
                <circle cx="60" cy="48" r="5" fill="white" />
                <circle cx="60" cy="48" r="2.5" fill={eyeColor} />
              </g>
            )}
            {eyeStyle === 'sharp' && (
              <g>
                <path d="M 34 48 Q 40 43 46 48 Q 40 51 34 48" fill="white" />
                <circle cx="40" cy="48" r="2" fill={eyeColor} />
                <path d="M 54 48 Q 60 43 66 48 Q 60 51 54 48" fill="white" />
                <circle cx="60" cy="48" r="2" fill={eyeColor} />
              </g>
            )}
            {eyeStyle === 'glow' && (
              <g>
                <circle cx="40" cy="48" r="4.5" fill={eyeColor} className="animate-pulse" filter="blur(1px)" />
                <circle cx="60" cy="48" r="4.5" fill={eyeColor} className="animate-pulse" filter="blur(1px)" />
              </g>
            )}

            {expression === 'happy' && <path d="M 42 62 Q 50 72 58 62" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />}
            {expression === 'neutral' && <path d="M 44 64 L 56 64" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />}
            {expression === 'grin' && <path d="M 40 62 Q 50 72 60 62 L 40 62 Z" fill="white" stroke="#000" strokeWidth="1" opacity="0.8" />}
            {expression === 'angry' && <path d="M 42 66 Q 50 60 58 66" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />}
          </g>
        </g>
      ) : (
        <g filter="url(#skullShadow)">
          {/* Base Crânio */}
          <path d="M 30 50 C 30 25 70 25 70 50 C 70 65 65 75 50 75 C 35 75 30 65 30 50" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"/>
          {/* Mandíbula */}
          <path d="M 40 72 L 42 82 L 58 82 L 60 72 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"/>
          {/* Dentes */}
          <line x1="45" y1="76" x2="45" y2="80" stroke="#94a3b8" strokeWidth="1" />
          <line x1="50" y1="76" x2="50" y2="82" stroke="#94a3b8" strokeWidth="1" />
          <line x1="55" y1="76" x2="55" y2="80" stroke="#94a3b8" strokeWidth="1" />
          {/* Olhos Ocos */}
          <circle cx="42" cy="52" r="6" fill="#1e293b" />
          <circle cx="58" cy="52" r="6" fill="#1e293b" />
          {/* Nariz */}
          <path d="M 50 62 L 48 68 L 52 68 Z" fill="#1e293b" />
          {/* Brilho residual nos olhos */}
          <circle cx="42" cy="52" r="2" fill="#ef4444" opacity="0.4" className="animate-pulse" />
          <circle cx="58" cy="52" r="2" fill="#ef4444" opacity="0.4" className="animate-pulse" />
        </g>
      )}

      {/* Camada de Cabelo Frontal */}
      {!isBroken && !headItem && (
        <g fill={hairColor}>
          {hairStyle === 'short' && (
            <path d="M 18 45 C 18 5 82 5 82 45 Q 50 32 18 45 Z" />
          )}
          {hairStyle === 'spiky' && (
            <path d="M 15 45 L 5 10 L 30 30 L 50 -5 L 70 30 L 95 10 L 85 45 Q 50 30 15 45 Z" />
          )}
          {hairStyle === 'long' && (
             <path d="M 15 45 C 15 5 85 5 85 45 Q 65 35 50 52 Q 35 35 15 45 Z" />
          )}
          {hairStyle === 'bob' && (
            <path d="M 15 45 C 15 8 85 8 85 45 Q 50 38 15 45 Z" />
          )}
          {hairStyle === 'hood' && (
            <path d="M 18 48 C 18 5 82 5 82 48 L 88 48 Q 95 15 50 12 Q 5 15 12 48 Z" fill="#27272a" />
          )}
        </g>
      )}

      {/* Elmo */}
      {!isBroken && headItem && (
        <g transform="translate(0, -8)">
           {headItem.id === 'head-legend' && (
             <g>
                <path d="M 15 50 L 25 10 L 38 35 L 50 0 L 62 35 L 75 10 L 85 50 L 85 60 L 15 60 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                <circle cx="50" cy="25" r="4" fill="#ef4444" />
             </g>
           )}
           {headItem.id === 'head-1' && <path d="M 18 52 C 18 10 82 10 82 52 L 95 75 L 5 75 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />}
        </g>
      )}
    </svg>
  );
};

export default HeroAvatar;
