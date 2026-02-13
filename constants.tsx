
import { Rarity, RarityConfig, InventoryItem, Difficulty, CharacterClass, Skill, CampaignMission } from './types';

export const BASE_INVENTORY_CAPACITY = 12;
export const BASE_MIN_TIME_MINUTES = 5;

// Interface estendida localmente para incluir hpCost
export interface ExtendedRarityConfig extends RarityConfig {
  hpCost: number;
}

export const RARITIES: Record<Rarity, ExtendedRarityConfig> = {
  comum: { xp: 15, gold: 5, color: "text-zinc-400 border-zinc-700", bg: "bg-zinc-900/50", shadow: "", multiplier: 1.0, hpCost: 5 },
  raro: { xp: 35, gold: 15, color: "text-blue-400 border-blue-500/50", bg: "bg-blue-900/10", shadow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]", multiplier: 1.5, hpCost: 10 },
  epico: { xp: 80, gold: 50, color: "text-purple-400 border-purple-500/50", bg: "bg-purple-900/10", shadow: "shadow-[0_0_20px_-3px_rgba(168,85,247,0.4)]", multiplier: 2.5, hpCost: 20 },
  lendario: { xp: 200, gold: 150, color: "text-amber-400 border-amber-500/50", bg: "bg-amber-900/10", shadow: "shadow-[0_0_25px_-3px_rgba(245,158,11,0.5)]", multiplier: 5.0, hpCost: 40 },
};

export const DIFFICULTIES: Record<Difficulty, { label: string, multiplier: number, color: string }> = {
  facil: { label: 'Fácil', multiplier: 1, color: 'text-emerald-400' },
  medio: { label: 'Médio', multiplier: 1.5, color: 'text-yellow-400' },
  dificil: { label: 'Difícil', multiplier: 2.5, color: 'text-red-400' },
};

export const CLASSES: CharacterClass[] = ['Guerreiro', 'Mago', 'Ladino', 'Paladino'];

export const CLASS_STATS: Record<CharacterClass, { hp: number, xpMod: number, goldMod: number, activeSkill: string, description: string }> = {
  Guerreiro: { hp: 150, xpMod: 1.0, goldMod: 1.2, activeSkill: 'Grito de Guerra', description: 'Focado em força e ganhos de ouro massivos.' },
  Mago: { hp: 80, xpMod: 1.3, goldMod: 1.0, activeSkill: 'Foco Arcano', description: 'Mestre da mente, ganha experiência muito mais rápido.' },
  Ladino: { hp: 100, xpMod: 1.15, goldMod: 1.15, activeSkill: 'Passo das Sombras', description: 'Equilibrado e ágil, com bônus em ambos os recursos.' },
  Paladino: { hp: 200, xpMod: 1.1, goldMod: 1.1, activeSkill: 'Benção de Luz', description: 'Tanque supremo com alta regeneração e equilíbrio.' },
};

export const INITIAL_SKILLS: Skill[] = [
  { id: 'fury', name: 'Fúria Implacável', description: 'Aumenta o XP ganho em tarefas de alta raridade.', type: 'passiva', level: 0, maxLevel: 5, xpCostBase: 100, icon: '🔥', effect: '+10% XP p/ nível (Épicas/Lendárias)' },
  { id: 'greed', name: 'Olhar da Ganância', description: 'Aumenta o ganho de ouro em todas as tarefas.', type: 'passiva', level: 0, maxLevel: 5, xpCostBase: 120, icon: '💰', effect: '+5% Ouro p/ nível' },
  { id: 'meditation', name: 'Meditação Arcana', description: 'Ativa: cura vida imediatamente.', type: 'ativa', level: 0, maxLevel: 5, xpCostBase: 150, icon: '🧘', effect: 'Recupera 10 HP (+5 p/ nível). Cooldown: 1 hora.' },
  { id: 'iron_skin', name: 'Pele de Ferro', description: 'Reduz o dano recebido ao falhar tarefas.', type: 'passiva', level: 0, maxLevel: 5, xpCostBase: 180, icon: '🛡️', effect: '-5% Dano p/ nível' }
];

