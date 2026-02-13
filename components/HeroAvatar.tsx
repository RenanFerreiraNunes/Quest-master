
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

  const finalSkinColor = isBroken ? "#e2e8f0" : skinColor; // Branco osso para esqueleto
  const finalEyeColor = isBroken ? "rgba(0,0,0,1)" : eyeColor;
  let finalOutfitColor = isBroken ? "#475569" : (outfitColor || "#27272a");

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

      {/* 1. LAYER: BACK SPECIALS */}
      {specialItem?.id === 'spec-0' && !isBroken && (
        <g filter="url(#ultraGlow)">
          <path d="M 12 85 Q 50 50 88 85 L 95 160 L 5 160 Z" fill="#312e81" opacity="0.9" />
          <path d="M 12 85 Q 50 50 88 85" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      
      {/* 2. LAYER: BODY */}
      <path d="M 22 82 Q 50 68 78 82 L 92 150 L 8 150 Z" fill={finalOutfitColor} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />

      {/* 3. LAYER: HEAD BASE (Ou Crânio se isBroken) */}
      {!isBroken ? (
        <>
          <circle cx="50" cy="48" r="30" fill={finalSkinColor} />
          <circle cx="50" cy="48" r="30" fill="url(#faceShadeGrad)" pointerEvents="none" />
          <g className="eyes">
            <circle cx="38" cy="48" r="5" fill="white" />
            <circle cx="38" cy="48" r="2.5" fill={finalEyeColor} />
            <circle cx="62" cy="48" r="5" fill="white" />
            <circle cx="62" cy="48" r="2.5" fill={finalEyeColor} />
          </g>
          <path d={mouthPaths[expression] || mouthPaths.neutral} stroke="rgba(0,0,0,0.6)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <g transform="translate(20, 18) scale(0.6)">
          {/* CRÂNIO */}
          <path d="M 50 0 C 10 0 0 30 0 50 C 0 80 20 100 50 100 C 80 100 100 80 100 50 C 100 30 90 0 50 0 Z" fill="#e2e8f0" />
          <path d="M 30 70 L 30 100 L 70 100 L 70 70 Z" fill="#e2e8f0" />
          {/* OLHOS VAZIOS */}
          <circle cx="30" cy="45" r="12" fill="#0f172a" />
          <circle cx="70" cy="45" r="12" fill="#0f172a" />
          {/* NARIZ */}
          <path d="M 45 60 L 50 50 L 55 60 Z" fill="#0f172a" />
          {/* DENTES */}
          <g stroke="#0f172a" strokeWidth="2">
            <line x1="35" y1="85" x2="35" y2="100" />
            <line x1="50" y1="85" x2="50" y2="100" />
            <line x1="65" y1="85" x2="65" y2="100" />
            <line x1="30" y1="85" x2="70" y2="85" />
          </g>
        </g>
      )}

      {/* 4. LAYER: HAIR (Apenas se não estiver quebrado) */}
      {!isBroken && (
        <g fill={hairColor} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5">
          {hairStyle === 'short' && <path d="M 20 48 C 20 10 80 10 80 48 Q 50 30 20 48" />}
          {hairStyle === 'spiky' && <path d="M 20 48 L 15 0 L 35 25 L 50 -10 L 65 25 L 85 0 L 80 48 Q 50 35 20 48" />}
          {hairStyle === 'long' && <path d="M 20 48 C 20 5 80 5 80 48 L 88 120 Q 50 100 12 120 Z" />}
          {hairStyle === 'hood' && <path d="M 18 52 C 18 5 82 5 82 52 L 95 140 L 5 140 Z" fill="#18181b" />}
        </g>
      )}

      {/* 5. LAYER: HEAD EQUIPMENT */}
      {!isBroken && headItem && (
        <g filter={headItem.rarity === 'lendario' ? "url(#ultraGlow)" : ""}>
          {headItem.id === 'head-legend' && (
            <g transform="translate(0, -8)">
              <path d="M 15 45 L 25 0 L 35 30 L 50 -5 L 65 30 L 75 0 L 85 45 L 85 55 L 15 55 Z" fill="url(#legendaryGold)" stroke="#92400e" strokeWidth="2" />
            </g>
          )}
          {headItem.id === 'head-1' && <path d="M 18 50 C 18 2 82 2 82 50 L 95 75 L 5 75 Z" fill="url(#steelShine)" stroke="#1f2937" strokeWidth="2" />}
        </g>
      )}
    </svg>
  );
};

export default HeroAvatar;
