import React, { useState, useEffect } from 'react';
import { FloatingNotepad } from './components/FloatingNotepad';
import { MascotCharacter } from './components/MascotCharacter';
import { MobileInstallGuideModal } from './components/MobileInstallGuideModal';
import { SettingsModal } from './components/SettingsModal';

import type { Idea } from './types/idea';
import {
  loadLocalIdeas,
  saveLocalIdeas,
  syncAllWithCloud,
  exportIdeasToMarkdown,
  playAudioFeedback,
  createBlankIdea,
  loadActiveIdeaIndex,
  saveActiveIdeaIndex,
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
      moveWindowBy?: (dx: number, dy: number) => void;
      onExpandNotepad?: (callback: () => void) => void;
      togglePin?: () => void;
    };
  }
}

export const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    const loaded = loadLocalIdeas();
    if (loaded.length === 0) {
      const blank = [createBlankIdea('Quick Note', '')];
      saveLocalIdeas(blank);
      return blank;
    }
    return loaded;
  });
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState<number>(() => {
    const loaded = loadLocalIdeas();
    return loadActiveIdeaIndex(Math.max(0, loaded.length - 1));
  });
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

  // Mascot drag & click detection
  const mascotDragRef = React.useRef({
    isDragging: false,
    startScreenX: 0,
    startScreenY: 0,
    moved: false,
  });

  const handleMascotMouseDown = (e: React.MouseEvent) => {
    mascotDragRef.current = {
      isDragging: true,
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      moved: false,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotDragRef.current.isDragging) return;
      const dx = e.screenX - mascotDragRef.current.startScreenX;
      const dy = e.screenY - mascotDragRef.current.startScreenY;
      if (Math.hypot(dx, dy) > 3) {
        mascotDragRef.current.moved = true;
      }
      mascotDragRef.current.startScreenX = e.screenX;
      mascotDragRef.current.startScreenY = e.screenY;

      if (window.electronAPI?.moveWindowBy) {
        window.electronAPI.moveWindowBy(dx, dy);
      }
    };

    const handleMouseUp = () => {
      if (mascotDragRef.current.isDragging) {
        const wasClick = !mascotDragRef.current.moved;
        mascotDragRef.current.isDragging = false;
        if (wasClick) {
          playAudioFeedback('spark');
          toggleMinimize(false);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Listen for Electron expand signal (Dock click or Cmd+Shift+I)
  useEffect(() => {
    if (window.electronAPI?.onExpandNotepad) {
      window.electronAPI.onExpandNotepad(() => {
        toggleMinimize(false);
      });
    }
  }, []);

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

  const handleSelectIdeaIndex = (idx: number) => {
    setCurrentIdeaIndex(idx);
    saveActiveIdeaIndex(idx);
  };

  // Create new idea note
  const handleCreateNewIdea = (title = 'Quick Note', initialContent = '') => {
    playAudioFeedback('spark');
    const newIdea = createBlankIdea(title, initialContent);

    const updatedList = [newIdea, ...ideas];
    setIdeas(updatedList);
    setCurrentIdeaIndex(0);
    saveActiveIdeaIndex(0);
    saveLocalIdeas(updatedList);
    syncIdeaToCloud(newIdea);

    // Expand notepad
    toggleMinimize(false);
  };

  // Update existing idea note
  const handleUpdateIdea = (updated: Idea) => {
    let exists = false;
    const updatedList = ideas.map((i) => {
      if (i.id === updated.id) {
        exists = true;
        return updated;
      }
      return i;
    });

    const finalList = exists ? updatedList : [updated, ...ideas];
    setIdeas(finalList);
    saveLocalIdeas(finalList);
    syncIdeaToCloud(updated);
  };

  // Delete current idea
  const handleDeleteCurrentIdea = (id: string) => {
    let updatedList = ideas.filter((i) => i.id !== id);
    if (updatedList.length === 0) {
      updatedList = [createBlankIdea('Quick Note', '')];
    }
    setIdeas(updatedList);
    const nextIdx = Math.max(0, Math.min(currentIdeaIndex, updatedList.length - 1));
    setCurrentIdeaIndex(nextIdx);
    saveActiveIdeaIndex(nextIdx);
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
    const blank = [createBlankIdea('Quick Note', '')];
    setIdeas(blank);
    setCurrentIdeaIndex(0);
    saveActiveIdeaIndex(0);
    saveLocalIdeas(blank);
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
          onMouseDown={handleMascotMouseDown}
          onClick={() => {
            playAudioFeedback('spark');
            toggleMinimize(false);
          }}
          onMouseEnter={() => setIsIdle(false)}
          title="Click to write an idea! (Or drag to move)"
        >
          <MascotCharacter size={68} ideaCount={ideas.length} showBadge={true} />
        </div>
      ) : (
        /* State 2: When Open, ONLY the notepad is displayed (fills the window directly) */
        <FloatingNotepad
          ideas={ideas}
          currentIdeaIndex={currentIdeaIndex}
          setCurrentIdeaIndex={handleSelectIdeaIndex}
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
