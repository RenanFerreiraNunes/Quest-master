
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
    neutral: "M 44 64 Q 50 66 56 64",
    happy: "M 42 62 Q 50 72 58 62",
    grin: "M 38 62 Q 50 76 62 62 L 62 66 Q 50 78 38 66 Z",
    focused: "M 45 65 L 55 65",
    tired: "M 44 68 Q 50 64 56 68"
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
          <feFlood floodColor="white" floodOpacity="0.5" result="glowColor"/>
          <feComposite in="glowColor" in2="blur" operator="in" result="softGlow"/>
          <feMerge>
            <feMergeNode in="softGlow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <radialGradient id="faceDepth" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="70%" stopColor="black" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </radialGradient>

        <linearGradient id="goldLuster" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>

        <clipPath id="headClip">
          <circle cx="50" cy="48" r="30" />
        </clipPath>
      </defs>

      {/* 1. LAYER: ESPECIAL (CAPAS) */}
      {specialItem?.id === 'spec-0' && (
        <g filter="url(#ultraGlow)">
          <path d="M 12 88 Q 50 55 88 88 L 95 150 L 5 150 Z" fill="#312e81" />
          <path d="M 12 88 Q 50 55 88 88" fill="none" stroke="#6366f1" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
        </g>
      )}
      
      {/* 2. LAYER: CORPO */}
      <path d="M 22 82 Q 50 70 78 82 L 90 140 L 10 140 Z" fill={finalOutfitColor} stroke="black" strokeWidth="0.5" />
      {bodyItem?.id === 'body-1' && (
        <path d="M 40 82 L 50 100 L 60 82" fill="#3f3f46" stroke="#71717a" strokeWidth="1" />
      )}

      {/* 3. LAYER: CABEÇA BASE */}
      <circle cx="50" cy="48" r="30" fill={finalSkinColor} />
      
      {/* 4. LAYER: SOMBREADO DO ROSTO (PROFUNDIDADE) */}
      <circle cx="50" cy="48" r="30" fill="url(#faceDepth)" pointerEvents="none" />

      {/* 5. LAYER: ROSTO (OLHOS/BOCA) - SEMPRE VISÍVEIS */}
      {!isBroken ? (
        <g>
          <g className="eyes">
            <circle cx="38" cy="48" r="5" fill="white" />
            <circle cx="38" cy="48" r="2.5" fill={finalEyeColor} />
            <circle cx="37" cy="47" r="1.2" fill="white" opacity="0.9" />
            
            <circle cx="62" cy="48" r="5" fill="white" />
            <circle cx="62" cy="48" r="2.5" fill={finalEyeColor} />
            <circle cx="61" cy="47" r="1.2" fill="white" opacity="0.9" />
          </g>
          <path d={mouthPaths[expression] || mouthPaths.neutral} stroke="rgba(0,0,0,0.5)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ) : (
        <g opacity="0.7">
           <path d="M 34 48 L 42 48" stroke="black" strokeWidth="3" />
           <path d="M 58 48 L 66 48" stroke="black" strokeWidth="3" />
           <path d="M 40 68 Q 50 60 60 68" stroke="black" fill="none" strokeWidth="2" />
        </g>
      )}

      {/* 6. LAYER: CABELO (POSICIONADO PARA NÃO COBRIR OS OLHOS) */}
      {!isBroken && (
        <g fill={hairColor} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5">
          {hairStyle === 'short' && (
            <path d="M 20 48 C 20 15 80 15 80 48 Q 50 35 20 48" />
          )}
          {hairStyle === 'spiky' && (
            <path d="M 20 48 L 15 10 L 35 30 L 50 0 L 65 30 L 85 10 L 80 48 Q 50 38 20 48" />
          )}
          {hairStyle === 'long' && (
            <path d="M 20 48 C 20 10 80 10 80 48 L 85 110 Q 50 90 15 110 Z" />
          )}
          {hairStyle === 'hood' && (
            <path d="M 18 52 C 18 10 82 10 82 52 L 90 120 L 10 120 Z" fill="#18181b" />
          )}
        </g>
      )}

      {/* 7. LAYER: EQUIPAMENTOS DE CABEÇA (TOP) */}
      {!isBroken && headItem && (
        <g filter={headItem.rarity === 'lendario' ? "url(#ultraGlow)" : ""}>
          {headItem.id === 'head-legend' && (
            <g transform="translate(0, -5)">
              <path d="M 15 45 L 25 10 L 35 35 L 50 5 L 65 35 L 75 10 L 85 45 L 85 55 L 15 55 Z" fill="url(#goldLuster)" stroke="#854d0e" strokeWidth="1.5" />
              <circle cx="50" cy="30" r="4" fill="#ef4444" />
              <circle cx="30" cy="40" r="2.5" fill="#3b82f6" />
              <circle cx="70" cy="40" r="2.5" fill="#3b82f6" />
            </g>
          )}
          {headItem.id === 'head-1' && (
            <path d="M 18 50 C 18 5 82 5 82 50 L 90 65 L 10 65 Z" fill="#52525b" stroke="#27272a" strokeWidth="2" />
          )}
          {headItem.id === 'head-0' && (
             <path d="M 18 48 C 18 15 82 15 82 48 L 86 60 Q 50 50 14 60 Z" fill="#3f3f46" />
          )}
        </g>
      )}

      {/* EFEITO DE DANO/ESTADO */}
      {isBroken && (
        <circle cx="50" cy="48" r="30" fill="rgba(255,0,0,0.05)" stroke="#991b1b" strokeWidth="1" strokeDasharray="2 2" />
      )}
    </svg>
  );
};

export default HeroAvatar;
