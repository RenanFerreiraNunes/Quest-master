
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
    facialHair: 'none',
    facialHairColor: '#4a3728',
    eyebrowStyle: 'normal',
    eyeStyle: 'round',
    eyeColor: '#4b8eb5',
    expression: 'neutral',
    outfitColor: '#3f3f46',
    neckOffset: 0,
    fringeDepth: 0.5,
    fringeCurvature: 0.5
  };

  const { 
    skinColor, hairStyle, hairColor, facialHair, facialHairColor, 
    eyebrowStyle, eyeStyle, eyeColor, expression, outfitColor, 
    neckOffset = 0, fringeDepth = 0.5, fringeCurvature = 0.5 
  } = safeAppearance;
  
  const isBroken = user?.isBroken;

  const headItem = user?.equipment?.head ? SHOP_ITEMS.find(i => i.id === user.equipment?.head) : null;
  const bodyItem = user?.equipment?.body ? SHOP_ITEMS.find(i => i.id === user.equipment?.body) : null;

  // Lógica para forçar o hood se o item equipado for o Capuz de Sombras
  const isHoodEquipped = headItem?.id === 'skin-hood';
  const effectiveHairStyle = isHoodEquipped ? 'hood' : hairStyle;

  const finalSkinColor = isBroken ? "#94a3b8" : skinColor;
  let finalOutfitColor = isBroken ? "#334155" : (outfitColor || "#27272a");

  if (bodyItem?.id === 'body-1') finalOutfitColor = "#52525b";
  if (bodyItem?.id === 'body-0') finalOutfitColor = "#92400e";

  const hairOutline = "rgba(0,0,0,0.2)";

  // Cálculos dinâmicos para a franja
  // fringeDepth (0.5 padrão) -> Afeta o Y central (quanto mais alto o valor, mais desce no rosto)
  // fringeCurvature (0.5 padrão) -> Afeta a diferença entre o centro e as laterais
  const fY_base = 15; // Ponto de partida vertical médio da franja
  const fDepth = fY_base + (fringeDepth * 15); // Profundidade final (15 a 30)
  const fCurve = fDepth - (fringeCurvature * 12); // Curvatura lateral (mais alto que o centro)

  return (
    <svg width={size} height={size} viewBox="-10 -20 120 140" className={`hero-float ${className}`} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="headMask">
          <rect x="22" y="15" width="56" height="58" rx="24" ry="24" />
        </clipPath>
      </defs>

      {/* 1. CABELO CAMADA DE TRÁS */}
      {!isBroken && (!headItem || isHoodEquipped) && (
        <g fill={hairColor} stroke={hairOutline} strokeWidth="0.5">
          {effectiveHairStyle === 'long' && <path d="M 18 35 Q 18 0 50 0 Q 82 0 82 35 L 92 90 Q 50 82 8 90 Z" />}
          {effectiveHairStyle === 'bob' && <path d="M 18 35 Q 18 2 50 2 Q 82 2 82 35 L 86 70 Q 50 62 14 70 Z" />}
          {effectiveHairStyle === 'braids' && (
            <>
              <path d="M 15 35 Q 15 0 50 0 Q 85 0 85 35 L 85 85 Q 75 90 70 85 L 70 35 Z" />
              <path d="M 15 35 L 30 35 L 30 85 Q 25 90 15 85 Z" />
            </>
          )}
          {effectiveHairStyle === 'hood' && (
             <path d="M 12 45 Q 12 -8 50 -8 Q 88 -8 88 45 L 92 85 Q 50 80 8 85 Z" fill={finalOutfitColor} stroke="none" />
          )}
        </g>
      )}

      {/* 2. CORPO / TORSO */}
      <path d="M 12 88 Q 50 82 88 88 L 98 135 L 2 135 Z" fill={finalOutfitColor} />
      
      {/* 3. PESCOÇO */}
      <rect x="41" y={68} width="18" height="24" fill={finalSkinColor} opacity="0.95" />
      <path d="M 41 78 Q 50 82 59 78" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />

      {/* 4. CABEÇA BASE */}
      <rect x="22" y="15" width="56" height="58" rx="24" ry="24" fill={finalSkinColor} />

      {/* 5. SOMBRA INTERNA DO CAPUZ */}
      {!isBroken && effectiveHairStyle === 'hood' && (!headItem || isHoodEquipped) && (
        <g clipPath="url(#headMask)">
          {/* Sombra mais circular e profunda ao redor dos olhos */}
          <path d="M 22 15 L 78 15 L 78 62 Q 50 48 22 62 Z" fill="rgba(0,0,0,0.96)" />
        </g>
      )}

      {/* 6. SOBRANCELHAS */}
      {!isBroken && (
        <g fill={hairColor} stroke={hairOutline} strokeWidth="0.5">
          {eyebrowStyle === 'normal' && (
            <>
              <rect x="30" y="34" width="14" height="2.5" rx="1.2" transform="rotate(-5 37 35)" />
              <rect x="56" y="34" width="14" height="2.5" rx="1.2" transform="rotate(5 63 35)" />
            </>
          )}
          {eyebrowStyle === 'thick' && (
            <>
              <rect x="29" y="33" width="16" height="4.5" rx="2.2" transform="rotate(-3 37 35)" />
              <rect x="55" y="33" width="16" height="4.5" rx="2.2" transform="rotate(3 63 35)" />
            </>
          )}
          {eyebrowStyle === 'thin' && (
            <>
              <rect x="31" y="35" width="12" height="1.2" rx="0.6" />
              <rect x="57" y="35" width="12" height="1.2" rx="0.6" />
            </>
          )}
          {eyebrowStyle === 'angry' && (
            <>
              <rect x="30" y="33" width="15" height="3" rx="1" transform="rotate(15 37 35)" />
              <rect x="55" y="33" width="15" height="3" rx="1" transform="rotate(-15 63 35)" />
            </>
          )}
        </g>
      )}

      {/* 7. OLHOS */}
      {!isBroken && (
        <g>
          {eyeStyle === 'round' && (
            <>
              <circle cx="38" cy="42" r="4.5" fill="white" />
              <circle cx="38" cy="42" r="2.5" fill={eyeColor} />
              <circle cx="62" cy="42" r="4.5" fill="white" />
              <circle cx="62" cy="42" r="2.5" fill={eyeColor} />
            </>
          )}
          {eyeStyle === 'sharp' && (
            <>
              <path d="M 31 43 Q 38 38 47 42 L 46 47 Q 38 45 32 47 Z" fill="white" />
              <circle cx="39" cy="44.5" r="2.2" fill={eyeColor} />
              <path d="M 53 42 Q 62 38 69 43 L 68 47 Q 62 45 54 47 Z" fill="white" />
              <circle cx="61" cy="44.5" r="2.2" fill={eyeColor} />
            </>
          )}
          {eyeStyle === 'glow' && (
            <>
              <circle cx="38" cy="42" r="5" fill={eyeColor} filter="url(#eyeGlow)" opacity="0.8" />
              <circle cx="38" cy="42" r="2" fill="white" />
              <circle cx="62" cy="42" r="5" fill={eyeColor} filter="url(#eyeGlow)" opacity="0.8" />
              <circle cx="62" cy="42" r="2" fill="white" />
            </>
          )}
          {eyeStyle === 'large' && (
            <>
              <circle cx="37" cy="42" r="6" fill="white" />
              <circle cx="37" cy="42" r="3.5" fill={eyeColor} />
              <circle cx="63" cy="42" r="6" fill="white" />
              <circle cx="63" cy="42" r="3.5" fill={eyeColor} />
            </>
          )}
          {eyeStyle === 'closed' && (
            <g stroke="rgba(0,0,0,0.6)" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M 32 44 Q 39 41 46 44" />
              <path d="M 54 44 Q 61 41 68 44" />
            </g>
          )}
        </g>
      )}

      {/* 8. BARBAS */}
      {!isBroken && facialHair !== 'none' && (
        <g fill={facialHairColor} stroke={hairOutline} strokeWidth="0.5">
          {facialHair === 'stubble' && (
             <g clipPath="url(#headMask)">
                {/* Reduzindo levemente as bordas do stubble para garantir que fique interno ao rosto */}
                <path d="M 23 55 Q 50 80 77 55 L 77 71 Q 50 82 23 71 Z" opacity="0.3" stroke="none" />
             </g>
          )}
          {facialHair === 'beard' && <path d="M 22 50 Q 50 90 78 50 L 78 73 Q 50 85 22 73 Z" />}
          {facialHair === 'goatee' && (
            <>
              <path d="M 36 56 Q 50 51 64 56 L 64 59 Q 50 54 36 59 Z" />
              <path d="M 45 74 Q 50 82 55 74 L 55 77 Q 50 84 45 77 Z" />
            </>
          )}
          {facialHair === 'mustache' && <path d="M 36 56 Q 50 51 64 56 L 64 60 Q 50 55 36 60 Z" />}
        </g>
      )}

      {/* 7. BOCA / EXPRESSÃO */}
      <g stroke="rgba(0,0,0,0.6)" fill="none" strokeLinecap="round">
        {expression === 'happy' && <path d="M 42 58 Q 50 64 58 58" strokeWidth="2.5" />}
        {expression === 'neutral' && <path d="M 44 60 L 56 60" strokeWidth="1.5" />}
        {expression === 'focused' && <path d="M 43 61 L 57 61" strokeWidth="3" stroke="rgba(0,0,0,0.8)" />}
        {expression === 'grin' && <rect x="44" y="58" width="12" height="4" rx="2" fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />}
        {expression === 'angry' && <path d="M 42 63 Q 50 58 58 63" strokeWidth="2.5" />}
        {expression === 'tired' && <circle cx="50" cy="61" r="1.5" fill="rgba(0,0,0,0.4)" stroke="none" />}
        {expression === 'surprised' && <circle cx="50" cy="60" r="3" strokeWidth="2" />}
      </g>

      {/* 9. CABELO CAMADA DA FRENTE */}
      {!isBroken && (!headItem || isHoodEquipped) && (
        <g fill={hairColor} stroke={hairOutline} strokeWidth="0.5">
          {effectiveHairStyle === 'short' && (
            <path d="M 22 40 Q 22 5 50 5 Q 78 5 78 40 Q 70 20 50 20 Q 30 20 22 40 Z" />
          )}
          {effectiveHairStyle === 'spiky' && (
            <path d="M 22 40 L 15 20 L 28 30 L 35 2 L 45 28 L 50 0 L 55 28 L 65 2 L 72 30 L 85 20 L 78 40 Q 50 22 22 40 Z" />
          )}
          {effectiveHairStyle === 'mohawk' && (
            <path d="M 44 40 L 44 0 Q 50 -5 56 0 L 56 40 Z" />
          )}
          {effectiveHairStyle === 'long' && (
            <path d={`M 22 40 Q 22 10 50 10 Q 78 10 78 40 Q 72 ${fCurve} 50 ${fDepth} Q 28 ${fCurve} 22 40 Z`} />
          )}
          {effectiveHairStyle === 'bob' && (
            <path d={`M 18 40 Q 18 12 50 12 Q 82 12 82 40 Q 70 ${fCurve} 50 ${fDepth} Q 30 ${fCurve} 18 40 Z`} />
          )}
          {effectiveHairStyle === 'braids' && (
            <path d={`M 22 40 Q 50 2 78 40 Q 70 ${fCurve} 50 ${fDepth} Q 30 ${fCurve} 22 40 Z`} />
          )}
          {effectiveHairStyle === 'hood' && (
             <g stroke="none">
                {/* Abertura mais circular e pronunciada */}
                <path d="M 20 50 Q 20 12 50 8 Q 80 12 80 50 L 84 75 Q 50 68 16 75 Z M 24 50 Q 24 16 50 14 Q 76 16 76 50 L 78 72 Q 50 65 22 72 Z" fill={finalOutfitColor} fillRule="evenodd" />
                {/* Dobra interna sutil na ponta superior */}
                <path d="M 44 14 Q 50 18 56 14" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" strokeLinecap="round" />
             </g>
          )}
        </g>
      )}

      {/* 10. EQUIPAMENTOS DE CABEÇA */}
      {!isBroken && headItem && !isHoodEquipped && (
        <g>
          {headItem.id === 'head-legend' && (
            <path d="M 18 35 L 30 15 L 40 32 L 50 5 L 60 32 L 70 15 L 82 35 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          )}
          {headItem.id === 'head-1' && (
            <path d="M 18 45 Q 18 10 50 10 Q 82 10 82 45 L 86 52 L 14 52 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="2" />
          )}
          {headItem.id === 'head-0' && (
            <path d="M 20 45 Q 20 12 50 12 Q 80 12 80 45 L 85 55 L 15 55 Z" fill="#52525b" />
          )}
        </g>
      )}
    </svg>
  );
};

export default HeroAvatar;
