import React from 'react';
import { Trophy, Rocket, Zap, Clock } from 'lucide-react';
import type { Idea } from '../types/idea';
import { calculateScore } from '../types/idea';

interface PriorityMatrixProps {
  ideas: ideasList;
  onEditIdea: (idea: Idea) => void;
}

type ideasList = Idea[];

export const PriorityMatrix: React.FC<PriorityMatrixProps> = ({ ideas, onEditIdea }) => {
  // Quadrants partition
  // Excitement >= 4 && Feasibility >= 4 => Top Priority / Golden Unicorns
  // Excitement >= 4 && Feasibility < 4 => Moonshots / Big Bets
  // Excitement < 4 && Feasibility >= 4 => Quick Wins
  // Excitement < 4 && Feasibility < 4 => Icebox / Incubate

  const goldenUnicorns = ideas.filter((i) => i.excitement >= 4 && i.feasibility >= 4);
  const moonshots = ideas.filter((i) => i.excitement >= 4 && i.feasibility < 4);
  const quickWins = ideas.filter((i) => i.excitement < 4 && i.feasibility >= 4);
  const incubate = ideas.filter((i) => i.excitement < 4 && i.feasibility < 4);

  return (
    <div className="matrix-wrapper">
      <div className="matrix-header-info">
        <div className="matrix-title-group">
          <h2 className="matrix-title">Idea Prioritization Matrix (2×2)</h2>
          <p className="matrix-subtitle">
            Automatically maps your ideas by <strong>Passion & Excitement</strong> vs. <strong>Execution Feasibility</strong> so you know exactly which business to build first.
          </p>
        </div>
      </div>

      <div className="matrix-grid">
        {/* Quadrant 1: Moonshots */}
        <div className="matrix-quadrant moonshots">
          <div className="quadrant-header">
            <div className="quadrant-title-wrap">
              <Rocket size={18} className="text-purple" />
              <div>
                <h3 className="quadrant-title">🚀 Moonshots & Big Bets</h3>
                <span className="quadrant-criteria">High Excitement, High Complexity</span>
              </div>
            </div>
            <span className="quadrant-badge">{moonshots.length}</span>
          </div>
          <div className="quadrant-content">
            {moonshots.length === 0 ? (
              <p className="quadrant-empty">No moonshots yet</p>
            ) : (
              moonshots.map((idea) => (
                <div key={idea.id} className="matrix-idea-item" onClick={() => onEditIdea(idea)}>
                  <span className="matrix-item-title">{idea.title}</span>
                  <span className="matrix-item-score">{calculateScore(idea)}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quadrant 2: Golden Unicorns (Top Priority) */}
        <div className="matrix-quadrant golden-unicorns">
          <div className="quadrant-header">
            <div className="quadrant-title-wrap">
              <Trophy size={18} className="text-amber" />
              <div>
                <h3 className="quadrant-title">🏆 Golden Opportunities (BUILD NOW)</h3>
                <span className="quadrant-criteria">High Excitement, High Feasibility</span>
              </div>
            </div>
            <span className="quadrant-badge highlighted">{goldenUnicorns.length}</span>
          </div>
          <div className="quadrant-content">
            {goldenUnicorns.length === 0 ? (
              <p className="quadrant-empty">No golden opportunities yet</p>
            ) : (
              goldenUnicorns.map((idea) => (
                <div key={idea.id} className="matrix-idea-item highlighted" onClick={() => onEditIdea(idea)}>
                  <div className="matrix-item-info">
                    <span className="matrix-item-title">{idea.title}</span>
                    <span className="matrix-item-desc">{idea.oneLiner}</span>
                  </div>
                  <span className="matrix-item-score-gold">{calculateScore(idea)}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quadrant 3: Incubate */}
        <div className="matrix-quadrant incubate">
          <div className="quadrant-header">
            <div className="quadrant-title-wrap">
              <Clock size={18} className="text-slate" />
              <div>
                <h3 className="quadrant-title">🌱 Incubator / Backlog</h3>
                <span className="quadrant-criteria">Lower Excitement, Higher Friction</span>
              </div>
            </div>
            <span className="quadrant-badge">{incubate.length}</span>
          </div>
          <div className="quadrant-content">
            {incubate.length === 0 ? (
              <p className="quadrant-empty">No ideas in backlog</p>
            ) : (
              incubate.map((idea) => (
                <div key={idea.id} className="matrix-idea-item" onClick={() => onEditIdea(idea)}>
                  <span className="matrix-item-title">{idea.title}</span>
                  <span className="matrix-item-score">{calculateScore(idea)}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quadrant 4: Quick Wins */}
        <div className="matrix-quadrant quick-wins">
          <div className="quadrant-header">
            <div className="quadrant-title-wrap">
              <Zap size={18} className="text-emerald" />
              <div>
                <h3 className="quadrant-title">⚡ Quick Wins</h3>
                <span className="quadrant-criteria">Easy Feasibility, Steady Demand</span>
              </div>
            </div>
            <span className="quadrant-badge">{quickWins.length}</span>
          </div>
          <div className="quadrant-content">
            {quickWins.length === 0 ? (
              <p className="quadrant-empty">No quick wins yet</p>
            ) : (
              quickWins.map((idea) => (
                <div key={idea.id} className="matrix-idea-item" onClick={() => onEditIdea(idea)}>
                  <span className="matrix-item-title">{idea.title}</span>
                  <span className="matrix-item-score">{calculateScore(idea)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
