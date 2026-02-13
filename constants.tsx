
import { Rarity, RarityConfig, InventoryItem, Difficulty, CharacterClass, Skill, CampaignMission, Appearance } from './types';

export const BASE_INVENTORY_CAPACITY = 15;
export const BASE_MIN_TIME_MINUTES = 5;

export interface ExtendedRarityConfig extends RarityConfig {
  hpCost: number;
}

export const RARITIES: Record<Rarity, ExtendedRarityConfig> = {
  comum: { xp: 15, gold: 5, color: "text-zinc-400 border-zinc-700", bg: "bg-zinc-900/50", shadow: "", multiplier: 1.0, hpCost: 5 },
  raro: { xp: 35, gold: 15, color: "text-blue-400 border-blue-500/50", bg: "bg-blue-900/10", shadow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]", multiplier: 1.5, hpCost: 10 },
  epico: { xp: 80, gold: 50, color: "text-purple-400 border-purple-500/50", bg: "bg-purple-900/10", shadow: "shadow-[0_0_20px_-3px_rgba(168,85,247,0.4)]", multiplier: 2.5, hpCost: 20 },
  lendario: { xp: 200, gold: 150, color: "text-amber-400 border-amber-500/50", bg: "bg-amber-900/10", shadow: "shadow-[0_0_25px_-3px_rgba(245,158,11,0.5)]", multiplier: 5.0, hpCost: 40 },
  extremo: { xp: 500, gold: 400, color: "text-red-500 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]", bg: "bg-red-950/20", shadow: "shadow-[0_0_40px_rgba(220,38,38,0.4)]", multiplier: 10.0, hpCost: 80 },
};

export const DIFFICULTIES: Record<Difficulty, { label: string, multiplier: number, color: string }> = {
  facil: { label: 'Fácil', multiplier: 1, color: 'text-emerald-400' },
  medio: { label: 'Médio', multiplier: 1.5, color: 'text-yellow-400' },
  dificil: { label: 'Difícil', multiplier: 2.5, color: 'text-red-400' },
};

export const CLASSES: CharacterClass[] = ['Guerreiro', 'Mago', 'Ladino', 'Paladino'];

export const AVATAR_ICONS = ['🛡️', '⚔️', '🪄', '🏹', '🐺', '🐉', '💀', '💎', '🔥', '🌑', '🌟', '🩸'];

export const AVATAR_PRESETS: { name: string, appearance: Appearance, class: CharacterClass }[] = [
  { 
    name: 'Cavaleiro Real', 
    class: 'Guerreiro',
    appearance: { skinColor: '#ffdbac', hairStyle: 'short', hairColor: '#ffd700', eyeStyle: 'round', eyeColor: '#4b8eb5', expression: 'focused', outfitColor: '#3f3f46' }
  },
  { 
    name: 'Feiticeira Sombria', 
    class: 'Mago',
    appearance: { skinColor: '#f1c27d', hairStyle: 'long', hairColor: '#2e1065', eyeStyle: 'glow', eyeColor: '#a855f7', expression: 'grin', outfitColor: '#1e1b4b' }
  },
  { 
    name: 'Algoz do Deserto', 
    class: 'Ladino',
    appearance: { skinColor: '#8d5524', hairStyle: 'spiky', hairColor: '#18181b', eyeStyle: 'sharp', eyeColor: '#ef4444', expression: 'focused', outfitColor: '#27272a' }
  },
  { 
    name: 'Paladino da Luz', 
    class: 'Paladino',
    appearance: { skinColor: '#ffdbac', hairStyle: 'mohawk', hairColor: '#ffffff', eyeStyle: 'large', eyeColor: '#fbbf24', expression: 'happy', outfitColor: '#71717a' }
  },
  { 
    name: 'Elfo da Floresta', 
    class: 'Ladino',
    appearance: { skinColor: '#e0ac69', hairStyle: 'long', hairColor: '#166534', eyeStyle: 'sharp', eyeColor: '#4ade80', expression: 'neutral', outfitColor: '#14532d' }
  },
  { 
    name: 'Guerreiro Morto-Vivo', 
    class: 'Guerreiro',
    appearance: { skinColor: '#94a3b8', hairStyle: 'none', hairColor: '#000000', eyeStyle: 'glow', eyeColor: '#ef4444', expression: 'angry', outfitColor: '#0f172a' }
  }
];

export const CLASS_STATS: Record<CharacterClass, { hp: number, xpMod: number, goldMod: number, activeSkill: string, description: string }> = {
  Guerreiro: { hp: 150, xpMod: 1.0, goldMod: 1.2, activeSkill: 'fury', description: 'Focado em força e ganhos de ouro massivos.' },
  Mago: { hp: 80, xpMod: 1.3, goldMod: 1.0, activeSkill: 'meditation', description: 'Mestre da mente, ganha experiência muito mais rápido.' },
  Ladino: { hp: 100, xpMod: 1.15, goldMod: 1.15, activeSkill: 'greed', description: 'Equilibrado e ágil, com bônus em ambos os recursos.' },
  Paladino: { hp: 200, xpMod: 1.1, goldMod: 1.1, activeSkill: 'iron_skin', description: 'Tanque supremo com alta regeneração e equilíbrio.' },
};

