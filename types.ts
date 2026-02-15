
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario' | 'extremo';
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type CharacterClass = 'Guerreiro' | 'Mago' | 'Ladino' | 'Paladino';
export type ItemType = 'buff' | 'cosmetic' | 'equipment' | 'theme' | 'skin';
export type SkillType = 'ativa' | 'passiva';
export type EquipmentSlot = 'head' | 'body' | 'acc1' | 'acc2' | 'special';
export type TalentTreeType = 'vitalidade' | 'sabedoria' | 'prosperidade' | 'combate';

export interface Appearance {
  skinColor: string;
  hairStyle: 'none' | 'short' | 'long' | 'spiky' | 'mohawk' | 'bob' | 'braids' | 'hood';
  hairColor: string;
  facialHair: 'none' | 'stubble' | 'beard' | 'goatee' | 'mustache';
  facialHairColor: string;
  eyebrowStyle: 'none' | 'normal' | 'thick' | 'thin' | 'angry';
  eyeStyle: 'round' | 'sharp' | 'closed' | 'large' | 'glow';
  eyeColor: string;
  expression: 'neutral' | 'happy' | 'focused' | 'tired' | 'grin' | 'angry' | 'surprised';
  outfitColor: string;
  outfitId?: string; 
  neckOffset?: number;
  fringeDepth?: number;
  fringeCurvature?: number;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  tree: TalentTreeType;
  level: number;
  maxLevel: number;
  icon: string;
  effectValue: number; 
  requiredTalentId?: string;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  isBoss: boolean;
  appearance: Appearance;
  rewards: { xp: number; gold: number; itemChance: number };
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

// Novo tipo para dados que podem ser vistos por outros usuários (Ranking/Social)
export interface PublicProfile {
  email: string;
  nickname: string;
  charClass: CharacterClass;
  xp: number;
  level: number;
  appearance: Appearance;
  avatar: string;
  guildId: string | null;
  friendRequests?: FriendRequest[];
}

export interface User extends PublicProfile {
  gold: number;
  hp: number;
  maxHp: number;
  isBroken: boolean;
  inventoryCapacity: number;
  activeTheme: string; 
  tasks: Task[];
  inventory: InventoryItem[];
  talents: Talent[];
  talentPoints: number;
  equipment: Record<EquipmentSlot, string | null>;
  campaignProgress: number; 
  friends: string[]; 
}

export interface RarityConfig {
  xp: number;
  gold: number;
  color: string;
  bg: string;
  shadow: string;
  multiplier: number; 
}

export interface FriendRequest {
  fromEmail: string;
  fromNickname: string;
  status: 'pending' | 'accepted' | 'declined';
}
