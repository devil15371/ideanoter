import React, { useState, useEffect } from 'react';

interface MascotCharacterProps {
  size?: number;
  isTyping?: boolean;
  ideaCount?: number;
  onClick?: () => void;
  showBadge?: boolean;
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  size = 64,
  isTyping = false,
  ideaCount = 0,
  onClick,
  showBadge = true,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Periodic random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div
      className={`mascot-container ${isHovered ? 'hovered' : ''} ${isTyping ? 'scribbling' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size }}
      title="Click to open Idea Notepad!"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mascot-svg"
      >
        <defs>
          {/* Warm Vintage Body Gradient */}
          <radialGradient id="mascotBody" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff8db" />
            <stop offset="55%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </radialGradient>

          {/* Golden Aura Glow */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#f97316" floodOpacity="0.35" />
          </filter>

          {/* Vintage Brass Pen Cap */}
          <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>

        {/* Floating shadow */}
        <ellipse cx="50" cy="88" rx="22" ry="5" fill="#451a03" opacity="0.22" className="mascot-shadow" />

        <g filter="url(#softGlow)" className="mascot-body-group">
          {/* Little spark antenna / pen nib on head */}
          <path
            d="M 50 16 L 44 26 L 56 26 Z"
            fill="url(#brassGradient)"
            stroke="#78350f"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Spark sparkler star on antenna */}
          <circle cx="50" cy="11" r="4.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1" className="mascot-spark" />
          <path d="M 50 3 L 50 19 M 42 11 L 58 11" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />

          {/* Round cute pear-shaped parchment body */}
          <path
            d="M 50 25 C 68 25, 78 38, 78 55 C 78 72, 67 82, 50 82 C 33 82, 22 72, 22 55 C 22 38, 32 25, 50 25 Z"
            fill="url(#mascotBody)"
            stroke="#7c2d12"
            strokeWidth="2.5"
          />

          {/* Rosy cheeks */}
          <ellipse cx="32" cy="59" rx="5" ry="3" fill="#f43f5e" opacity="0.5" />
          <ellipse cx="68" cy="59" rx="5" ry="3" fill="#f43f5e" opacity="0.5" />

          {/* Eyes (Open or Blinking or Winking) */}
          {isBlinking ? (
            // Blinking closed curved lines
            <>
              <path d="M 33 51 Q 39 55 43 51" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 57 51 Q 61 55 67 51" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : isHovered ? (
            // Winking face when hovered!
            <>
              {/* Left Eye open wide happy */}
              <circle cx="38" cy="49" r="5" fill="#431407" />
              <circle cx="36" cy="47" r="2" fill="#ffffff" />
              {/* Right eye joyful wink arc */}
              <path d="M 57 50 Q 62 44 67 50" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            // Normal big inquisitive eyes
            <>
              {/* Left eye */}
              <circle cx="38" cy="49" r="4.5" fill="#431407" />
              <circle cx="36.5" cy="47.5" r="1.8" fill="#ffffff" />
              {/* Right eye */}
              <circle cx="62" cy="49" r="4.5" fill="#431407" />
              <circle cx="60.5" cy="47.5" r="1.8" fill="#ffffff" />
            </>
          )}

          {/* Cute Smile */}
          {isTyping ? (
            // Open excited smile when writing
            <path
              d="M 44 59 Q 50 67 56 59 Z"
              fill="#dc2626"
              stroke="#431407"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : isHovered ? (
            // Big happy grin
            <path
              d="M 43 58 Q 50 66 57 58"
              stroke="#431407"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            // Gentle vintage smirk
            <path
              d="M 45 59 Q 50 64 55 59"
              stroke="#431407"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Tiny vintage spectacles on nose (adds old-school charm) */}
          <circle cx="38" cy="49" r="7" stroke="#92400e" strokeWidth="1.2" fill="none" opacity="0.65" />
          <circle cx="62" cy="49" r="7" stroke="#92400e" strokeWidth="1.2" fill="none" opacity="0.65" />
          <path d="M 45 49 Q 50 46 55 49" stroke="#92400e" strokeWidth="1.2" fill="none" opacity="0.75" />

          {/* Little tiny ink quill / pencil held on right */}
          <g transform="translate(68, 52) rotate(25)">
            <rect x="0" y="0" width="4" height="22" rx="2" fill="#eab308" stroke="#713f12" strokeWidth="1" />
            <polygon points="0,22 4,22 2,27" fill="#713f12" />
          </g>
        </g>
      </svg>

      {/* Idea count pill badge */}
      {showBadge && (
        <div className="mascot-badge" title={`${ideaCount} ideas captured`}>
          <span>{ideaCount}</span>
        </div>
      )}
    </div>
  );
};