export const INITIAL_SKILLS: Skill[] = [
  { id: 'fury', name: 'Fúria Implacável', description: 'Aumenta o XP ganho em tarefas de alta raridade.', type: 'passiva', level: 0, maxLevel: 5, xpCostBase: 100, icon: '🔥', effect: '+10% XP p/ nível (Épicas/Lendárias)' },
  { id: 'greed', name: 'Olhar da Ganância', description: 'Aumenta o ganho de ouro em todas as tarefas.', type: 'passiva', level: 0, maxLevel: 5, xpCostBase: 120, icon: '💰', effect: '+5% Ouro p/ nível' },
  { id: 'meditation', name: 'Meditação Arcana', description: 'Ativa: cura vida imediatamente.', type: 'ativa', level: 0, maxLevel: 5, xpCostBase: 150, icon: '🧘', effect: 'Recupera 10 HP (+5 p/ nível).' },
  { id: 'iron_skin', name: 'Pele de Ferro', description: 'Reduz o dano recebido ao falhar tarefas.', type: 'passiva', level: 0, maxLevel: 5, xpCostBase: 180, icon: '🛡️', effect: '-5% Dano p/ nível' }
];

export const CAMPAIGN_CHAPTERS: CampaignMission[] = [
  { id: 'c1', title: 'O Despertar', description: 'Complete sua primeira tarefa no reino.', requiredLevel: 1, xpReward: 50, goldReward: 20, completed: false, chapter: 1 },
  { id: 'c2', title: 'Recrutamento', description: 'Alcance o Nível 3 para ser notado pela guilda.', requiredLevel: 3, xpReward: 150, goldReward: 50, completed: false, chapter: 2 },
  { id: 'c3', title: 'Prova de Fogo', description: 'Acumule 500 de ouro.', requiredLevel: 5, xpReward: 300, goldReward: 100, completed: false, chapter: 3 },
  { id: 'c4', title: 'Senda Lendária', description: 'Complete uma tarefa Lendária.', requiredLevel: 8, xpReward: 1000, goldReward: 500, completed: false, chapter: 4 },
  { id: 'c5', title: 'O Vazio Profundo', description: 'Desbloqueie 3 habilidades diferentes.', requiredLevel: 10, xpReward: 2000, goldReward: 800, completed: false, chapter: 5 },
  { id: 'c6', title: 'Eclipse do Caos', description: 'Acumule 2000 de ouro.', requiredLevel: 15, xpReward: 4000, goldReward: 1500, completed: false, chapter: 6 },
  { id: 'c7', title: 'Santuário Eterno', description: 'Alcance o Nível 20.', requiredLevel: 20, xpReward: 8000, goldReward: 3000, completed: false, chapter: 7 },
  { id: 'c8', title: 'Mestre da Alvorada', description: 'Equipe um set completo Lendário.', requiredLevel: 30, xpReward: 20000, goldReward: 10000, completed: false, chapter: 8 },
];

export const SHOP_ITEMS: InventoryItem[] = [
  { id: 'potion-0', name: 'Maçã Curativa', rarity: 'comum', price: 5, description: 'Recupera 5 de HP.', lore: 'Fruta fresca.', type: 'buff', icon: '🍎' },
  { id: 'potion-1', name: 'Poção de Foco', rarity: 'raro', price: 20, description: 'Recupera 20 de HP.', lore: 'Mistura alquímica.', type: 'buff', icon: '🧪' },
  
  { id: 'head-0', name: 'Capuz do Aprendiz', rarity: 'comum', price: 50, description: '+5% XP.', type: 'equipment', slot: 'head', icon: '👤' },
  { id: 'head-1', name: 'Elmo de Ferro', rarity: 'raro', price: 200, description: '+10% HP.', type: 'equipment', slot: 'head', icon: '🪖' },
  { id: 'head-legend', name: 'Coroa do Rei', rarity: 'lendario', price: 800, description: '+25% Ouro.', type: 'equipment', slot: 'head', icon: '👑', isAnimated: true },
  
  { id: 'body-0', name: 'Túnica de Couro', rarity: 'comum', price: 80, description: '+5% Ouro.', type: 'equipment', slot: 'body', icon: '👕' },
  { id: 'body-1', name: 'Armadura de Placas', rarity: 'epico', price: 500, description: '+15% HP.', type: 'equipment', slot: 'body', icon: '🛡️' },

  { id: 'theme-abyssal', name: 'Tema Abissal', rarity: 'epico', price: 400, description: 'Interface em tons roxos profundos.', type: 'theme', icon: '🌌', themeClass: 'theme-abyssal' },
  { id: 'theme-solar', name: 'Tema Solar', rarity: 'lendario', price: 600, description: 'Interface em tons dourados radiantes.', type: 'theme', icon: '☀️', themeClass: 'theme-solar' },
];

export const THEMES = {
  'theme-default': { primary: 'red-600', ring: 'ring-red-600/20', text: 'text-red-500', bg: 'bg-zinc-950', accent: 'red' },
  'theme-abyssal': { primary: 'indigo-600', ring: 'ring-indigo-600/20', text: 'text-indigo-500', bg: 'bg-zinc-950', accent: 'indigo' },
  'theme-solar': { primary: 'amber-500', ring: 'ring-amber-500/20', text: 'text-amber-500', bg: 'bg-zinc-950', accent: 'amber' },
};
