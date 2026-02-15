
import { Rarity, Difficulty, CharacterClass, Talent, InventoryItem } from './types';

export const BASE_INVENTORY_CAPACITY = 15;
export const BASE_MIN_TIME_MINUTES = 5;

export const RARITIES: Record<Rarity, any> = {
  comum: { xp: 15, gold: 5, color: "text-zinc-400 border-zinc-700", bg: "bg-zinc-950", shadow: "", multiplier: 1.0, hpCost: 5 },
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

export const CLASS_PASSIVES: Record<CharacterClass, { name: string, description: string, icon: string, effect: string }> = {
  Guerreiro: { name: 'Fúria do Combate', description: 'Ouro extra por cada tarefa concluída.', icon: '⚔️', effect: '+20% de Ouro' },
  Mago: { name: 'Mente Clara', description: 'Experiência amplificada pelo estudo constante.', icon: '🪄', effect: '+20% de XP' },
  Ladino: { name: 'Pés Leves', description: 'Chance de evitar fadiga ao abandonar missões.', icon: '🏹', effect: '15% Chance de Esquiva' },
  Paladino: { name: 'Aura de Cura', description: 'Recuperação natural de vida acelerada.', icon: '🛡️', effect: '+2 HP a cada 30s' },
};

export const CLASS_STATS: Record<CharacterClass, { hp: number }> = {
  Guerreiro: { hp: 150 },
  Mago: { hp: 100 },
  Ladino: { hp: 120 },
  Paladino: { hp: 180 },
};

export const INITIAL_TALENTS: Talent[] = [
  // Vitalidade
  { id: 'vit_1', name: 'Couraça de Ferro', description: 'Vida máxima +20 por nível.', tree: 'vitalidade', level: 0, maxLevel: 5, icon: '🩸', effectValue: 20 },
  { id: 'vit_2', name: 'Resiliência', description: 'Mitigação de dano +5%.', tree: 'vitalidade', level: 0, maxLevel: 5, icon: '🛡️', effectValue: 5, requiredTalentId: 'vit_1' },
  
  // Sabedoria
  { id: 'sab_1', name: 'Mente Ágil', description: 'XP bônus +5%.', tree: 'sabedoria', level: 0, maxLevel: 5, icon: '📖', effectValue: 5 },
  { id: 'sab_2', name: 'Foco Profundo', description: 'Tempo mínimo -10%.', tree: 'sabedoria', level: 0, maxLevel: 5, icon: '👁️', effectValue: 10, requiredTalentId: 'sab_1' },

  // Prosperidade
  { id: 'pro_1', name: 'Bolsa Furada', description: 'Ouro bônus +5%.', tree: 'prosperidade', level: 0, maxLevel: 5, icon: '💰', effectValue: 5 },
  { id: 'pro_2', name: 'Negociador', description: 'Preço da loja -5%.', tree: 'prosperidade', level: 0, maxLevel: 5, icon: '🤝', effectValue: 5, requiredTalentId: 'pro_1' },

  // Combate
  { id: 'com_1', name: 'Gume Afiado', description: 'Dano de ataque +10%.', tree: 'combate', level: 0, maxLevel: 5, icon: '⚔️', effectValue: 10 },
  { id: 'com_2', name: 'Sorte do Duelista', description: 'Chance de crítico +5%.', tree: 'combate', level: 0, maxLevel: 5, icon: '🎲', effectValue: 5, requiredTalentId: 'com_1' },
  { id: 'com_3', name: 'Drenagem de Alma', description: 'Cura ao vencer +15 HP.', tree: 'combate', level: 0, maxLevel: 5, icon: '🧛', effectValue: 15, requiredTalentId: 'com_2' },
];

export const SHOP_ITEMS: InventoryItem[] = [
  { id: 'potion-0', name: 'Maçã Curativa', rarity: 'comum', price: 5, description: 'Recupera 5 de HP.', type: 'buff', icon: '🍎' },
  { id: 'potion-1', name: 'Poção de Foco', rarity: 'raro', price: 20, description: 'Recupera 20 de HP.', type: 'buff', icon: '🧪' },
  { id: 'head-1', name: 'Elmo de Ferro', rarity: 'raro', price: 200, description: '+15% de Vida Máxima (HP).', type: 'equipment', slot: 'head', icon: '🪖' },
  { id: 'body-1', name: 'Armadura de Placas', rarity: 'epico', price: 500, description: '+25% de Vida Máxima (HP).', type: 'equipment', slot: 'body', icon: '🛡️' },
  { id: 'skin-hood', name: 'Capuz de Sombras', rarity: 'epico', price: 350, description: 'Um capuz místico que oculta sua face.', type: 'equipment', slot: 'head', icon: '🥷' },
];

export const CAMPAIGN_CHAPTERS = [
  { id: 'ch1', title: 'O Despertar', description: 'O início de sua jornada pelas terras de Eldoria.', requiredLevel: 1, xpReward: 100, goldReward: 50 },
  { id: 'ch2', title: 'As Minas de Ferro', description: 'Enfrente os goblins que assolam as minas.', requiredLevel: 3, xpReward: 300, goldReward: 150 },
  { id: 'ch3', title: 'O Pântano Sombrio', description: 'Atravesse as névoas tóxicas do sul.', requiredLevel: 5, xpReward: 600, goldReward: 300 },
];

export const THEMES = {
  'theme-default': { primary: 'red-600', bg: 'bg-zinc-950', accent: 'red' },
  'theme-abyssal': { primary: 'indigo-600', bg: 'bg-zinc-950', accent: 'indigo' },
};
