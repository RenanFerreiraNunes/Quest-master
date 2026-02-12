
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
    neutral: "M 44 60 Q 50 63 56 60",
    happy: "M 42 58 Q 50 68 58 58",
    grin: "M 38 58 Q 50 72 62 58 L 62 62 Q 50 74 38 62 Z",
    focused: "M 45 61 L 55 61",
    tired: "M 44 64 Q 50 60 56 64"
  };

  // Cores dinâmicas
  const finalSkinColor = isBroken ? "#e2e8f0" : skinColor;
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
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* LAYER 1: BACK ELEMENTS */}
      {specialItem?.id === 'spec-0' && (
        <path d="M 10 90 Q 50 65 90 90 L 95 130 L 5 130 Z" fill="#6366f1" opacity="0.4" filter="url(#glow)" />
      )}
      
      {/* BODY / OUTFIT */}
      <path d="M 25 80 Q 50 70 75 80 L 85 120 L 15 120 Z" fill={finalOutfitColor} />

      {/* FACE BASE */}
      <circle cx="50" cy="45" r="28" fill={finalSkinColor} />

      {/* SKELETON DETAILS */}
      {isBroken ? (
        <g opacity="0.4">
           {/* Cavidades Oculares */}
           <circle cx="39" cy="43" r="6" fill="black" />
           <circle cx="61" cy="43" r="6" fill="black" />
           {/* Nariz esqueleto */}
           <path d="M 48 50 L 50 48 L 52 50 Z" fill="black" />
           {/* Dentes */}
           <path d="M 40 60 L 60 60" stroke="black" strokeWidth="2" strokeDasharray="2 1" />
        </g>
      ) : (
        <g>
          <circle cx="39" cy="43" r="3.5" fill="white" />
          <circle cx="39" cy="43" r="1.8" fill={finalEyeColor} />
          <circle cx="61" cy="43" r="3.5" fill="white" />
          <circle cx="61" cy="43" r="1.8" fill={finalEyeColor} />
          <path d={mouthPaths[expression] || mouthPaths.neutral} stroke="rgba(0,0,0,0.3)" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {/* HAIR (Removido se quebrado para parecer esqueleto) */}
      {!isBroken && (
        <g fill={hairColor}>
          {hairStyle === 'short' && (
            <path d="M 22 45 Q 22 17 50 17 Q 78 17 78 45 C 70 35 60 32 50 32 C 40 32 30 35 22 45 Z" />
          )}
          {hairStyle === 'spiky' && (
            <path d="M 22 45 L 25 12 L 35 30 L 50 5 L 65 30 L 75 12 L 78 45 Q 50 35 22 45 Z" />
          )}
          {hairStyle === 'long' && (
            <path d="M 22 45 Q 22 17 50 17 Q 78 17 78 45 Q 50 35 22 45 Z" />
          )}
        </g>
      )}

      {/* EQUIPMENT FRONT */}
      {headItem?.id === 'head-legend' && !isBroken && (
        <g filter="url(#glow)">
          <path d="M 22 40 L 30 15 L 40 30 L 50 10 L 60 30 L 70 15 L 78 40 L 78 50 L 22 50 Z" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="1" />
        </g>
      )}

      {/* OVERLAY DE EXAUSTÃO */}
      {isBroken && (
        <circle cx="50" cy="45" r="28" fill="rgba(0,0,0,0.1)" />
      )}
    </svg>
  );
};

export default HeroAvatar;
