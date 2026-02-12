
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

  const headItem = user?.equipment.head ? SHOP_ITEMS.find(i => i.id === user.equipment.head) : null;
  const bodyItem = user?.equipment.body ? SHOP_ITEMS.find(i => i.id === user.equipment.body) : null;
  const acc1Item = user?.equipment.acc1 ? SHOP_ITEMS.find(i => i.id === user.equipment.acc1) : null;
  const acc2Item = user?.equipment.acc2 ? SHOP_ITEMS.find(i => i.id === user.equipment.acc2) : null;
  const specialItem = user?.equipment.special ? SHOP_ITEMS.find(i => i.id === user.equipment.special) : null;

  const mouthPaths = {
    neutral: "M 44 60 Q 50 63 56 60",
    happy: "M 42 58 Q 50 68 58 58",
    grin: "M 38 58 Q 50 72 62 58 L 62 62 Q 50 74 38 62 Z",
    focused: "M 45 61 L 55 61",
    tired: "M 44 64 Q 50 60 56 64"
  };

  // Lógica de Cores e Skins
  let finalOutfitColor = outfitColor || "#27272a";
  let hasRoyalCape = outfitId === 'skin-royal';
  let hasShadowTrail = outfitId === 'skin-dark';
  let isHoodActive = hairStyle === 'hood' || headItem?.id === 'head-0';

  if (hasRoyalCape) finalOutfitColor = "#6b21a8";
  if (hasShadowTrail) finalOutfitColor = "#0f172a";
  if (bodyItem?.id === 'body-1') finalOutfitColor = "#52525b"; // Armadura de metal
  if (bodyItem?.id === 'body-0') finalOutfitColor = "#92400e"; // Túnica de couro

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={`hero-float ${className}`}
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

        {/* Efeito de Sombra para o Capuz */}
        <radialGradient id="hoodShadow" cx="50%" cy="45%" r="50%" fx="50%" fy="45%">
          <stop offset="40%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* LAYER 1: BACK ELEMENTS */}
      {specialItem?.id === 'spec-0' && (
        <path d="M 10 90 Q 50 65 90 90 L 95 130 L 5 130 Z" fill="#6366f1" opacity="0.4" filter="url(#glow)" />
      )}
      
      {hasRoyalCape && (
        <path d="M 15 85 Q 50 60 85 85 L 95 135 L 5 135 Z" fill="#7e22ce" stroke="#fbbf24" strokeWidth="1" />
      )}

      {hasShadowTrail && (
        <g opacity="0.6" filter="url(#glow)">
           <path d="M 20 80 Q 50 65 80 80 L 85 120 L 15 120 Z" fill="#020617" />
        </g>
      )}

      {/* HAIR BACK */}
      {hairStyle === 'long' && (
        <path d="M 25 45 Q 25 80 50 80 Q 75 80 75 45" fill={hairColor} />
      )}

      {/* NECK (Always behind face and body) */}
      <path d="M 43 65 L 57 65 L 56 82 L 44 82 Z" fill={skinColor} filter="brightness(0.9)" />

      {/* BODY / OUTFIT */}
      <path d="M 25 80 Q 50 70 75 80 L 85 120 L 15 120 Z" fill={finalOutfitColor} />

      {/* BODY DETAILS */}
      {bodyItem?.id === 'body-1' && (
        <g>
          <path d="M 30 82 L 70 82 L 75 110 L 25 110 Z" fill="url(#metalGrad)" stroke="#334155" strokeWidth="1" />
          <path d="M 40 85 L 60 85 L 60 100 L 40 100 Z" fill="#1e293b" opacity="0.2" />
        </g>
      )}

      {bodyItem?.id === 'body-0' && (
        <g>
          <path d="M 35 80 L 65 80 L 65 115 L 35 115 Z" fill="#78350f" opacity="0.8" />
          <path d="M 35 80 L 50 95 L 65 80" fill="none" stroke="#451a03" strokeWidth="1" />
        </g>
      )}

      {/* FACE BASE */}
      <circle cx="50" cy="45" r="28" fill={skinColor} />

      {/* LAYER: HOOD SHADOW (Cria o rosto sombreado por baixo do capuz) */}
      {isHoodActive && (
        <circle cx="50" cy="45" r="28" fill="url(#hoodShadow)" />
      )}
      
      {/* FEATURES: EYES & MOUTH */}
      <g>
        <circle cx="39" cy="43" r="3.5" fill="white" />
        <circle cx="39" cy="43" r="1.8" fill={eyeColor} />
        <circle cx="61" cy="43" r="3.5" fill="white" />
        <circle cx="61" cy="43" r="1.8" fill={eyeColor} />
      </g>

      <path d={mouthPaths[expression] || mouthPaths.neutral} stroke="rgba(0,0,0,0.3)" fill={expression === 'grin' ? "white" : "none"} strokeWidth="1.5" strokeLinecap="round" />

      {/* HAIR FRONT (Adjusted to not cover eyes) */}
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

      {/* EQUIPMENT FRONT: Hood, Helmet, Crown */}
      {isHoodActive && (
        <g>
           {/* Hood Exterior */}
           <path d="M 18 50 Q 18 10 50 10 Q 82 10 82 50 L 85 85 Q 50 75 15 85 Z" fill={headItem?.id === 'head-0' ? "#312e81" : "#18181b"} stroke="#1e1b4b" strokeWidth="0.5" />
           {/* Hood Interior Opening (frames the face) */}
           <path d="M 25 45 Q 25 20 50 20 Q 75 20 75 45 Q 75 75 50 75 Q 25 75 25 45 Z" fill="none" stroke={headItem?.id === 'head-0' ? "#1e1b4b" : "black"} strokeWidth="4" opacity="0.3" />
        </g>
      )}

      {headItem?.id === 'head-1' && (
        <g>
          <path d="M 18 45 Q 50 5 82 45 L 82 60 Q 50 52 18 60 Z" fill="url(#metalGrad)" stroke="#334155" strokeWidth="1.5" />
          <path d="M 45 15 L 55 15 L 55 30 L 45 30 Z" fill="#ef4444" opacity="0.6" /> 
        </g>
      )}

      {headItem?.id === 'head-legend' && (
        <g filter="url(#glow)">
          <path d="M 22 40 L 30 15 L 40 30 L 50 10 L 60 30 L 70 15 L 78 40 L 78 50 L 22 50 Z" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="1" />
          <circle cx="50" cy="35" r="3" fill="#ef4444" />
          <circle cx="35" cy="42" r="2" fill="#3b82f6" />
          <circle cx="65" cy="42" r="2" fill="#3b82f6" />
        </g>
      )}

      {/* ACCESSORIES FRONT */}
      {acc2Item?.id === 'acc-1' && (
        <g>
          <path d="M 45 80 Q 50 90 55 80" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="50" cy="92" r="3" fill="#3b82f6" filter="url(#glow)" />
        </g>
      )}

      {acc1Item?.id === 'acc-0' && (
        <circle cx="22" cy="100" r="2.5" fill="#fbbf24" filter="url(#glow)" />
      )}

      {/* SPECIAL EFFECTS FRONT */}
      {hasShadowTrail && (
        <circle cx="50" cy="45" r="30" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3">
          <animateTransform attributeName="transform" type="rotate" from="0 50 45" to="360 50 45" dur="10s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
};

export default HeroAvatar;
