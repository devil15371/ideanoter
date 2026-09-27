import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Idea, SupabaseConfig } from '../types/idea';

const STORAGE_KEY_CONFIG = 'ideanoter_supabase_config_v1';

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read Supabase config from storage', e);
  }
  return {
    url: '',
    anonKey: '',
    tableName: 'ideas',
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Supabase config', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient | null {
  const cfg = config || getSavedSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    supabaseInstance = null;
    return null;
  }
  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(cfg.url, cfg.anonKey);
    }
    return supabaseInstance;
  } catch (e) {
    console.error('Failed to initialize Supabase client', e);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string, tableName = 'ideas'): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey);
    const { data, error } = await client.from(tableName).select('id').limit(1);
    if (error) {
      // If table does not exist yet, but credentials work
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: table "ideas" needs to be created using the SQL snippet below).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: `Connected successfully! Found ${data ? data.length : 0} rows in table "${tableName}".` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Connection failed' };
  }
}

// Map Idea to database record
function toDbRecord(idea: Idea) {
  return {
    id: idea.id,
    title: idea.title,
    one_liner: idea.oneLiner,
    problem: idea.problem || '',
    solution: idea.solution || '',
    target_audience: idea.targetAudience || '',
    monetization: idea.monetization || '',
    moat: idea.moat || '',
    competitors: idea.competitors || '',
    category: idea.category,
    stage: idea.stage,
    excitement: idea.excitement,
    market_size: idea.marketSize,
    feasibility: idea.feasibility,
    tags: idea.tags,
    checklist: idea.checklist,
    voice_transcript: idea.voiceTranscript || '',
    pinned: idea.pinned,
    is_favorite: idea.isFavorite,
    created_at: idea.createdAt,
    updated_at: idea.updatedAt,
  };
}

// Map database record to Idea
function fromDbRecord(row: any): Idea {
  return {
    id: row.id,
    title: row.title || 'Untitled Idea',
    oneLiner: row.one_liner || '',
    problem: row.problem || '',
    solution: row.solution || '',
    targetAudience: row.target_audience || '',
    monetization: row.monetization || '',
    moat: row.moat || '',
    competitors: row.competitors || '',
    category: row.category || 'Other',
    stage: row.stage || 'spark',
    excitement: row.excitement || 3,
    marketSize: row.market_size || 3,
    feasibility: row.feasibility || 3,
    tags: Array.isArray(row.tags) ? row.tags : [],
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    voiceTranscript: row.voice_transcript || '',
    pinned: !!row.pinned,
    isFavorite: !!row.is_favorite,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function fetchIdeasFromCloud(): Promise<Idea[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const config = getSavedSupabaseConfig();
  const { data, error } = await client.from(config.tableName || 'ideas').select('*').order('updated_at', { ascending: false });
  if (error) {
    console.error('Error fetching ideas from Supabase:', error);
    return null;
  }
  return data ? data.map(fromDbRecord) : [];
}

export async function syncIdeaToCloud(idea: Idea): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const config = getSavedSupabaseConfig();
  const record = toDbRecord(idea);
  const { error } = await client.from(config.tableName || 'ideas').upsert(record);
  if (error) {
    console.error('Error syncing idea to Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteIdeaFromCloud(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const config = getSavedSupabaseConfig();
  const { error } = await client.from(config.tableName || 'ideas').delete().eq('id', id);
  if (error) {
    console.error('Error deleting idea from Supabase:', error);
    return false;
  }
  return true;
}

export const SUPABASE_SQL_SCHEMA = `-- Run this in your Supabase SQL Editor:
create table if not exists ideas (
  id text primary key,
  title text not null,
  one_liner text,
  problem text,
  solution text,
  target_audience text,
  monetization text,
  moat text,
  competitors text,
  category text default 'Other',
  stage text default 'spark',
  excitement integer default 3,
  market_size integer default 3,
  feasibility integer default 3,
  tags jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  voice_transcript text,
  pinned boolean default false,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable public read/write or add Row Level Security (RLS) policies as needed
alter table ideas enable row level security;
create policy "Allow all operations for authenticated and anon users" on ideas
  for all using (true) with check (true);
`;
