
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
  const safeAppearance: Appearance = appearance || {
    skinColor: '#ffdbac',
    hairStyle: 'short',
    hairColor: '#4a3728',
    eyeStyle: 'round',
    eyeColor: '#4b8eb5',
    expression: 'neutral',
    outfitColor: '#3f3f46'
  };

  const { skinColor, hairStyle, hairColor, eyeStyle, eyeColor, expression, outfitColor } = safeAppearance;
  const isBroken = user?.isBroken;

  const headItem = user?.equipment?.head ? SHOP_ITEMS.find(i => i.id === user.equipment?.head) : null;
  const bodyItem = user?.equipment?.body ? SHOP_ITEMS.find(i => i.id === user.equipment?.body) : null;

  const finalSkinColor = isBroken ? "#94a3b8" : skinColor;
  let finalOutfitColor = isBroken ? "#334155" : (outfitColor || "#27272a");

  if (bodyItem?.id === 'body-1') finalOutfitColor = "#52525b";
  if (bodyItem?.id === 'body-0') finalOutfitColor = "#92400e";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`hero-float ${className}`} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="shadowDepth" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3"/>
        </filter>
        <radialGradient id="faceShade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="60%" stopColor="black" stopOpacity="0.05" />
          <stop offset="100%" stopColor="black" stopOpacity="0.25" />
        </radialGradient>
        <linearGradient id="outfitGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* 1. Camada de Cabelo Traseira (Atrás da cabeça) */}
      {!isBroken && !headItem && (
        <g fill={hairColor}>
          {hairStyle === 'long' && (
            <path d="M 20 40 Q 5 75 20 105 L 80 105 Q 95 75 80 40 Z" />
          )}
          {hairStyle === 'bob' && (
            <path d="M 20 40 Q 15 70 25 90 L 75 90 Q 85 70 80 40 Z" />
          )}
          {hairStyle === 'braids' && (
            <g>
              <path d="M 22 45 Q 10 70 25 105" fill="none" stroke={hairColor} strokeWidth="7" strokeLinecap="round" />
              <path d="M 78 45 Q 90 70 75 105" fill="none" stroke={hairColor} strokeWidth="7" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {/* 2. Traje / Corpo */}
      <g>
        <path d="M 15 85 Q 50 78 85 85 L 95 160 L 5 160 Z" fill={finalOutfitColor} />
        <path d="M 15 85 Q 50 78 85 85 L 95 160 L 5 160 Z" fill="url(#outfitGradient)" />
      </g>

      {/* 3. Pescoço */}
      <rect x="42" y="65" width="16" height="15" fill={finalSkinColor} opacity="0.9" />
      <rect x="42" y="65" width="16" height="15" fill="black" opacity="0.15" />

      {/* 4. Cabeça e Rosto */}
      {!isBroken ? (
        <g filter="url(#shadowDepth)">
          {/* Base da Pele */}
          <circle cx="50" cy="45" r="28" fill={finalSkinColor} />
          
          {/* CAMADA DE SOMBREAMENTO DO ROSTO (Novo) */}
          <circle cx="50" cy="45" r="28" fill="url(#faceShade)" />
          
          {/* Olhos e Expressões */}
          <g transform="translate(0, 0)">
            {eyeStyle === 'round' && (
              <g>
                <circle cx="41" cy="46" r="4.5" fill="white" />
                <circle cx="41" cy="46" r="2.5" fill={eyeColor} />
                <circle cx="42" cy="45" r="1" fill="white" opacity="0.6" />
                <circle cx="59" cy="46" r="4.5" fill="white" />
                <circle cx="59" cy="46" r="2.5" fill={eyeColor} />
                <circle cx="60" cy="45" r="1" fill="white" opacity="0.6" />
              </g>
            )}
            {eyeStyle === 'sharp' && (
              <g>
                <path d="M 35 46 Q 41 41 47 46 Q 41 49 35 46" fill="white" />
                <circle cx="41" cy="46" r="2" fill={eyeColor} />
                <path d="M 53 46 Q 59 41 65 46 Q 59 49 53 46" fill="white" />
                <circle cx="59" cy="46" r="2" fill={eyeColor} />
              </g>
            )}
            {eyeStyle === 'glow' && (
              <g>
                <circle cx="41" cy="46" r="5" fill={eyeColor} className="animate-pulse" filter="blur(1px)" />
                <circle cx="41" cy="46" r="2" fill="white" opacity="0.8" />
                <circle cx="59" cy="46" r="5" fill={eyeColor} className="animate-pulse" filter="blur(1px)" />
                <circle cx="59" cy="46" r="2" fill="white" opacity="0.8" />
              </g>
            )}
            {eyeStyle === 'large' && (
              <g>
                <circle cx="39" cy="46" r="6.5" fill="white" />
                <circle cx="39" cy="46" r="4" fill={eyeColor} />
                <circle cx="61" cy="46" r="6.5" fill="white" />
                <circle cx="61" cy="46" r="4" fill={eyeColor} />
              </g>
            )}
            {eyeStyle === 'closed' && (
              <g>
                <path d="M 37 46 Q 41 50 45 46" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                <path d="M 55 46 Q 59 50 63 46" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              </g>
            )}

            {expression === 'happy' && <path d="M 44 58 Q 50 66 56 58" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />}
            {expression === 'neutral' && <path d="M 43 62 L 57 62" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" opacity="0.5" />}
            {expression === 'grin' && <path d="M 40 58 Q 50 70 60 58 L 40 58 Z" fill="white" stroke="#000" strokeWidth="1" opacity="0.9" />}
            {expression === 'angry' && <path d="M 44 64 Q 50 58 56 64" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />}
            {expression === 'focused' && <path d="M 44 60 L 56 60" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" opacity="0.5" />}
            {expression === 'tired' && <path d="M 46 63 Q 50 61 54 63" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />}
            {expression === 'surprised' && <circle cx="50" cy="62" r="4" fill="none" stroke="#000" strokeWidth="2" opacity="0.5" />}
          </g>
        </g>
      ) : (
        <g filter="url(#shadowDepth)">
          <path d="M 30 50 C 30 25 70 25 70 50 C 70 65 65 75 50 75 C 35 75 30 65 30 50" fill="#e2e8f0" />
          <circle cx="42" cy="52" r="5" fill="#1e293b" />
          <circle cx="58" cy="52" r="5" fill="#1e293b" />
          <path d="M 46 68 L 54 68" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* 5. Camada de Cabelo Frontal (Sobre o rosto, mas respeitando olhos) */}
      {!isBroken && !headItem && (
        <g fill={hairColor} filter="url(#shadowDepth)">
          {/* Franja base para a maioria dos estilos */}
          {(hairStyle === 'short' || hairStyle === 'long' || hairStyle === 'bob' || hairStyle === 'braids') && (
            <path d="M 22 36 C 22 12 78 12 78 36 Q 50 24 22 36 Z" />
          )}
          {/* Mechas laterais frontais para estilos longos/médios */}
          {(hairStyle === 'long' || hairStyle === 'bob' || hairStyle === 'braids') && (
            <g>
               <path d="M 22 36 Q 20 60 26 80 L 32 80 Q 28 55 30 35 Z" />
               <path d="M 78 36 Q 80 60 74 80 L 68 80 Q 72 55 70 35 Z" />
            </g>
          )}
          {hairStyle === 'spiky' && (
            <path d="M 20 38 L 5 12 L 35 27 L 50 -5 L 65 27 L 95 12 L 80 38 Q 50 28 20 38 Z" />
          )}
          {hairStyle === 'mohawk' && (
            <path d="M 44 35 L 44 2 L 56 2 L 56 35 Z" />
          )}
          {hairStyle === 'hood' && (
            <path d="M 18 42 C 18 10 82 10 82 42 L 88 50 Q 92 15 50 8 Q 8 15 12 50 Z" fill="#18181b" />
          )}
        </g>
      )}

      {/* 6. Elmo / Equipamento de Cabeça (Sempre no topo) */}
      {!isBroken && headItem && (
        <g transform="translate(0, -6)" filter="url(#shadowDepth)">
           {headItem.id === 'head-legend' && (
             <g>
                <path d="M 18 40 L 25 10 L 38 32 L 50 0 L 62 32 L 75 10 L 82 40 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                <circle cx="50" cy="22" r="3.5" fill="#ef4444" className="animate-pulse" />
             </g>
           )}
           {headItem.id === 'head-1' && (
             <g>
                <path d="M 20 44 C 20 12 80 12 80 44 L 88 58 L 12 58 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                <rect x="42" y="30" width="16" height="4" fill="#1e293b" rx="2" />
             </g>
           )}
           {headItem.id === 'head-0' && <path d="M 20 44 C 20 12 80 12 80 44 L 84 52 L 16 52 Z" fill="#3f3f46" stroke="#18181b" strokeWidth="1.5" />}
        </g>
      )}
    </svg>
  );
};

export default HeroAvatar;
