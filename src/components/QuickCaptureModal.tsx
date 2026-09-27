import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Flame,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Tag,
  ListPlus,
  Shield,
  DollarSign,
  Users,
} from 'lucide-react';
import type { Idea, IdeaCategory } from '../types/idea';
import { CATEGORIES } from '../types/idea';
import { playAudioFeedback } from '../services/storage';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingIdea?: Idea | null;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSaveIdea,
  editingIdea,
}) => {
  const [title, setTitle] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('AI');
  const [excitement, setExcitement] = useState<number>(4);
  const [marketSize, setMarketSize] = useState<number>(3);
  const [feasibility, setFeasibility] = useState<number>(4);
  const [tagsInput, setTagsInput] = useState('');
  const [firstChecklistTask, setFirstChecklistTask] = useState('');

  // Deep-dive canvas fields
  const [showFullCanvas, setShowFullCanvas] = useState(false);
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [monetization, setMonetization] = useState('');
  const [moat, setMoat] = useState('');
  const [competitors, setCompetitors] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIdea) {
      setTitle(editingIdea.title);
      setOneLiner(editingIdea.oneLiner);
      setCategory(editingIdea.category);
      setExcitement(editingIdea.excitement);
      setMarketSize(editingIdea.marketSize);
      setFeasibility(editingIdea.feasibility);
      setTagsInput(editingIdea.tags.join(', '));
      setProblem(editingIdea.problem || '');
      setSolution(editingIdea.solution || '');
      setTargetAudience(editingIdea.targetAudience || '');
      setMonetization(editingIdea.monetization || '');
      setMoat(editingIdea.moat || '');
      setCompetitors(editingIdea.competitors || '');
      setFirstChecklistTask('');
      if (editingIdea.problem || editingIdea.solution || editingIdea.monetization) {
        setShowFullCanvas(true);
      }
    } else {
      // Reset form
      setTitle('');
      setOneLiner('');
      setCategory('AI');
      setExcitement(4);
      setMarketSize(3);
      setFeasibility(4);
      setTagsInput('');
      setFirstChecklistTask('');
      setProblem('');
      setSolution('');
      setTargetAudience('');
      setMonetization('');
      setMoat('');
      setCompetitors('');
      setShowFullCanvas(false);
    }
  }, [editingIdea, isOpen]);

  // Focus title input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Voice Dictation (Web Speech API)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setVoiceStatus('');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. You can type directly.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceStatus('Listening to your idea... Speak now.');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (!title) {
          setTitle(transcript.slice(0, 80));
        }
        setOneLiner((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error', event);
        setIsRecording(false);
        setVoiceStatus('Voice recognition stopped or permission denied.');
      };

      recognition.onend = () => {
        setIsRecording(false);
        setVoiceStatus('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    playAudioFeedback('spark');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const checklist = editingIdea?.checklist ? [...editingIdea.checklist] : [];
    if (firstChecklistTask.trim()) {
      checklist.push({
        id: 'cl-' + Date.now(),
        text: firstChecklistTask.trim(),
        done: false,
      });
    }

    onSaveIdea({
      title: title.trim(),
      oneLiner: oneLiner.trim(),
      category,
      stage: editingIdea ? editingIdea.stage : 'spark',
      excitement,
      marketSize,
      feasibility,
      tags,
      checklist,
      problem: problem.trim(),
      solution: solution.trim(),
      targetAudience: targetAudience.trim(),
      monetization: monetization.trim(),
      moat: moat.trim(),
      competitors: competitors.trim(),
      pinned: editingIdea ? editingIdea.pinned : false,
      isFavorite: editingIdea ? editingIdea.isFavorite : false,
    });

    onClose();
  };

  if (!isOpen) return null;

  // Live estimated score
  const estimatedScore = Math.round(((excitement * 2.0) + (marketSize * 1.5) + (feasibility * 1.5)) / 25 * 100);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container quick-capture-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="spark-emoji">⚡</span>
            <div>
              <h2 className="modal-title">{editingIdea ? 'Edit Startup Idea' : 'Capture Random Idea'}</h2>
              <p className="modal-subtitle">
                Jot down your spark before it slips away. Works seamlessly across phone & computer.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="modal-form">
          {/* Quick Voice Bar */}
          <div className="voice-bar">
            <button
              type="button"
              className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isRecording ? 'Stop Dictating' : 'Voice Dictate Idea (Tap to talk)'}</span>
            </button>
            {voiceStatus && <span className="voice-status-text">{voiceStatus}</span>}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="idea-title">
              Idea Concept or Project Name <span className="required">*</span>
            </label>
            <input
              id="idea-title"
              ref={titleInputRef}
              type="text"
              className="form-input text-lg"
              placeholder="e.g. AI-powered micro-accounting for freelancers"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* One-Liner Elevator Pitch */}
          <div className="form-group">
            <label className="form-label" htmlFor="idea-oneliner">
              1-Line Elevator Pitch (The Core Spark)
            </label>
            <textarea
              id="idea-oneliner"
              rows={2}
              className="form-textarea"
              placeholder="What makes this exciting? Describe in 1-2 crisp sentences..."
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
            />
          </div>

          {/* Category & Ratings Grid */}
          <div className="form-grid-2">
            {/* Category Select */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Viability Score Preview */}
            <div className="form-group">
              <label className="form-label">Calculated Viability</label>
              <div className="live-score-box">
                <Sparkles size={16} className="text-amber" />
                <span className="score-val">{estimatedScore}%</span>
                <span className="score-tag">
                  {estimatedScore >= 80 ? '🔥 High Potential' : estimatedScore >= 60 ? '⚡ Promising' : '🌱 Early Idea'}
                </span>
              </div>
            </div>
          </div>

          {/* Ratings: Excitement, Market, Feasibility */}
          <div className="ratings-sliders-panel">
            <div className="slider-row">
              <div className="slider-label">
                <Flame size={15} className="text-orange" />
                <span>Personal Excitement:</span>
                <strong>{excitement} / 5</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={excitement}
                onChange={(e) => setExcitement(Number(e.target.value))}
                className="range-slider"
              />
            </div>

            <div className="slider-row">
              <div className="slider-label">
                <TrendingUp size={15} className="text-blue" />
                <span>Market Size / Need:</span>
                <strong>{marketSize} / 5</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={marketSize}
                onChange={(e) => setMarketSize(Number(e.target.value))}
                className="range-slider"
              />
            </div>

            <div className="slider-row">
              <div className="slider-label">
                <Zap size={15} className="text-emerald" />
                <span>Execution Feasibility:</span>
                <strong>{feasibility} / 5</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={feasibility}
                onChange={(e) => setFeasibility(Number(e.target.value))}
                className="range-slider"
              />
            </div>
          </div>

          {/* Tags & First Step */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                <Tag size={13} /> Tags (comma separated)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="B2B, AI, Chrome Extension, Mobile"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <ListPlus size={13} /> Immediate Next Action / Step
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Build prototype or interview 5 prospects"
                value={firstChecklistTask}
                onChange={(e) => setFirstChecklistTask(e.target.value)}
              />
            </div>
          </div>

          {/* Full Startup Canvas Accordion Toggle */}
          <button
            type="button"
            className="canvas-toggle-btn"
            onClick={() => setShowFullCanvas(!showFullCanvas)}
          >
            <span>{showFullCanvas ? 'Hide Deep-Dive Business Canvas' : '🚀 Expand Deep-Dive Business Canvas (Problem, Solution, Moat...)'}</span>
            {showFullCanvas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showFullCanvas && (
            <div className="deep-canvas-section">
              <div className="form-group">
                <label className="form-label">
                  <Flame size={13} /> What pain or problem does this solve?
                </label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Describe who suffers from this problem and why existing tools fail..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Zap size={13} /> Your Unique Solution
                </label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="How does your product solve this 10x faster, cheaper, or better?"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <Users size={13} /> Target Audience / ICP
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Solo founders, college students, dental clinics..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <DollarSign size={13} /> Monetization Model
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="$29/mo SaaS, 5% marketplace commission, Freemium..."
                    value={monetization}
                    onChange={(e) => setMonetization(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <Shield size={13} /> Moat / Unfair Advantage
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Proprietary workflow, network effects, distribution..."
                    value={moat}
                    onChange={(e) => setMoat(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Existing Competitors / Alternatives</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Spreadsheets, Notion, Manual WhatsApp..."
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Sparkles size={16} />
              <span>{editingIdea ? 'Save Changes' : 'Capture Idea'}</span>
              <kbd className="key-hint hide-mobile">↵ Enter</kbd>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
