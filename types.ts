
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario';
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type CharacterClass = 'Guerreiro' | 'Mago' | 'Ladino' | 'Paladino';
export type ItemType = 'buff' | 'cosmetic' | 'equipment' | 'theme' | 'skin';
export type SkillType = 'ativa' | 'passiva';
export type EquipmentSlot = 'head' | 'body' | 'acc1' | 'acc2' | 'special';

export interface Appearance {
  skinColor: string;
  hairStyle: 'none' | 'short' | 'long' | 'spiky' | 'hood' | 'helmet';
  hairColor: string;
  eyeColor: string;
  expression: 'neutral' | 'happy' | 'focused' | 'tired' | 'grin';
  outfitColor: string;
  outfitId?: string; 
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  level: number;
  maxLevel: number;
  xpCostBase: number;
  icon: string;
  effect: string;
  lastUsed?: number;
}

export interface Task {
  id: string;
  title: string;
  rarity: Rarity;
  difficulty: Difficulty;
  durationMinutes: number;
  startTime: number | null;
  done: boolean;
  createdAt: number;
  activeSkillApplied?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  description: string;
  lore?: string;
  type: ItemType;
  slot?: EquipmentSlot;
  statBoost?: string;
  boostValue?: number;
  icon: string;
  themeClass?: string; 
  isAnimated?: boolean;
  quantity?: number; // Suporte para stack
}

export interface CampaignMission {
  id: string;
  title: string;
  description: string;
  requiredLevel: number;
  xpReward: number;
  goldReward: number;
  completed: boolean;
  chapter: number;
}

export interface User {
  email: string;
  nickname: string;
  charClass: CharacterClass;
  avatar: string; 
  profileImage?: string; 
  appearance: Appearance;
  xp: number;
  level: number;
  gold: number;
  hp: number;
  maxHp: number;
  inventoryCapacity: number;
  activeTheme: string; 
  tasks: Task[];
  inventory: InventoryItem[];
  skills: Skill[];
  equippedSkills: string[];
  equipment: Record<EquipmentSlot, string | null>;
  campaignProgress: number; 
}

export interface RarityConfig {
  xp: number;
  gold: number;
  color: string;
  bg: string;
  shadow: string;
}
