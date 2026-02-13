
import { Rarity, RarityConfig, InventoryItem, Difficulty, CharacterClass, Skill, CampaignMission, Appearance, ClassAbility } from './types';

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
];

export const CLASS_ABILITIES: Record<CharacterClass, ClassAbility> = {
  Guerreiro: {
    id: 'berserk',
    name: 'Berserk',
    description: 'Avança 15% do progresso de todas as missões ativas instantaneamente.',
    icon: '💢',
    cooldownSeconds: 300,
    type: 'instant'
  },
  Mago: {
    id: 'arcane_intellect',
    name: 'Intelecto Arcano',
    description: 'Ganha 100 XP instantaneamente através de meditação profunda.',
    icon: '🔮',
    cooldownSeconds: 600,
    type: 'instant'
  },
  Ladino: {
    id: 'master_thief',
    name: 'Mestre Ladino',
    description: 'Saqueia 50 de ouro dos tesouros perdidos do reino.',
    icon: '💰',
    cooldownSeconds: 450,
    type: 'instant'
  },
  Paladino: {
    id: 'divine_grace',
    name: 'Graça Divina',
    description: 'Cura 30 de vida invocando a luz sagrada.',
    icon: '✨',
    cooldownSeconds: 300,
    type: 'instant'
  }
};

export const CLASS_STATS: Record<CharacterClass, { hp: number, xpMod: number, goldMod: number, description: string, passive: string }> = {
  Guerreiro: { hp: 150, xpMod: 1.0, goldMod: 1.2, description: 'Focado em força e ganhos de ouro massivos.', passive: '+20% Ouro' },
  Mago: { hp: 80, xpMod: 1.3, goldMod: 1.0, description: 'Mestre da mente, ganha experiência muito mais rápido.', passive: '+30% XP' },
  Ladino: { hp: 100, xpMod: 1.15, goldMod: 1.15, description: 'Equilibrado e ágil, com bônus em ambos os recursos.', passive: '+15% Ouro/XP' },
  Paladino: { hp: 250, xpMod: 1.0, goldMod: 1.0, description: 'Tanque supremo com vitalidade inigualável.', passive: '+100 Vida Base' },
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
];

export const SHOP_ITEMS: InventoryItem[] = [
  { id: 'potion-0', name: 'Maçã Curativa', rarity: 'comum', price: 5, description: 'Recupera 5 de HP.', lore: 'Dizem que um pomar sagrado as produz.', type: 'buff', icon: '🍎' },
  { id: 'potion-1', name: 'Poção de Foco', rarity: 'raro', price: 20, description: 'Recupera 20 de HP.', lore: 'Gosto amargo, efeito doce.', type: 'buff', icon: '🧪' },
  
  { id: 'head-0', name: 'Capuz do Aprendiz', rarity: 'comum', price: 50, description: '+5% de Bônus de Experiência (XP).', lore: 'Simples e funcional para novatos.', type: 'equipment', slot: 'head', statBoost: 'XP', boostValue: 5, icon: '👤' },
  { id: 'head-1', name: 'Elmo de Ferro', rarity: 'raro', price: 200, description: '+15% de Vida Máxima (HP).', lore: 'Proteção pesada para a mente.', type: 'equipment', slot: 'head', statBoost: 'HP', boostValue: 15, icon: '🪖' },
  { id: 'head-legend', name: 'Coroa do Rei', rarity: 'lendario', price: 800, description: '+30% de Ganhos de Ouro.', lore: 'O ouro parece ser atraído por ela.', type: 'equipment', slot: 'head', statBoost: 'GOLD', boostValue: 30, icon: '👑', isAnimated: true },
  
  { id: 'body-0', name: 'Túnica de Couro', rarity: 'comum', price: 80, description: '+5% de Ganhos de Ouro.', lore: 'Leve e resistente aos ventos.', type: 'equipment', slot: 'body', statBoost: 'GOLD', boostValue: 5, icon: '👕' },
  { id: 'body-1', name: 'Armadura de Placas', rarity: 'epico', price: 500, description: '+25% de Vida Máxima (HP).', lore: 'Forjada no vulcão de Ignis.', type: 'equipment', slot: 'body', statBoost: 'HP', boostValue: 25, icon: '🛡️' },
];

export const THEMES: Record<string, { bg: string, primary: string, accent: string }> = {
  'theme-default': { bg: 'bg-zinc-950', primary: 'red-600', accent: 'zinc-800' },
  'theme-paladin': { bg: 'bg-zinc-900', primary: 'amber-500', accent: 'amber-900/20' },
  'theme-wizard': { bg: 'bg-indigo-950', primary: 'indigo-500', accent: 'indigo-900/20' },
};
