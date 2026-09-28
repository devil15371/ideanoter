import React, { useState, useEffect, useRef } from 'react';
import {
  Minus,
  Plus,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  Download,
  Smartphone,
  Ghost,
} from 'lucide-react';
import type { Idea, IdeaCategory } from '../types/idea';
import { CATEGORIES } from '../types/idea';
import { MascotCharacter } from './MascotCharacter';
import { playAudioFeedback } from '../services/storage';

interface FloatingNotepadProps {
  ideas: Idea[];
  currentIdeaIndex: number;
  setCurrentIdeaIndex: (index: number) => void;
  onUpdateIdea: (idea: Idea) => void;
  onCreateNewIdea: (title?: string) => void;
  onDeleteCurrentIdea: (id: string) => void;
  onMinimize: () => void;
  onOpenSettings: () => void;
  onOpenMobileGuide: () => void;
  onExportMarkdown: () => void;
}

export const FloatingNotepad: React.FC<FloatingNotepadProps> = ({
  ideas,
  currentIdeaIndex,
  setCurrentIdeaIndex,
  onUpdateIdea,
  onCreateNewIdea,
  onDeleteCurrentIdea,
  onMinimize,
  onOpenSettings,
  onOpenMobileGuide,
  onExportMarkdown,
}) => {
  const currentIdea = ideas[currentIdeaIndex] || ideas[0] || null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('AI');
  const [stamp, setStamp] = useState<'SPARK' | 'STARTUP' | 'BUILD' | 'TOP SECRET'>('SPARK');
  const [fontStyle, setFontStyle] = useState<'typewriter' | 'handwriting' | 'serif'>('typewriter');
  const [isCopied, setIsCopied] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Invisibility / Ghost mode when idle
  const [ghostModeEnabled, setGhostModeEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ideanoter_ghost_mode_v1') !== 'false';
    } catch {
      return true;
    }
  });
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<any>(null);

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (ghostModeEnabled) {
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 3500);
    }
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [ghostModeEnabled]);

  // Dragging state for the floating window
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('ideanoter_window_pos_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Center-ish default on desktop, centered on mobile
    const initialX = Math.max(20, Math.min(window.innerWidth - 440, window.innerWidth / 2 - 210));
    return { x: initialX, y: 70 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync state with current idea
  useEffect(() => {
    if (currentIdea) {
      setTitle(currentIdea.title);
      // Combine oneLiner and problem/solution into friendly note text if present
      const combined = currentIdea.problem
        ? `${currentIdea.oneLiner}\n\nProblem:\n${currentIdea.problem}\n\nSolution:\n${currentIdea.solution || ''}`
        : currentIdea.oneLiner;
      setContent(combined);
      setCategory(currentIdea.category);
    } else {
      setTitle('');
      setContent('');
    }
  }, [currentIdea?.id, currentIdeaIndex]);

  // Focus textarea when switching or opening
  useEffect(() => {
    contentTextareaRef.current?.focus();
  }, [currentIdea?.id]);

  // Auto-save changes to the idea
  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerTypingAnimation();
    if (currentIdea) {
      onUpdateIdea({
        ...currentIdea,
        title: val || 'Untitled Spark',
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerTypingAnimation();
    if (currentIdea) {
      onUpdateIdea({
        ...currentIdea,
        oneLiner: val,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleCategoryChange = (cat: IdeaCategory) => {
    setCategory(cat);
    if (currentIdea) {
      onUpdateIdea({
        ...currentIdea,
        category: cat,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const triggerTypingAnimation = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 400);
  };

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, .notepad-content-sheet')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, .notepad-content-sheet')) {
      return;
    }
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 360, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 300, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(5, Math.min(window.innerWidth - 340, dragStartRef.current.startX + dx));
      const newY = Math.max(5, Math.min(window.innerHeight - 250, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        try {
          localStorage.setItem('ideanoter_window_pos_v1', JSON.stringify(position));
        } catch {}
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, position]);

  // Voice Dictation
  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not available in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        handleContentChange(content ? content + ' ' + transcript : transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Copy note to clipboard
  const handleCopyNote = () => {
    playAudioFeedback('click');
    const textToCopy = `💡 ${title}\n\n${content}\n\n[Category: ${category}]`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
  };

  // Flip through pages
  const handlePrevPage = () => {
    if (currentIdeaIndex > 0) {
      playAudioFeedback('click');
      setCurrentIdeaIndex(currentIdeaIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentIdeaIndex < ideas.length - 1) {
      playAudioFeedback('click');
      setCurrentIdeaIndex(currentIdeaIndex + 1);
    }
  };

  const handleCreateNewSheet = () => {
    playAudioFeedback('spark');
    onCreateNewIdea('New Idea');
  };

  const handleDeleteSheet = () => {
    if (!currentIdea) return;
    if (window.confirm(`Tear off and discard "${title || 'this note'}"?`)) {
      playAudioFeedback('click');
      onDeleteCurrentIdea(currentIdea.id);
    }
  };

  return (
    <div
      className={`notepad-floating-window ${ghostModeEnabled && isIdle ? 'is-idle-invisible' : ''}`}
      onMouseEnter={() => {
        setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      }}
      onMouseLeave={resetIdleTimer}
      onMouseMove={resetIdleTimer}
    >
      {/* Vintage Top Spiral / Header Bar (Draggable) */}
      <div
        className="notepad-vintage-header"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Left: Vintage retro window buttons */}
        <div className="retro-window-controls">
          <button
            className="retro-btn btn-minimize"
            onClick={onMinimize}
            title="Minimize to cute character icon"
          >
            <Minus size={11} strokeWidth={3} />
          </button>
          <button
            className="retro-btn btn-new"
            onClick={handleCreateNewSheet}
            title="Tear new page (Cmd+N)"
          >
            <Plus size={11} strokeWidth={3} />
          </button>
        </div>

        {/* Center: Old style title & Mascot icon */}
        <div className="notepad-header-brand">
          <div className="mini-mascot-head" onClick={onMinimize} title="Click to minimize!">
            <MascotCharacter size={26} isTyping={isTyping} showBadge={false} />
          </div>
          <span className="notepad-brand-title">IdeaNoter</span>
          <span className="notepad-page-indicator">
            {ideas.length > 0 ? `${currentIdeaIndex + 1} / ${ideas.length}` : '0 / 0'}
          </span>
        </div>

        {/* Right Header Tools */}
        <div className="notepad-header-tools">
          <button
            className={`header-icon-tool ghost-toggle ${ghostModeEnabled ? 'active' : ''}`}
            onClick={() => {
              const next = !ghostModeEnabled;
              setGhostModeEnabled(next);
              localStorage.setItem('ideanoter_ghost_mode_v1', String(next));
              if (!next) setIsIdle(false);
            }}
            title={ghostModeEnabled ? 'Ghost Mode ON (becomes invisible when idle)' : 'Ghost Mode OFF (always visible)'}
          >
            <Ghost size={13} />
          </button>
          <button
            className="header-icon-tool"
            onClick={onOpenMobileGuide}
            title="Get on iPhone / Mobile"
          >
            <Smartphone size={13} />
          </button>
          <button
            className="header-icon-tool"
            onClick={onExportMarkdown}
            title="Export Notes"
          >
            <Download size={13} />
          </button>
          <button
            className="header-icon-tool"
            onClick={() => setIsListDrawerOpen(!isListDrawerOpen)}
            title="View all saved idea notes"
          >
            <List size={13} />
          </button>
          <button className="header-icon-tool" onClick={onOpenSettings} title="Sync & Settings">
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Decorative Vintage Brass Binder Rings / Clips */}
      <div className="vintage-spiral-binder">
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
      </div>

      {/* All Notes Quick Slide-down Drawer */}
      {isListDrawerOpen && (
        <div className="notepad-notes-drawer">
          <div className="drawer-header">
            <span>All Your Sparks ({ideas.length})</span>
            <button className="drawer-close-btn" onClick={() => setIsListDrawerOpen(false)}>
              ×
            </button>
          </div>
          <div className="drawer-notes-list">
            {ideas.map((item, idx) => (
              <div
                key={item.id}
                className={`drawer-note-item ${idx === currentIdeaIndex ? 'selected' : ''}`}
                onClick={() => {
                  setCurrentIdeaIndex(idx);
                  setIsListDrawerOpen(false);
                }}
              >
                <span className="drawer-note-title">{item.title || 'Untitled note'}</span>
                <span className="drawer-note-cat">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notepad Paper Sheet (Bright, warm vintage lined stationery) */}
      <div className={`notepad-content-sheet font-${fontStyle}`}>
        {/* Top Note Metadata Strip */}
        <div className="sheet-top-strip">
          {/* Category Stamp Selector */}
          <select
            className="vintage-category-pill"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as IdeaCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Rubber Stamp Badge */}
          <button
            className="rubber-stamp-badge"
            onClick={() => {
              const stamps: Array<'SPARK' | 'STARTUP' | 'BUILD' | 'TOP SECRET'> = [
                'SPARK',
                'STARTUP',
                'BUILD',
                'TOP SECRET',
              ];
              const nextIdx = (stamps.indexOf(stamp) + 1) % stamps.length;
              setStamp(stamps[nextIdx]);
            }}
            title="Click to change vintage rubber stamp"
          >
            {stamp}
          </button>

          {/* Font switcher (Typewriter / Handwriting / Serif) */}
          <div className="font-toggle-group">
            <button
              className={`font-btn ${fontStyle === 'typewriter' ? 'active' : ''}`}
              onClick={() => setFontStyle('typewriter')}
              title="Typewriter Font"
            >
              Type
            </button>
            <button
              className={`font-btn ${fontStyle === 'handwriting' ? 'active' : ''}`}
              onClick={() => setFontStyle('handwriting')}
              title="Handwriting Font"
            >
              Hand
            </button>
          </div>
        </div>

        {/* Note Title Input (Header line of legal pad) */}
        <div className="note-title-line">
          <input
            type="text"
            className="notepad-title-input"
            placeholder="Name your spark or startup..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        {/* Lined Paper Textarea */}
        <div className="ruled-paper-container">
          <textarea
            ref={contentTextareaRef}
            className="notepad-textarea"
            placeholder="Type your idea freely here before you forget... problem, audience, how it works, what to build first..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={8}
          />
        </div>

        {/* Bottom Vintage Footer Bar */}
        <div className="sheet-bottom-bar">
          {/* Flip arrows */}
          <div className="sheet-pager">
            <button
              className="page-flip-btn"
              onClick={handlePrevPage}
              disabled={currentIdeaIndex <= 0}
              title="Previous note (←)"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="pager-text">
              Sheet {ideas.length > 0 ? currentIdeaIndex + 1 : 0} of {ideas.length}
            </span>
            <button
              className="page-flip-btn"
              onClick={handleNextPage}
              disabled={currentIdeaIndex >= ideas.length - 1}
              title="Next note (→)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Action Tools */}
          <div className="sheet-action-tools">
            {/* Voice Dictate */}
            <button
              className={`action-pill-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              title={isRecording ? 'Stop Recording' : 'Voice Dictate Note (Talk to write)'}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              <span className="hide-sm">{isRecording ? 'Listening...' : 'Voice'}</span>
            </button>

            {/* Copy */}
            <button className="action-pill-btn" onClick={handleCopyNote} title="Copy note text">
              {isCopied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span className="hide-sm">{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Tear Sheet / Delete */}
            <button
              className="action-pill-btn delete"
              onClick={handleDeleteSheet}
              title="Tear off & discard this note"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Minimize Button at bottom */}
      <div className="notepad-footer-tab" onClick={onMinimize}>
        <span>Click to collapse into Character Icon</span>
      </div>
    </div>
  );
};
