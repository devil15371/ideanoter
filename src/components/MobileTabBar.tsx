import React from 'react';
import { LayoutGrid, Kanban, Plus, Target, Smartphone } from 'lucide-react';

interface MobileTabBarProps {
  viewMode: 'grid' | 'kanban' | 'matrix';
  setViewMode: (mode: 'grid' | 'kanban' | 'matrix') => void;
  onOpenQuickCapture: () => void;
  onOpenInstallGuide: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  viewMode,
  setViewMode,
  onOpenQuickCapture,
  onOpenInstallGuide,
}) => {
  return (
    <nav className="mobile-bottom-tabbar" aria-label="Mobile Navigation">
      <button
        className={`mobile-tab-item ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
      >
        <LayoutGrid size={20} />
        <span>Cards</span>
      </button>

      <button
        className={`mobile-tab-item ${viewMode === 'kanban' ? 'active' : ''}`}
        onClick={() => setViewMode('kanban')}
      >
        <Kanban size={20} />
        <span>Pipeline</span>
      </button>

      {/* Center Elevated Quick Capture Button */}
      <button
        className="mobile-capture-fab"
        onClick={onOpenQuickCapture}
        aria-label="Quick Spark Idea"
      >
        <div className="fab-inner">
          <Plus size={24} />
        </div>
      </button>

      <button
        className={`mobile-tab-item ${viewMode === 'matrix' ? 'active' : ''}`}
        onClick={() => setViewMode('matrix')}
      >
        <Target size={20} />
        <span>Matrix</span>
      </button>

      <button className="mobile-tab-item" onClick={onOpenInstallGuide}>
        <Smartphone size={20} />
        <span>Devices</span>
      </button>
    </nav>
  );
};
