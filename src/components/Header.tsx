import React from 'react';
import {
  Sparkles,
  LayoutGrid,
  Kanban,
  Target,
  Plus,
  Smartphone,
  Settings,
  Search,
  Cloud,
  Download,
  Flame,
} from 'lucide-react';
import { CATEGORIES } from '../types/idea';

interface HeaderProps {
  viewMode: 'grid' | 'kanban' | 'matrix';
  setViewMode: (mode: 'grid' | 'kanban' | 'matrix') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onOpenQuickCapture: () => void;
  onOpenInstallGuide: () => void;
  onOpenSettings: () => void;
  onExportMarkdown: () => void;
  onExportJSON: () => void;
  totalIdeas: number;
  avgScore: number;
  isCloudConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenQuickCapture,
  onOpenInstallGuide,
  onOpenSettings,
  onExportMarkdown,
  onExportJSON,
  totalIdeas,
  avgScore,
  isCloudConnected,
}) => {
  return (
    <header className="app-header">
      {/* Top Banner & Brand Row */}
      <div className="header-top-row">
        <div className="brand-group">
          <div className="brand-logo-glow">
            <span className="brand-icon">💡</span>
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">IdeaNoter</h1>
              <span className="app-badge">Native Cross-Platform</span>
            </div>
            <p className="brand-subtitle">
              Instant Idea Vault for <span className="platform-tag">Mac</span> • <span className="platform-tag">iPhone</span> • <span className="platform-tag">Windows</span> • <span className="platform-tag">Android</span>
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="header-actions">
          {/* Cloud Sync Status Badge */}
          <button
            className={`sync-status-btn ${isCloudConnected ? 'connected' : 'local'}`}
            onClick={onOpenSettings}
            title={isCloudConnected ? 'Cloud Sync Active (Supabase)' : 'Local Storage Mode (Click to configure Cloud Sync)'}
          >
            <Cloud size={14} className={isCloudConnected ? 'cloud-icon-pulse' : ''} />
            <span className="sync-text">{isCloudConnected ? 'Cloud Synced' : 'Offline / Local'}</span>
          </button>

          {/* iPhone / Mobile App Guide Button */}
          <button className="btn-secondary icon-btn-text" onClick={onOpenInstallGuide}>
            <Smartphone size={16} />
            <span className="hide-mobile">Get on iPhone</span>
          </button>

          {/* Quick Export Menu */}
          <div className="dropdown-wrapper">
            <button
              className="btn-secondary icon-btn"
              title="Export Markdown Notes (or Shift+Click for JSON Backup)"
              onClick={(e) => {
                if (e.shiftKey) {
                  onExportJSON();
                } else {
                  onExportMarkdown();
                }
              }}
            >
              <Download size={16} />
              <span className="hide-mobile">Export</span>
            </button>
          </div>

          {/* Settings */}
          <button className="btn-secondary icon-btn" onClick={onOpenSettings} title="Settings & Sync">
            <Settings size={16} />
          </button>

          {/* Big Quick Capture Button */}
          <button className="btn-primary quick-spark-btn" onClick={onOpenQuickCapture}>
            <Plus size={18} />
            <span>Quick Spark</span>
            <kbd className="key-hint hide-mobile">⌘N</kbd>
          </button>
        </div>
      </div>

      {/* Stats Bar & View Switcher */}
      <div className="header-middle-row">
        {/* Navigation View Switcher */}
        <div className="view-mode-tabs" role="tablist">
          <button
            className={`view-tab ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            role="tab"
            aria-selected={viewMode === 'grid'}
          >
            <LayoutGrid size={16} />
            <span>Cards & Canvas</span>
            <span className="tab-count">{totalIdeas}</span>
          </button>
          <button
            className={`view-tab ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            role="tab"
            aria-selected={viewMode === 'kanban'}
          >
            <Kanban size={16} />
            <span>Pipeline Board</span>
          </button>
          <button
            className={`view-tab ${viewMode === 'matrix' ? 'active' : ''}`}
            onClick={() => setViewMode('matrix')}
            role="tab"
            aria-selected={viewMode === 'matrix'}
          >
            <Target size={16} />
            <span>Priority Matrix</span>
          </button>
        </div>

        {/* Quick Metrics */}
        <div className="quick-metrics hide-mobile">
          <div className="metric-pill">
            <Sparkles size={14} className="metric-icon gold" />
            <span>Avg Viability: <strong>{avgScore}%</strong></span>
          </div>
          <div className="metric-pill">
            <Flame size={14} className="metric-icon red" />
            <span>Active Vault: <strong>{totalIdeas} Ideas</strong></span>
          </div>
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="header-filter-row">
        {/* Search Bar */}
        <div className="search-bar-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search ideas, problem statements, tags, tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="category-scroll-container">
          <button
            className={`category-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className={`category-chip ${selectedCategory === cat.label ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.label)}
            >
              <span className="cat-dot" style={{ backgroundColor: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
