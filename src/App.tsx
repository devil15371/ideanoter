import React, { useState, useEffect, useMemo } from 'react';
import {
  Header,
} from './components/Header';
import { IdeaCard } from './components/IdeaCard';
import { KanbanBoard } from './components/KanbanBoard';
import { PriorityMatrix } from './components/PriorityMatrix';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { MobileInstallGuideModal } from './components/MobileInstallGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileTabBar } from './components/MobileTabBar';

import type { Idea, IdeaStage } from './types/idea';
import { calculateScore } from './types/idea';
import { INITIAL_IDEAS } from './data/seedIdeas';
import {
  loadLocalIdeas,
  saveLocalIdeas,
  syncAllWithCloud,
  exportIdeasToMarkdown,
  exportIdeasToJSON,
  playAudioFeedback,
} from './services/storage';
import {
  getSavedSupabaseConfig,
  syncIdeaToCloud,
  deleteIdeaFromCloud,
} from './services/supabase';
import { Plus, ArrowUpDown, Star } from 'lucide-react';

export const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>(() => loadLocalIdeas());
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'matrix'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'score' | 'excitement' | 'alphabetical'>('score');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
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

  // Keyboard shortcut listener (⌘N for capture, ⌘K for search, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘N or Ctrl+N -> Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingIdea(null);
        setIsQuickCaptureOpen(true);
      }
      // Esc -> close any open modals
      if (e.key === 'Escape') {
        setIsQuickCaptureOpen(false);
        setIsInstallGuideOpen(false);
        setIsSettingsOpen(false);
        setEditingIdea(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save idea handler (create or update)
  const handleSaveIdea = (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();

    if (editingIdea) {
      // Update existing
      const updated: Idea = {
        ...editingIdea,
        ...ideaData,
        updatedAt: now,
      };

      const updatedList = ideas.map((i) => (i.id === updated.id ? updated : i));
      setIdeas(updatedList);
      saveLocalIdeas(updatedList);
      syncIdeaToCloud(updated);
      setEditingIdea(null);
    } else {
      // Create new
      const newIdea: Idea = {
        id: 'idea-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        ...ideaData,
        createdAt: now,
        updatedAt: now,
      };

      const updatedList = [newIdea, ...ideas];
      setIdeas(updatedList);
      saveLocalIdeas(updatedList);
      syncIdeaToCloud(newIdea);
    }
  };

  // Update idea directly (from Card / Kanban toggle)
  const handleUpdateIdea = (updated: Idea) => {
    const updatedList = ideas.map((i) => (i.id === updated.id ? updated : i));
    setIdeas(updatedList);
    saveLocalIdeas(updatedList);
    syncIdeaToCloud(updated);
  };

  // Delete idea
  const handleDeleteIdea = (id: string) => {
    playAudioFeedback('click');
    const updatedList = ideas.filter((i) => i.id !== id);
    setIdeas(updatedList);
    saveLocalIdeas(updatedList);
    deleteIdeaFromCloud(id);
  };

  // Edit idea modal trigger
  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setIsQuickCaptureOpen(true);
  };

  // Quick Capture from column
  const handleOpenQuickCaptureWithStage = (_stage?: IdeaStage) => {
    setEditingIdea(null);
    setIsQuickCaptureOpen(true);
  };

  // Reset to seed data
  const handleResetSeedData = () => {
    setIdeas(INITIAL_IDEAS);
    saveLocalIdeas(INITIAL_IDEAS);
    for (const idea of INITIAL_IDEAS) {
      syncIdeaToCloud(idea);
    }
  };

  // Import JSON ideas
  const handleImportIdeas = (imported: Idea[]) => {
    const updatedList = [...imported, ...ideas];
    // Deduplicate by id
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

  // Trigger manual sync
  const handleTriggerSync = () => {
    syncAllWithCloud(ideas).then(({ updatedIdeas, cloudAvailable }) => {
      setIsCloudConnected(cloudAvailable);
      if (cloudAvailable) {
        setIdeas(updatedIdeas);
      }
    });
  };

  // Filtered and sorted ideas
  const filteredIdeas = useMemo(() => {
    let result = [...ideas];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.oneLiner.toLowerCase().includes(q) ||
          (i.problem && i.problem.toLowerCase().includes(q)) ||
          (i.solution && i.solution.toLowerCase().includes(q)) ||
          i.category.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((i) => i.category === selectedCategory);
    }

    // Favorites only
    if (filterFavoritesOnly) {
      result = result.filter((i) => i.isFavorite);
    }

    // Sorting
    result.sort((a, b) => {
      // Pinned always come first in grid view
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortBy === 'score') {
        return calculateScore(b) - calculateScore(a);
      }
      if (sortBy === 'excitement') {
        return b.excitement - a.excitement;
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      // default: updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [ideas, searchQuery, selectedCategory, sortBy, filterFavoritesOnly]);

  const avgScore = useMemo(() => {
    if (ideas.length === 0) return 0;
    const sum = ideas.reduce((acc, curr) => acc + calculateScore(curr), 0);
    return Math.round(sum / ideas.length);
  }, [ideas]);

  return (
    <div className="app-layout">
      {/* Header and Filter Controls */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenQuickCapture={() => {
          setEditingIdea(null);
          setIsQuickCaptureOpen(true);
        }}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportMarkdown={() => exportIdeasToMarkdown(ideas)}
        onExportJSON={() => exportIdeasToJSON(ideas)}
        totalIdeas={ideas.length}
        avgScore={avgScore}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="main-content-viewport">
        {/* Controls Bar for Grid View (Sort, Favorites, Count) */}
        {viewMode === 'grid' && (
          <div className="vault-subbar">
            <div className="subbar-left">
              <span className="results-count">
                Showing <strong>{filteredIdeas.length}</strong> of <strong>{ideas.length}</strong> ideas
              </span>
              <button
                className={`filter-pill-btn ${filterFavoritesOnly ? 'active' : ''}`}
                onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
              >
                <Star size={13} className={filterFavoritesOnly ? 'fill-star' : ''} />
                <span>Favorites Only</span>
              </button>
            </div>

            <div className="subbar-right">
              <div className="sort-select-wrap">
                <ArrowUpDown size={14} className="sort-icon" />
                <span className="sort-label">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="sort-dropdown"
                >
                  <option value="score">Highest Viability Score</option>
                  <option value="excitement">Highest Excitement 🔥</option>
                  <option value="updated">Recently Updated</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* View 1: Cards & Canvas Grid */}
        {viewMode === 'grid' && (
          <>
            {filteredIdeas.length === 0 ? (
              <div className="empty-vault-card">
                <div className="empty-icon-wrap">💡</div>
                <h3 className="empty-title">No ideas found</h3>
                <p className="empty-desc">
                  {searchQuery || selectedCategory !== 'ALL'
                    ? 'No startup ideas match your current search or category filter.'
                    : 'Your idea vault is currently empty. Whenever inspiration strikes, capture it instantly!'}
                </p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingIdea(null);
                    setIsQuickCaptureOpen(true);
                  }}
                >
                  <Plus size={16} />
                  <span>Capture New Idea</span>
                </button>
              </div>
            ) : (
              <div className="ideas-cards-grid">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onUpdateIdea={handleUpdateIdea}
                    onDeleteIdea={handleDeleteIdea}
                    onEditIdea={handleEditIdea}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* View 2: Kanban Pipeline Board */}
        {viewMode === 'kanban' && (
          <KanbanBoard
            ideas={filteredIdeas}
            onUpdateIdea={handleUpdateIdea}
            onOpenQuickCapture={handleOpenQuickCaptureWithStage}
            onEditIdea={handleEditIdea}
          />
        )}

        {/* View 3: Priority Matrix 2x2 */}
        {viewMode === 'matrix' && (
          <PriorityMatrix ideas={filteredIdeas} onEditIdea={handleEditIdea} />
        )}
      </main>

      {/* Floating Action Button on Desktop */}
      <button
        className="desktop-floating-capture-btn"
        onClick={() => {
          setEditingIdea(null);
          setIsQuickCaptureOpen(true);
        }}
        title="Quick Capture Idea (⌘N)"
      >
        <Plus size={24} />
      </button>

      {/* Mobile Native Bottom Navigation Bar */}
      <MobileTabBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenQuickCapture={() => {
          setEditingIdea(null);
          setIsQuickCaptureOpen(true);
        }}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => {
          setIsQuickCaptureOpen(false);
          setEditingIdea(null);
        }}
        onSaveIdea={handleSaveIdea}
        editingIdea={editingIdea}
      />

      <MobileInstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

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
