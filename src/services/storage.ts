import type { Idea } from '../types/idea';
import {
  getSupabaseClient,
  fetchIdeasFromCloud,
  syncIdeaToCloud,
} from './supabase';

const STORAGE_KEY_IDEAS = 'ideanoter_ideas_vault_v1';
const STORAGE_KEY_ACTIVE_INDEX = 'ideanoter_active_index_v1';
const STORAGE_KEY_DRAFT = 'ideanoter_active_draft_v1';

export function createBlankIdea(title = 'Quick Note', content = ''): Idea {
  const now = new Date().toISOString();
  return {
    id: 'idea-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    title,
    oneLiner: content,
    category: 'AI',
    stage: 'spark',
    excitement: 4,
    marketSize: 4,
    feasibility: 4,
    tags: ['Quick Note'],
    checklist: [],
    pinned: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function loadLocalIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IDEAS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) {
          return parsed;
        } else {
          // If vault was empty, return 1 clean blank note so user can type immediately
          const blank = [createBlankIdea('Quick Note', '')];
          saveLocalIdeas(blank);
          return blank;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load local ideas', e);
  }
  // First time launch: start with 1 fresh blank note ready for writing
  const initial = [createBlankIdea('Quick Note', '')];
  saveLocalIdeas(initial);
  return initial;
}

export function saveLocalIdeas(ideas: Idea[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(ideas));
  } catch (e) {
    console.error('Failed to save ideas to local storage', e);
  }
}

export function loadActiveIdeaIndex(maxIndex: number): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_INDEX);
    if (raw !== null) {
      const idx = parseInt(raw, 10);
      if (!isNaN(idx) && idx >= 0 && idx <= maxIndex) {
        return idx;
      }
    }
  } catch {}
  return 0;
}

export function saveActiveIdeaIndex(index: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_INDEX, String(index));
  } catch {}
}

export function saveActiveDraft(draft: { title: string; content: string; category?: string }): void {
  try {
    localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
  } catch {}
}

export function loadActiveDraft(): { title: string; content: string; category?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function syncAllWithCloud(localIdeas: Idea[]): Promise<{ updatedIdeas: Idea[]; cloudAvailable: boolean }> {
  const client = getSupabaseClient();
  if (!client) {
    return { updatedIdeas: localIdeas, cloudAvailable: false };
  }
  try {
    const cloudIdeas = await fetchIdeasFromCloud();
    if (!cloudIdeas) {
      return { updatedIdeas: localIdeas, cloudAvailable: false };
    }

    // Merge: combine local and cloud, keeping the most recently updated record
    const mergedMap = new Map<string, Idea>();
    for (const idea of localIdeas) {
      mergedMap.set(idea.id, idea);
    }
    for (const cloudIdea of cloudIdeas) {
      const local = mergedMap.get(cloudIdea.id);
      if (!local || new Date(cloudIdea.updatedAt) > new Date(local.updatedAt)) {
        mergedMap.set(cloudIdea.id, cloudIdea);
      }
    }

    const mergedList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    saveLocalIdeas(mergedList);

    // Sync any newer local ideas back to cloud in background
    for (const idea of mergedList) {
      syncIdeaToCloud(idea).catch(() => {});
    }

    return { updatedIdeas: mergedList, cloudAvailable: true };
  } catch (e) {
    console.error('Cloud sync error:', e);
    return { updatedIdeas: localIdeas, cloudAvailable: false };
  }
}

export function exportIdeasToJSON(ideas: Idea[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ideas, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const date = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `ideanoter-backup-${date}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportIdeasToMarkdown(ideas: Idea[]): void {
  let md = `# 💡 IdeaNoter Vault Export\n*Generated on ${new Date().toLocaleString()}*\n\n`;
  for (const idea of ideas) {
    md += `## ${idea.title}\n`;
    md += `**Category:** ${idea.category} | **Stage:** ${idea.stage.toUpperCase()} | **Score:** ${idea.excitement * 20}%\n`;
    md += `**Pitch:** ${idea.oneLiner}\n\n`;
    if (idea.problem) md += `### Problem\n${idea.problem}\n\n`;
    if (idea.solution) md += `### Solution\n${idea.solution}\n\n`;
    if (idea.targetAudience) md += `### Target Audience\n${idea.targetAudience}\n\n`;
    if (idea.monetization) md += `### Monetization\n${idea.monetization}\n\n`;
    if (idea.moat) md += `### Moat / Unfair Advantage\n${idea.moat}\n\n`;
    if (idea.competitors) md += `### Competitors\n${idea.competitors}\n\n`;
    if (idea.checklist && idea.checklist.length > 0) {
      md += `### Next Steps\n`;
      for (const item of idea.checklist) {
        md += `- [${item.done ? 'x' : ' '}] ${item.text}\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  const date = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `ideanoter-notes-${date}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

export function playAudioFeedback(type: 'click' | 'spark' | 'launch'): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'spark') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'launch') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(659.25, audioCtx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(987.77, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    }
  } catch {
    // AudioContext might not be allowed before user interaction
  }
}
