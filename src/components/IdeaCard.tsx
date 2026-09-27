import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Star,
  Pin,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Idea, IdeaStage } from '../types/idea';
import { STAGES, CATEGORIES, calculateScore } from '../types/idea';
import { playAudioFeedback } from '../services/storage';

interface IdeaCardProps {
  idea: Idea;
  onUpdateIdea: (updated: Idea) => void;
  onDeleteIdea: (id: string) => void;
  onEditIdea: (idea: Idea) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onUpdateIdea,
  onDeleteIdea,
  onEditIdea,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const score = calculateScore(idea);
  const currentStage = STAGES.find((s) => s.id === idea.stage) || STAGES[0];
  const currentCategory = CATEGORIES.find((c) => c.label === idea.category) || CATEGORIES[0];

  // Stage change handler
  const handleStageChange = (newStage: IdeaStage) => {
    if (newStage === 'launched' && idea.stage !== 'launched') {
      playAudioFeedback('launch');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } else {
      playAudioFeedback('click');
    }

    onUpdateIdea({
      ...idea,
      stage: newStage,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle favorite / star
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudioFeedback('click');
    onUpdateIdea({
      ...idea,
      isFavorite: !idea.isFavorite,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle pinned
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudioFeedback('click');
    onUpdateIdea({
      ...idea,
      pinned: !idea.pinned,
      updatedAt: new Date().toISOString(),
    });
  };

  // Checklist item toggle
  const handleToggleChecklist = (itemId: string) => {
    playAudioFeedback('click');
    const updatedChecklist = idea.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdateIdea({
      ...idea,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add checklist item
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem = {
      id: 'cl-' + Date.now(),
      text: newChecklistText.trim(),
      done: false,
    };

    onUpdateIdea({
      ...idea,
      checklist: [...idea.checklist, newItem],
      updatedAt: new Date().toISOString(),
    });
    setNewChecklistText('');
  };

  // Remove checklist item
  const handleRemoveChecklistItem = (itemId: string) => {
    onUpdateIdea({
      ...idea,
      checklist: idea.checklist.filter((i) => i.id !== itemId),
      updatedAt: new Date().toISOString(),
    });
  };

  // Copy elevator pitch to clipboard
  const handleCopyPitch = () => {
    const pitchText = `💡 ${idea.title}\n\n"${idea.oneLiner}"\n\nCategory: ${idea.category} | Viability Score: ${score}%\nProblem: ${idea.problem || 'N/A'}\nMonetization: ${idea.monetization || 'N/A'}`;
    navigator.clipboard.writeText(pitchText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const completedTasks = idea.checklist.filter((i) => i.done).length;
  const totalTasks = idea.checklist.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <article className={`idea-card ${idea.pinned ? 'card-pinned' : ''}`}>
      {/* Top Meta Bar */}
      <div className="card-top-bar">
        {/* Category Pill */}
        <span
          className="card-category-pill"
          style={{ borderColor: currentCategory.color + '44', backgroundColor: currentCategory.color + '18' }}
        >
          <span className="cat-dot" style={{ backgroundColor: currentCategory.color }} />
          {idea.category}
        </span>

        {/* Stage Dropdown Pill */}
        <div className="card-stage-selector">
          <select
            value={idea.stage}
            onChange={(e) => handleStageChange(e.target.value as IdeaStage)}
            className="stage-select-pill"
            style={{ color: currentStage.color }}
          >
            {STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.emoji} {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Viability Score Badge */}
        <div
          className="viability-badge"
          title={`Viability Score: ${score}% (Excitement: ${idea.excitement}/5, Market: ${idea.marketSize}/5, Feasibility: ${idea.feasibility}/5)`}
        >
          <Sparkles size={12} className="badge-spark" />
          <span>{score}%</span>
        </div>

        {/* Quick Card Controls (Star, Pin) */}
        <div className="card-top-actions">
          <button
            className={`card-action-icon ${idea.pinned ? 'active pinned' : ''}`}
            onClick={handleTogglePin}
            title={idea.pinned ? 'Unpin Idea' : 'Pin to Top'}
          >
            <Pin size={15} />
          </button>
          <button
            className={`card-action-icon ${idea.isFavorite ? 'active starred' : ''}`}
            onClick={handleToggleFavorite}
            title={idea.isFavorite ? 'Unfavorite' : 'Favorite Idea'}
          >
            <Star size={15} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="card-title" onClick={() => setIsExpanded(!isExpanded)}>
        {idea.title}
      </h3>

      {/* One-Liner Pitch */}
      <p className="card-oneliner">{idea.oneLiner || 'No summary entered yet.'}</p>

      {/* Ratings Pill Bar */}
      <div className="card-ratings-bar">
        <span className="rating-tag" title="Excitement">
          <Flame size={12} className="text-orange" />
          <span>Excitement {idea.excitement}/5</span>
        </span>
        <span className="rating-tag" title="Market Size">
          <Target size={12} className="text-blue" />
          <span>Market {idea.marketSize}/5</span>
        </span>
        <span className="rating-tag" title="Feasibility">
          <Layers size={12} className="text-emerald" />
          <span>Ease {idea.feasibility}/5</span>
        </span>
      </div>

      {/* Tags Chips */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="card-tags-list">
          {idea.tags.map((tag, idx) => (
            <span key={idx} className="card-tag-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Checklist Summary / Progress */}
      {totalTasks > 0 && (
        <div className="card-checklist-progress">
          <div className="progress-info">
            <span className="progress-label">Validation Checklist:</span>
            <span className="progress-count">
              {completedTasks}/{totalTasks} ({progressPercent}%)
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* Expandable Full Canvas (Problem, Solution, Moat, etc.) */}
      {isExpanded && (
        <div className="card-expanded-canvas">
          {idea.problem && (
            <div className="canvas-block">
              <span className="canvas-block-label">Problem Solved:</span>
              <p className="canvas-block-content">{idea.problem}</p>
            </div>
          )}

          {idea.solution && (
            <div className="canvas-block">
              <span className="canvas-block-label">Proposed Solution:</span>
              <p className="canvas-block-content">{idea.solution}</p>
            </div>
          )}

          {idea.targetAudience && (
            <div className="canvas-block">
              <span className="canvas-block-label">Target Audience / ICP:</span>
              <p className="canvas-block-content">{idea.targetAudience}</p>
            </div>
          )}

          {idea.monetization && (
            <div className="canvas-block">
              <span className="canvas-block-label">Monetization & Business Model:</span>
              <p className="canvas-block-content">{idea.monetization}</p>
            </div>
          )}

          {idea.moat && (
            <div className="canvas-block">
              <span className="canvas-block-label">Moat / Unfair Advantage:</span>
              <p className="canvas-block-content">{idea.moat}</p>
            </div>
          )}

          {idea.competitors && (
            <div className="canvas-block">
              <span className="canvas-block-label">Known Competitors:</span>
              <p className="canvas-block-content">{idea.competitors}</p>
            </div>
          )}

          {/* Interactive Checklist inside Expanded Area */}
          <div className="card-checklist-interactive">
            <span className="canvas-block-label">Next Validation Tasks:</span>
            <div className="checklist-items-list">
              {idea.checklist.map((item) => (
                <div key={item.id} className="checklist-row">
                  <button
                    className="check-toggle-btn"
                    onClick={() => handleToggleChecklist(item.id)}
                  >
                    {item.done ? <CheckSquare size={16} className="text-emerald" /> : <Square size={16} />}
                  </button>
                  <span className={`checklist-item-text ${item.done ? 'task-done' : ''}`}>
                    {item.text}
                  </span>
                  <button
                    className="check-delete-btn"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add checklist task */}
            <form onSubmit={handleAddChecklistItem} className="add-task-form">
              <input
                type="text"
                placeholder="Add validation step..."
                className="task-input"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
              />
              <button type="submit" className="task-add-btn">
                <Plus size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Card Footer Bar */}
      <div className="card-footer">
        <button
          className="canvas-expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? 'Less' : 'View Canvas'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className="card-footer-actions">
          {/* Share / Copy Pitch */}
          <button
            className="card-tool-btn"
            onClick={handleCopyPitch}
            title="Copy Elevator Pitch to Clipboard"
          >
            {isCopied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            <span className="hide-mobile">{isCopied ? 'Copied' : 'Pitch'}</span>
          </button>

          {/* Edit */}
          <button
            className="card-tool-btn"
            onClick={() => onEditIdea(idea)}
            title="Edit Idea Canvas"
          >
            <Edit3 size={14} />
          </button>

          {/* Delete */}
          <button
            className="card-tool-btn delete"
            onClick={() => {
              if (window.confirm(`Delete idea "${idea.title}"?`)) {
                onDeleteIdea(idea.id);
              }
            }}
            title="Delete Idea"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};
