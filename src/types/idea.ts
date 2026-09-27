export type IdeaCategory =
  | 'AI'
  | 'SaaS'
  | 'Mobile App'
  | 'B2B Tool'
  | 'Marketplace'
  | 'E-commerce'
  | 'Hardware'
  | 'Content / Media'
  | 'Life Hack'
  | 'Other';

export type IdeaStage = 'spark' | 'validating' | 'building' | 'launched' | 'archived';

export interface IdeaChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Idea {
  id: string;
  title: string;
  oneLiner: string;
  problem?: string;
  solution?: string;
  targetAudience?: string;
  monetization?: string;
  moat?: string;
  competitors?: string;
  category: IdeaCategory;
  stage: IdeaStage;
  excitement: number; // 1 to 5
  marketSize: number; // 1 to 5
  feasibility: number; // 1 to 5
  tags: string[];
  checklist: IdeaChecklistItem[];
  voiceTranscript?: string;
  pinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export interface AppSettings {
  supabase: SupabaseConfig;
  theme: 'dark' | 'midnight' | 'light';
  defaultCategory: IdeaCategory;
  enableSoundEffects: boolean;
}

export const CATEGORIES: { label: IdeaCategory; color: string; icon: string }[] = [
  { label: 'AI', color: '#8b5cf6', icon: 'Sparkles' },
  { label: 'SaaS', color: '#3b82f6', icon: 'Cloud' },
  { label: 'Mobile App', color: '#ec4899', icon: 'Smartphone' },
  { label: 'B2B Tool', color: '#10b981', icon: 'Briefcase' },
  { label: 'Marketplace', color: '#f59e0b', icon: 'ShoppingBag' },
  { label: 'E-commerce', color: '#06b6d4', icon: 'Store' },
  { label: 'Hardware', color: '#64748b', icon: 'Cpu' },
  { label: 'Content / Media', color: '#f43f5e', icon: 'Film' },
  { label: 'Life Hack', color: '#14b8a6', icon: 'Zap' },
  { label: 'Other', color: '#6b7280', icon: 'Folder' },
];

export const STAGES: { id: IdeaStage; label: string; emoji: string; desc: string; color: string }[] = [
  { id: 'spark', label: 'Spark', emoji: '💡', desc: 'Raw initial inspiration', color: '#eab308' },
  { id: 'validating', label: 'Validating', emoji: '🔍', desc: 'Customer & market research', color: '#3b82f6' },
  { id: 'building', label: 'Building', emoji: '🏗️', desc: 'Prototype or MVP in progress', color: '#a855f7' },
  { id: 'launched', label: 'Launched', emoji: '🚀', desc: 'Live in users hands', color: '#22c55e' },
  { id: 'archived', label: 'Archived', emoji: '📦', desc: 'Saved for future reference', color: '#64748b' },
];

export function calculateScore(idea: Idea): number {
  const e = idea.excitement || 3;
  const m = idea.marketSize || 3;
  const f = idea.feasibility || 3;
  // Weighted: Excitement 40%, Market 30%, Feasibility 30% -> max 25 points -> scaled to 100
  const score = Math.round(((e * 2.0) + (m * 1.5) + (f * 1.5)) / 25 * 100);
  return Math.min(100, Math.max(10, score));
}
