
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
    neutral: "M 44 62 Q 50 64 56 62",
    happy: "M 42 60 Q 50 70 58 60",
    grin: "M 38 60 Q 50 74 62 60 L 62 64 Q 50 76 38 64 Z",
    focused: "M 45 63 L 55 63",
    tired: "M 44 66 Q 50 62 56 66"
  };

  // Cores dinâmicas com fallbacks
  const finalSkinColor = isBroken ? "#cbd5e1" : skinColor;
  const finalEyeColor = isBroken ? "rgba(0,0,0,0.8)" : eyeColor;
  let finalOutfitColor = isBroken ? "#1e293b" : (outfitColor || "#27272a");

  // Ajustes de Skins especiais
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
        <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <linearGradient id="faceShade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="black" stopOpacity="0.1" />
        </linearGradient>

        <radialGradient id="skinGrad">
          <stop offset="60%" stopColor={finalSkinColor} />
          <stop offset="100%" stopColor={isBroken ? "#94a3b8" : "#eab30822"} />
        </radialGradient>

        <linearGradient id="goldCrown" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* LAYER 1: BACK ELEMENTS (Mantos / Capas) */}
      {specialItem?.id === 'spec-0' && (
        <g opacity="0.8" filter="url(#heroGlow)">
          <path d="M 15 85 Q 50 60 85 85 L 90 140 L 10 140 Z" fill="#4338ca" />
          <path d="M 15 85 Q 50 60 85 85" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.5" />
        </g>
      )}
      
      {/* LAYER 2: CORPO / OUTFIT */}
      <path d="M 22 82 Q 50 72 78 82 L 88 130 L 12 130 Z" fill={finalOutfitColor} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />

      {/* LAYER 3: CABEÇA (BASE) */}
      <circle cx="50" cy="48" r="30" fill="url(#skinGrad)" />
      
      {/* LAYER 4: ROSTO COM PROFUNDIDADE (SOMBRA) */}
      <circle cx="50" cy="48" r="30" fill="url(#faceShade)" pointerEvents="none" />

      {/* LAYER 5: DETALHES DO ROSTO */}
      {isBroken ? (
        <g opacity="0.6">
           <circle cx="38" cy="45" r="7" fill="#000" />
           <circle cx="62" cy="45" r="7" fill="#000" />
           <path d="M 47 52 L 50 49 L 53 52 Z" fill="#000" />
           <path d="M 38 65 L 62 65" stroke="#000" strokeWidth="3" strokeDasharray="3 2" />
        </g>
      ) : (
        <g>
          {/* Olhos */}
          <g className="eyes">
            <circle cx="38" cy="45" r="4.5" fill="white" />
            <circle cx="38" cy="45" r="2.2" fill={finalEyeColor} />
            <circle cx="37" cy="44" r="1" fill="white" opacity="0.8" />
            
            <circle cx="62" cy="45" r="4.5" fill="white" />
            <circle cx="62" cy="45" r="2.2" fill={finalEyeColor} />
            <circle cx="61" cy="44" r="1" fill="white" opacity="0.8" />
          </g>
          {/* Boca */}
          <path d={mouthPaths[expression] || mouthPaths.neutral} stroke="rgba(0,0,0,0.4)" fill="none" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* LAYER 6: CABELO (REFINADO PARA MELHOR ENCAIXE) */}
      {!isBroken && (
        <g fill={hairColor} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5">
          {hairStyle === 'short' && (
            <path d="M 20 48 C 20 20 80 20 80 48 C 70 40 65 38 50 38 C 35 38 30 40 20 48 Z" />
          )}
          {hairStyle === 'spiky' && (
            <path d="M 20 48 L 22 15 L 35 35 L 50 10 L 65 35 L 78 15 L 80 48 Q 50 38 20 48 Z" />
          )}
          {hairStyle === 'long' && (
            <path d="M 20 48 C 20 18 80 18 80 48 L 82 85 Q 50 75 18 85 Z" />
          )}
          {hairStyle === 'hood' && (
            <path d="M 18 52 C 18 15 82 15 82 52 L 85 85 Q 50 75 15 85 Z" fill="#374151" />
          )}
        </g>
      )}

      {/* LAYER 7: EQUIPAMENTOS DE CABEÇA (Cobre o cabelo se necessário) */}
      {!isBroken && headItem && (
        <g className="head-equipment">
          {headItem.id === 'head-legend' && (
            <g filter="url(#heroGlow)">
              <path d="M 18 42 L 28 12 L 38 30 L 50 8 L 62 30 L 72 12 L 82 42 L 82 55 L 18 55 Z" fill="url(#goldCrown)" stroke="#92400e" strokeWidth="1.5" />
              <circle cx="50" cy="28" r="3" fill="#ef4444" />
            </g>
          )}
          {headItem.id === 'head-1' && (
            <path d="M 18 50 C 18 10 82 10 82 50 L 85 60 L 15 60 Z" fill="#71717a" stroke="#3f3f46" strokeWidth="2" />
          )}
          {headItem.id === 'head-0' && (
             <path d="M 18 50 C 18 15 82 15 82 50 L 85 65 Q 50 55 15 65 Z" fill="#4b5563" />
          )}
        </g>
      )}

      {/* LAYER FINAL: EFEITOS DE ESTADO */}
      {isBroken && (
        <circle cx="50" cy="48" r="30" fill="rgba(0,0,0,0.15)" stroke="rgba(255,0,0,0.1)" strokeWidth="2" />
      )}
    </svg>
  );
};

export default HeroAvatar;