export const CAMPAIGN_CHAPTERS: CampaignMission[] = [
  { id: 'c1', title: 'O Despertar', description: 'Complete sua primeira tarefa no reino.', requiredLevel: 1, xpReward: 50, goldReward: 20, completed: false, chapter: 1 },
  { id: 'c2', title: 'Recrutamento', description: 'Alcance o Nível 3 para ser notado pela guilda.', requiredLevel: 3, xpReward: 150, goldReward: 50, completed: false, chapter: 2 },
  { id: 'c3', title: 'Prova de Fogo', description: 'Acumule 500 de ouro para comprar seu primeiro equipamento sério.', requiredLevel: 5, xpReward: 300, goldReward: 100, completed: false, chapter: 3 },
  { id: 'c4', title: 'Senda Lendária', description: 'Complete uma tarefa de raridade Lendária.', requiredLevel: 8, xpReward: 1000, goldReward: 500, completed: false, chapter: 4 },
];

export const SHOP_ITEMS: InventoryItem[] = [
  { id: 'potion-0', name: 'Maçã Curativa', rarity: 'comum', price: 5, description: 'Recupera 5 de HP.', lore: 'Fruta fresca colhida nos Pomares de Éden.', type: 'buff', icon: '🍎' },
  { id: 'potion-1', name: 'Poção de Foco', rarity: 'raro', price: 20, description: 'Recupera 20 de HP.', lore: 'Uma mistura alquímica que aguça os sentidos.', type: 'buff', icon: '🧪' },
  
  { id: 'head-0', name: 'Capuz do Aprendiz', rarity: 'comum', price: 50, description: '+5% de ganho de XP.', lore: 'Um tecido leve imbuído com runas básicas.', type: 'equipment', slot: 'head', boostValue: 5, statBoost: 'XP', icon: '👤' },
  { id: 'head-1', name: 'Elmo de Ferro', rarity: 'raro', price: 200, description: '+10% de Vitalidade Máxima.', lore: 'Forjado nas forjas de Ironhold.', type: 'equipment', slot: 'head', boostValue: 10, statBoost: 'HP', icon: '🪖' },
  { id: 'head-legend', name: 'Coroa do Rei', rarity: 'lendario', price: 800, description: '+25% de ganho de Ouro.', lore: 'Antigo artefato da Dinastia de Ouro.', type: 'equipment', slot: 'head', boostValue: 25, statBoost: 'Gold', icon: '👑', isAnimated: true },
  
  { id: 'body-0', name: 'Túnica de Couro', rarity: 'comum', price: 80, description: '+5% de ganho de Ouro.', lore: 'Feita de couro de javali selvagem.', type: 'equipment', slot: 'body', boostValue: 5, statBoost: 'Gold', icon: '👕' },
  { id: 'body-1', name: 'Armadura de Placas', rarity: 'epico', price: 500, description: '+15% de Vitalidade Máxima.', lore: 'Várias camadas de aço dobrado.', type: 'equipment', slot: 'body', boostValue: 15, statBoost: 'HP', icon: '🛡️' },

  { id: 'acc-0', name: 'Anel de Cobre', rarity: 'comum', price: 40, description: '+2% de ganho de XP.', lore: 'Um pequeno anel que canaliza energia residual.', type: 'equipment', slot: 'acc1', boostValue: 2, statBoost: 'XP', icon: '💍' },
  { id: 'acc-1', name: 'Amuleto da Sorte', rarity: 'raro', price: 150, description: '+8% de ganho de Ouro.', lore: 'Dizem que este trevo nunca murcha.', type: 'equipment', slot: 'acc2', boostValue: 8, statBoost: 'Gold', icon: '📿' },

  { id: 'spec-0', name: 'Manto do Mago', rarity: 'lendario', price: 1000, description: '+25% de ganho de XP.', lore: 'Tecido com fios de seda arcana.', type: 'equipment', slot: 'special', boostValue: 25, statBoost: 'XP', icon: '🧥', isAnimated: true },
  
  { id: 'skin-royal', name: 'Traje Real', rarity: 'epico', price: 300, description: 'Alteração visual completa.', lore: 'Tecidos de seda púrpura e fios de ouro puro.', type: 'skin', icon: '🎭', isAnimated: true },
  { id: 'skin-dark', name: 'Manto das Sombras', rarity: 'lendario', price: 450, description: 'Aura sombria constante.', lore: 'Uma peça que parece absorver a luz ao redor.', type: 'skin', icon: '🕶️', isAnimated: true },
];

export const THEMES = {
  'theme-default': { primary: 'red-600', ring: 'ring-red-600/20', text: 'text-red-500', bg: 'bg-zinc-950' },
  'theme-emerald': { primary: 'emerald-600', ring: 'ring-emerald-600/20', text: 'text-emerald-500', bg: 'bg-zinc-950' },
  'theme-arcane': { primary: 'indigo-600', ring: 'ring-indigo-600/20', text: 'text-indigo-500', bg: 'bg-zinc-950' },
};
