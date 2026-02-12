
import React from 'react';
import { Appearance, User } from '../types';
import { SHOP_ITEMS } from '../constants';

interface HeroAvatarProps {
  appearance: Appearance;
  user?: User;
  size?: number;
  className?: string;
}

const HeroAvatar: React.FC<HeroAvatarProps> = ({ appearance, user, size = 120, className = "" }) => {
  const { skinColor, hairStyle, hairColor, eyeColor, expression, outfitColor, outfitId } = appearance;
  const isBroken = user?.isBroken;

  const headItem = user?.equipment.head ? SHOP_ITEMS.find(i => i.id === user.equipment.head) : null;
  const bodyItem = user?.equipment.body ? SHOP_ITEMS.find(i => i.id === user.equipment.body) : null;
  const specialItem = user?.equipment.special ? SHOP_ITEMS.find(i => i.id === user.equipment.special) : null;

  const mouthPaths = {
    neutral: "M 44 65 Q 50 67 56 65",
    happy: "M 42 63 Q 50 73 58 63",
    grin: "M 38 63 Q 50 77 62 63 L 62 67 Q 50 79 38 67 Z",
    focused: "M 45 66 L 55 66",
    tired: "M 44 69 Q 50 65 56 69"
  };

  const finalSkinColor = isBroken ? "#94a3b8" : skinColor;
  const finalEyeColor = isBroken ? "rgba(0,0,0,0.8)" : eyeColor;
  let finalOutfitColor = isBroken ? "#1e293b" : (outfitColor || "#27272a");

  if (outfitId === 'skin-royal') finalOutfitColor = "#6b21a8";
  if (outfitId === 'skin-dark') finalOutfitColor = "#0f172a";
  if (bodyItem?.id === 'body-1') finalOutfitColor = "#52525b";
  if (bodyItem?.id === 'body-0') finalOutfitColor = "#92400e";

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={`hero-float ${className} ${isBroken ? 'animate-pulse' : ''}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="ultraGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feFlood floodColor="white" floodOpacity="0.4" result="glowColor"/>
          <feComposite in="glowColor" in2="blur" operator="in" result="softGlow"/>
          <feMerge>
            <feMergeNode in="softGlow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Radial gradient for facial depth and shading */}
        <radialGradient id="faceShadeGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="60%" stopColor="black" stopOpacity="0.05" />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </radialGradient>

        <linearGradient id="legendaryGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        <linearGradient id="steelShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
      </defs>

      {/* 1. LAYER: BACK SPECIALS (Capes/Wings) */}
      {specialItem?.id === 'spec-0' && (
        <g filter="url(#ultraGlow)">
          <path d="M 12 85 Q 50 50 88 85 L 95 160 L 5 160 Z" fill="#312e81" opacity="0.9" />
          <path d="M 12 85 Q 50 50 88 85" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
          <path d="M 25 95 L 25 140 M 75 95 L 75 140" stroke="#4338ca" strokeWidth="2" opacity="0.5" />
        </g>
      )}
      
      {/* 2. LAYER: BODY & OUTFIT */}
      <path d="M 22 82 Q 50 68 78 82 L 92 150 L 8 150 Z" fill={finalOutfitColor} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
      {bodyItem?.id === 'body-1' && (
        <g>
          <path d="M 22 82 Q 50 68 78 82 L 85 105 L 15 105 Z" fill="url(#steelShine)" stroke="#374151" strokeWidth="1" />
          <path d="M 45 82 L 50 95 L 55 82" fill="#ef4444" opacity="0.8" />
        </g>
      )}

      {/* 3. LAYER: HEAD BASE */}
      <circle cx="50" cy="48" r="30" fill={finalSkinColor} />
      
      {/* 4. LAYER: FACIAL SHADING (Sombreado para profundidade) */}
      <circle cx="50" cy="48" r="30" fill="url(#faceShadeGrad)" pointerEvents="none" />

      {/* 5. LAYER: EYES AND MOUTH (Sempre no topo da pele) */}
      {!isBroken ? (
        <g>
          <g className="eyes">
            <circle cx="38" cy="48" r="5" fill="white" />
            <circle cx="38" cy="48" r="2.5" fill={finalEyeColor} />
            <circle cx="37" cy="47" r="1.5" fill="white" opacity="0.9" />
            
            <circle cx="62" cy="48" r="5" fill="white" />
            <circle cx="62" cy="48" r="2.5" fill={finalEyeColor} />
            <circle cx="61" cy="47" r="1.5" fill="white" opacity="0.9" />
          </g>
          <path d={mouthPaths[expression] || mouthPaths.neutral} stroke="rgba(0,0,0,0.6)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ) : (
        <g opacity="0.7">
           <path d="M 33 48 L 43 48 M 57 48 L 67 48" stroke="black" strokeWidth="3" strokeLinecap="round" />
           <path d="M 40 70 Q 50 60 60 70" stroke="black" fill="none" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* 6. LAYER: HAIR (Ajustado para não cobrir o rosto) */}
      {!isBroken && (
        <g fill={hairColor} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5">
          {hairStyle === 'short' && (
            <path d="M 20 48 C 20 10 80 10 80 48 Q 50 30 20 48" />
          )}
          {hairStyle === 'spiky' && (
            <path d="M 20 48 L 15 0 L 35 25 L 50 -10 L 65 25 L 85 0 L 80 48 Q 50 35 20 48" />
          )}
          {hairStyle === 'long' && (
            <path d="M 20 48 C 20 5 80 5 80 48 L 88 120 Q 50 100 12 120 Z" />
          )}
          {hairStyle === 'hood' && (
            <path d="M 18 52 C 18 5 82 5 82 52 L 95 140 L 5 140 Z" fill="#18181b" />
          )}
        </g>
      )}

      {/* 7. LAYER: HEAD EQUIPMENT (Sobre o cabelo) */}
      {!isBroken && headItem && (
        <g filter={headItem.rarity === 'lendario' ? "url(#ultraGlow)" : ""}>
          {headItem.id === 'head-legend' && (
            <g transform="translate(0, -8)">
              <path d="M 15 45 L 25 0 L 35 30 L 50 -5 L 65 30 L 75 0 L 85 45 L 85 55 L 15 55 Z" fill="url(#legendaryGold)" stroke="#92400e" strokeWidth="2" />
              <circle cx="50" cy="22" r="5" fill="#ef4444" shadow="0 0 10px red" />
              <circle cx="32" cy="40" r="3" fill="#3b82f6" />
              <circle cx="68" cy="40" r="3" fill="#3b82f6" />
            </g>
          )}
          {headItem.id === 'head-1' && (
            <path d="M 18 50 C 18 2 82 2 82 50 L 95 75 L 5 75 Z" fill="url(#steelShine)" stroke="#1f2937" strokeWidth="2" />
          )}
          {headItem.id === 'head-0' && (
             <path d="M 18 48 C 18 12 82 12 82 48 L 90 65 Q 50 55 10 65 Z" fill="#4b5563" stroke="#1f2937" strokeWidth="1" />
          )}
        </g>
      )}

      {/* DANO / ESTADO QUEBRADO */}
      {isBroken && (
        <g pointerEvents="none">
          <circle cx="50" cy="48" r="30" fill="rgba(255,0,0,0.1)" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
        </g>
      )}
    </svg>
  );
};

export default HeroAvatar;
