import React, { useState, useEffect, useRef } from 'react';
import { MascotCharacter } from './MascotCharacter';
import { Plus, Smartphone, Settings } from 'lucide-react';
import { playAudioFeedback } from '../services/storage';

interface FloatingMascotWidgetProps {
  ideaCount: number;
  onOpenNotepad: () => void;
  onQuickNewNote: () => void;
  onOpenMobileGuide: () => void;
  onOpenSettings: () => void;
}

export const FloatingMascotWidget: React.FC<FloatingMascotWidgetProps> = ({
  ideaCount,
  onOpenNotepad,
  onQuickNewNote,
  onOpenMobileGuide,
  onOpenSettings,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('ideanoter_mascot_pos_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default to right side of screen
    const x = Math.max(20, window.innerWidth - 110);
    const y = Math.max(60, window.innerHeight / 2 - 40);
    return { x, y };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Ghost invisibility when idle
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<any>(null);

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 4000);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mascot-action-bubble')) {
      return;
    }
    setIsDragging(true);
    setHasDragged(false);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.mascot-action-bubble')) {
      return;
    }
    const touch = e.touches[0];
    setIsDragging(true);
    setHasDragged(false);
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
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setHasDragged(true);
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 80, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setHasDragged(true);
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 80, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        try {
          localStorage.setItem('ideanoter_mascot_pos_v1', JSON.stringify(position));
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

  const handleMascotClick = () => {
    if (!hasDragged) {
      playAudioFeedback('spark');
      onOpenNotepad();
    }
  };

  return (
    <div
      className={`floating-mascot-wrapper ${isDragging ? 'dragging' : ''} ${isIdle ? 'is-idle-invisible' : ''}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      onMouseEnter={() => {
        setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      }}
      onMouseLeave={resetIdleTimer}
      onMouseMove={resetIdleTimer}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Glow Aura & Mascot */}
      <div className="mascot-touch-circle">
        <MascotCharacter
          size={72}
          ideaCount={ideaCount}
          onClick={handleMascotClick}
          showBadge={true}
        />
      </div>

      {/* Floating Quick Action Mini-Bubbles */}
      <div className="mascot-satellites">
        <button
          className="mascot-action-bubble plus"
          onClick={(e) => {
            e.stopPropagation();
            playAudioFeedback('spark');
            onQuickNewNote();
          }}
          title="Quick New Idea (+)"
        >
          <Plus size={15} />
        </button>

        <button
          className="mascot-action-bubble phone"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMobileGuide();
          }}
          title="Open on iPhone / Mobile"
        >
          <Smartphone size={13} />
        </button>

        <button
          className="mascot-action-bubble settings"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          title="Cloud Sync & Settings"
        >
          <Settings size={13} />
        </button>
      </div>

      {/* Speech bubble label helper */}
      <div className="mascot-callout-hint" onClick={handleMascotClick}>
        <span>Tap to write! ✍️</span>
      </div>
    </div>
  );
};
