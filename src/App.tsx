import React, { useState, useEffect } from 'react';
import { FloatingNotepad } from './components/FloatingNotepad';
import { MascotCharacter } from './components/MascotCharacter';
import { MobileInstallGuideModal } from './components/MobileInstallGuideModal';
import { SettingsModal } from './components/SettingsModal';

import type { Idea } from './types/idea';
import { INITIAL_IDEAS } from './data/seedIdeas';
import {
  loadLocalIdeas,
  saveLocalIdeas,
  syncAllWithCloud,
  exportIdeasToMarkdown,
  playAudioFeedback,
} from './services/storage';
import {
  getSavedSupabaseConfig,
  syncIdeaToCloud,
  deleteIdeaFromCloud,
} from './services/supabase';

// Helper for Electron window resizing
declare global {
  interface Window {
    electronAPI?: {
      resizeToMascot: () => void;
      resizeToNotepad: () => void;
      setAlwaysOnTop: (flag: boolean) => void;
      setWindowOpacity: (opacity: number) => void;
      closeWindow: () => void;
    };
  }
}

export const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>(() => loadLocalIdeas());
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ideanoter_minimized_v1') === 'true';
    } catch {
      return false;
    }
  });

  // Modals state
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [_isCloudConnected, setIsCloudConnected] = useState(false);

  // Auto-invisibility when idle for minimized mascot
  const [isIdle, setIsIdle] = useState(false);

  // Sync window size with initial minimized state
  useEffect(() => {
    if (isMinimized) {
      window.electronAPI?.resizeToMascot();
    } else {
      window.electronAPI?.resizeToNotepad();
    }
  }, []);

  // Idle timer for mascot
  useEffect(() => {
    let timer: any = null;
    if (isMinimized) {
      timer = setTimeout(() => {
        setIsIdle(true);
      }, 4000);
    } else {
      setIsIdle(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isMinimized]);

  // Initial cloud sync
  useEffect(() => {
    const config = getSavedSupabaseConfig();
    if (config.url && config.anonKey) {
      setIsCloudConnected(true);
      syncAllWithCloud(ideas).then(({ updatedIdeas, cloudAvailable }) => {
        if (cloudAvailable) {
          setIdeas(updatedIdeas);
          setIsCloudConnected(true);
        }
      });
    }
  }, []);

  // Keyboard shortcut listener (⌘N for new sheet, Esc to toggle minimize)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewIdea();
      }
      if (e.key === 'Escape') {
        if (isInstallGuideOpen || isSettingsOpen) {
          setIsInstallGuideOpen(false);
          setIsSettingsOpen(false);
        } else {
          toggleMinimize(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInstallGuideOpen, isSettingsOpen, isMinimized, ideas]);

  const toggleMinimize = (minimizedState: boolean) => {
    setIsMinimized(minimizedState);
    try {
      localStorage.setItem('ideanoter_minimized_v1', String(minimizedState));
    } catch {}

    if (minimizedState) {
      window.electronAPI?.resizeToMascot();
    } else {
      setIsIdle(false);
      window.electronAPI?.resizeToNotepad();
    }
  };

  // Create new idea note
  const handleCreateNewIdea = (title = 'New Spark') => {
    playAudioFeedback('spark');
    const now = new Date().toISOString();
    const newIdea: Idea = {
      id: 'idea-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: title,
      oneLiner: '',
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

    const updatedList = [newIdea, ...ideas];
    setIdeas(updatedList);
    setCurrentIdeaIndex(0);
    saveLocalIdeas(updatedList);
    syncIdeaToCloud(newIdea);

    // Expand notepad
    toggleMinimize(false);
  };

  // Update existing idea note
  const handleUpdateIdea = (updated: Idea) => {
    const updatedList = ideas.map((i) => (i.id === updated.id ? updated : i));
    setIdeas(updatedList);
    saveLocalIdeas(updatedList);
    syncIdeaToCloud(updated);
  };

  // Delete current idea
  const handleDeleteCurrentIdea = (id: string) => {
    const updatedList = ideas.filter((i) => i.id !== id);
    setIdeas(updatedList);
    setCurrentIdeaIndex((prev) => Math.max(0, Math.min(prev, updatedList.length - 1)));
    saveLocalIdeas(updatedList);
    deleteIdeaFromCloud(id);
  };

  // Import JSON ideas
  const handleImportIdeas = (imported: Idea[]) => {
    const updatedList = [...imported, ...ideas];
    const uniqueMap = new Map<string, Idea>();
    for (const item of updatedList) {
      uniqueMap.set(item.id, item);
    }
    const deduplicated = Array.from(uniqueMap.values());
    setIdeas(deduplicated);
    saveLocalIdeas(deduplicated);
    for (const idea of deduplicated) {
      syncIdeaToCloud(idea);
    }
  };

  const handleResetSeedData = () => {
    setIdeas(INITIAL_IDEAS);
    setCurrentIdeaIndex(0);
    saveLocalIdeas(INITIAL_IDEAS);
    for (const idea of INITIAL_IDEAS) {
      syncIdeaToCloud(idea);
    }
  };

  const handleTriggerSync = () => {
    syncAllWithCloud(ideas).then(({ updatedIdeas, cloudAvailable }) => {
      setIsCloudConnected(cloudAvailable);
      if (cloudAvailable) {
        setIdeas(updatedIdeas);
      }
    });
  };

  return (
    <div className="single-app-root">
      {/* State 1: When Minimized, ONLY the cute character mascot sits in the corner */}
      {isMinimized ? (
        <div
          className={`standalone-mascot-pill ${isIdle ? 'mascot-ghost-idle' : ''}`}
          onClick={() => {
            playAudioFeedback('spark');
            toggleMinimize(false);
          }}
          onMouseEnter={() => setIsIdle(false)}
          title="Click to write an idea!"
        >
          <MascotCharacter size={68} ideaCount={ideas.length} showBadge={true} />
        </div>
      ) : (
        /* State 2: When Open, ONLY the notepad is displayed (fills the window directly) */
        <FloatingNotepad
          ideas={ideas}
          currentIdeaIndex={currentIdeaIndex}
          setCurrentIdeaIndex={setCurrentIdeaIndex}
          onUpdateIdea={handleUpdateIdea}
          onCreateNewIdea={handleCreateNewIdea}
          onDeleteCurrentIdea={handleDeleteCurrentIdea}
          onMinimize={() => toggleMinimize(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMobileGuide={() => setIsInstallGuideOpen(true)}
          onExportMarkdown={() => exportIdeasToMarkdown(ideas)}
        />
      )}

      {/* Mobile Install Guide Modal */}
      <MobileInstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ideas={ideas}
        onImportIdeas={handleImportIdeas}
        onResetSeedData={handleResetSeedData}
        onTriggerSync={handleTriggerSync}
      />
    </div>
  );
};

export default App;
