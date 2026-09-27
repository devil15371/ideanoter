import React from 'react';
import { Plus, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Idea, IdeaStage } from '../types/idea';
import { STAGES, calculateScore } from '../types/idea';
import { playAudioFeedback } from '../services/storage';

interface KanbanBoardProps {
  ideas: Idea[];
  onUpdateIdea: (idea: Idea) => void;
  onOpenQuickCapture: (defaultStage?: IdeaStage) => void;
  onEditIdea: (idea: Idea) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  ideas,
  onUpdateIdea,
  onOpenQuickCapture,
  onEditIdea,
}) => {
  const activeStages = STAGES.filter((s) => s.id !== 'archived');

  const handleMoveStage = (idea: Idea, targetStage: IdeaStage) => {
    if (targetStage === 'launched' && idea.stage !== 'launched') {
      playAudioFeedback('launch');
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      playAudioFeedback('click');
    }

    onUpdateIdea({
      ...idea,
      stage: targetStage,
      updatedAt: new Date().toISOString(),
    });
  };

  const getStageIndex = (stageId: IdeaStage) => {
    return activeStages.findIndex((s) => s.id === stageId);
  };

  return (
    <div className="kanban-container">
      <div className="kanban-columns-grid">
        {activeStages.map((stage) => {
          const stageIdeas = ideas.filter((i) => i.stage === stage.id);
          const stageAvgScore =
            stageIdeas.length > 0
              ? Math.round(
                  stageIdeas.reduce((acc, curr) => acc + calculateScore(curr), 0) /
                    stageIdeas.length
                )
              : 0;

          return (
            <div key={stage.id} className="kanban-column">
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="kanban-col-title-wrap">
                  <span className="kanban-col-emoji">{stage.emoji}</span>
                  <div>
                    <h3 className="kanban-col-title">{stage.label}</h3>
                    <span className="kanban-col-desc">{stage.desc}</span>
                  </div>
                </div>
                <div className="kanban-col-meta">
                  <span className="kanban-count-pill">{stageIdeas.length}</span>
                  {stageIdeas.length > 0 && (
                    <span className="kanban-score-pill" title="Average Viability">
                      {stageAvgScore}%
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Add Button per Column */}
              <button
                className="kanban-add-card-btn"
                onClick={() => onOpenQuickCapture(stage.id)}
              >
                <Plus size={14} />
                <span>Add {stage.label}</span>
              </button>

              {/* Cards in Column */}
              <div className="kanban-cards-list">
                {stageIdeas.length === 0 ? (
                  <div className="kanban-empty-state">
                    <p>No ideas currently in this stage.</p>
                  </div>
                ) : (
                  stageIdeas.map((idea) => {
                    const score = calculateScore(idea);
                    const currentIndex = getStageIndex(idea.stage);
                    const canMoveLeft = currentIndex > 0;
                    const canMoveRight = currentIndex < activeStages.length - 1;

                    return (
                      <div
                        key={idea.id}
                        className="kanban-mini-card"
                        onClick={() => onEditIdea(idea)}
                      >
                        <div className="kanban-card-top">
                          <span className="kanban-cat-tag">{idea.category}</span>
                          <span className="kanban-score-tag">
                            <Sparkles size={11} />
                            {score}%
                          </span>
                        </div>

                        <h4 className="kanban-card-title">{idea.title}</h4>
                        <p className="kanban-card-pitch">{idea.oneLiner}</p>

                        {/* Checklist progress */}
                        {idea.checklist && idea.checklist.length > 0 && (
                          <div className="kanban-progress-row">
                            <span className="kanban-progress-text">
                              {idea.checklist.filter((c) => c.done).length}/
                              {idea.checklist.length} tasks
                            </span>
                            <div className="kanban-progress-bar">
                              <div
                                className="kanban-progress-fill"
                                style={{
                                  width: `${Math.round(
                                    (idea.checklist.filter((c) => c.done).length /
                                      idea.checklist.length) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Quick Move Stage Controls */}
                        <div
                          className="kanban-stage-stepper"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canMoveLeft && (
                            <button
                              className="stage-step-btn"
                              title={`Move back to ${activeStages[currentIndex - 1].label}`}
                              onClick={() =>
                                handleMoveStage(
                                  idea,
                                  activeStages[currentIndex - 1].id
                                )
                              }
                            >
                              <ArrowLeft size={12} />
                              <span>{activeStages[currentIndex - 1].label}</span>
                            </button>
                          )}
                          {canMoveRight && (
                            <button
                              className="stage-step-btn advance"
                              title={`Advance to ${activeStages[currentIndex + 1].label}`}
                              onClick={() =>
                                handleMoveStage(
                                  idea,
                                  activeStages[currentIndex + 1].id
                                )
                              }
                            >
                              <span>{activeStages[currentIndex + 1].label}</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
