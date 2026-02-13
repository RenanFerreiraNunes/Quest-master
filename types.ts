
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario' | 'extremo';
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type CharacterClass = 'Guerreiro' | 'Mago' | 'Ladino' | 'Paladino';
export type ItemType = 'buff' | 'cosmetic' | 'equipment' | 'theme' | 'skin';
export type SkillType = 'ativa' | 'passiva';
export type EquipmentSlot = 'head' | 'body' | 'acc1' | 'acc2' | 'special';
export type GuildRank = 'Mestre' | 'Oficial' | 'Recruta';

export interface Appearance {
  skinColor: string;
  hairStyle: 'none' | 'short' | 'long' | 'spiky' | 'mohawk' | 'bob' | 'braids' | 'hood';
  hairColor: string;
  eyeStyle: 'round' | 'sharp' | 'closed' | 'large' | 'glow';
  eyeColor: string;
  expression: 'neutral' | 'happy' | 'focused' | 'tired' | 'grin' | 'angry' | 'surprised';
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
  minDurationSeconds: number;
  startTime: number | null;
  lastTickTime?: number;
  accumulatedTimeMs: number; 
  isPaused: boolean;
  done: boolean;
  failed?: boolean;
  doneAt?: number;
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
  rarity: Rarity;
  quantity?: number; 
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

export interface FriendRequest {
  fromEmail: string;
  fromNickname: string;
  status: 'pending' | 'accepted';
}

export interface Guild {
  id: string;
  name: string;
  icon: string;
  masterEmail: string;
  memberEmails: string[];
  totalXp: number;
  description: string;
  requiredLevel: number;
}

export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldownSeconds: number;
  type: 'buff' | 'instant';
}

export interface User {
  email: string;
  nickname: string;
  charClass: CharacterClass;
  avatar: string; 
  appearance: Appearance;
  xp: number;
  level: number;
  gold: number;
  hp: number;
  maxHp: number;
  isBroken: boolean;
  inventoryCapacity: number;
  activeTheme: string; 
  tasks: Task[];
  inventory: InventoryItem[];
  skills: Skill[];
  equippedSkills: string[];
  equipment: Record<EquipmentSlot, string | null>;
  campaignProgress: number; 
  friends: string[];
  friendRequests: FriendRequest[];
  guildId: string | null;
  lastAbilityUse?: Record<string, number>; // Rastreia cooldown por habilidade
}

export interface RarityConfig {
  xp: number;
  gold: number;
  color: string;
  bg: string;
  shadow: string;
  multiplier: number; 
}
