import React, { useState, useEffect } from 'react';
import { FloatingNotepad } from './components/FloatingNotepad';
import { FloatingMascotWidget } from './components/FloatingMascotWidget';
import { MobileInstallGuideModal } from './components/MobileInstallGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { MascotCharacter } from './components/MascotCharacter';

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
import {
  Smartphone,
  Settings,
  Plus,
  Cloud,
  Download,
} from 'lucide-react';

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
  const [isCloudConnected, setIsCloudConnected] = useState(false);

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
      // ⌘N or Ctrl+N -> New Page
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewIdea();
      }
      // Esc -> Toggle minimize or close modal
      if (e.key === 'Escape') {
        if (isInstallGuideOpen || isSettingsOpen) {
          setIsInstallGuideOpen(false);
          setIsSettingsOpen(false);
        } else {
          toggleMinimize();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInstallGuideOpen, isSettingsOpen, isMinimized, ideas]);

  const toggleMinimize = (minimizedState?: boolean) => {
    setIsMinimized((prev) => {
      const next = typeof minimizedState === 'boolean' ? minimizedState : !prev;
      try {
        localStorage.setItem('ideanoter_minimized_v1', String(next));
      } catch {}
      return next;
    });
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

    // Make sure notepad is open
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

  // Reset to seed demo data
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
    <div className="retro-desk-canvas">
      {/* Vintage Top Navigation Ribbon */}
      <header className="retro-top-ribbon">
        <div className="ribbon-brand-left" onClick={() => toggleMinimize(false)}>
          <MascotCharacter size={32} showBadge={false} />
          <div>
            <h1 className="ribbon-title">IdeaNoter</h1>
            <span className="ribbon-subtitle">Floating Quick Pad • Bright & Retro</span>
          </div>
        </div>

        <div className="ribbon-actions-right">
          {/* Quick Tear New Page Button */}
          <button className="ribbon-btn ribbon-btn-primary" onClick={() => handleCreateNewIdea()}>
            <Plus size={15} />
            <span>New Note</span>
            <kbd className="ribbon-kbd">⌘N</kbd>
          </button>

          {/* Sync status */}
          <button
            className={`ribbon-pill-btn ${isCloudConnected ? 'connected' : 'local'}`}
            onClick={() => setIsSettingsOpen(true)}
            title="Cloud Sync Status (Click to configure)"
          >
            <Cloud size={13} />
            <span className="hide-mobile">{isCloudConnected ? 'Cloud Synced' : 'Local Vault'}</span>
          </button>

          {/* iPhone / Mobile App Guide */}
          <button
            className="ribbon-pill-btn"
            onClick={() => setIsInstallGuideOpen(true)}
            title="Get on iPhone / Mobile"
          >
            <Smartphone size={14} />
            <span className="hide-mobile">Get on iPhone</span>
          </button>

          {/* Export Notes */}
          <button
            className="ribbon-icon-btn"
            onClick={() => exportIdeasToMarkdown(ideas)}
            title="Export Markdown Notes"
          >
            <Download size={15} />
          </button>

          {/* Settings */}
          <button
            className="ribbon-icon-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings & Backups"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="retro-workspace-body">
        {/* If Not Minimized: Show Draggable Floating Notepad */}
        {!isMinimized && (
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

        {/* If Minimized: Show Floating Cute Character Mascot Widget */}
        {isMinimized && (
          <FloatingMascotWidget
            ideaCount={ideas.length}
            onOpenNotepad={() => toggleMinimize(false)}
            onQuickNewNote={() => handleCreateNewIdea()}
            onOpenMobileGuide={() => setIsInstallGuideOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Mobile Install Guide Modal */}
      <MobileInstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      {/* Settings & Supabase Cloud Sync Modal */}
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
