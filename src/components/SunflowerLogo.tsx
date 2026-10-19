import React from 'react';

interface SunflowerLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
  spin?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const SunflowerLogo: React.FC<SunflowerLogoProps> = ({
  className = 'w-16 h-16',
  size = 64,
  glow = false,
  spin = false,
  interactive = false,
  onClick,
}) => {
  // Generate 24 outer petals and 24 inner petals for rich authentic flower geometry
  const outerPetals = 24;
  const innerPetals = 24;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center relative select-none ${
        interactive ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''
      } ${spin ? 'animate-[sunflowerSpin_20s_linear_infinite]' : ''} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Sunflower Logo"
    >
      {/* Ambient yellow light aura when glow is active */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.65) 0%, rgba(234,179,8,0.2) 70%, transparent 100%)',
            transform: 'scale(1.4)',
          }}
        />
      )}

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Petal gradients */}
          <linearGradient id="sunflowerPetalDark" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="sunflowerPetalLight" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          {/* Seed center gradient */}
          <radialGradient id="sunflowerCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#451A03" />
            <stop offset="65%" stopColor="#3F1D0B" />
            <stop offset="90%" stopColor="#291206" />
            <stop offset="100%" stopColor="#1C0B03" />
          </radialGradient>

          {/* Golden ray effect */}
          <radialGradient id="sunflowerAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Seed pattern mask & pattern */}
          <pattern id="seedMesh" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="none" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#78350F" strokeWidth="0.8" opacity="0.65" />
            <line x1="0" y1="0" x2="7" y2="0" stroke="#78350F" strokeWidth="0.8" opacity="0.65" />
            <rect x="2" y="2" width="3" height="3" fill="#92400E" opacity="0.5" rx="0.5" />
          </pattern>
        </defs>

        {/* Ambient backlight */}
        {glow && (
          <circle cx="100" cy="100" r="95" fill="url(#sunflowerAura)" className="animate-pulse" />
        )}

        {/* Layer 1: Outer darker/amber petals */}
        <g>
          {Array.from({ length: outerPetals }).map((_, i) => {
            const angle = (360 / outerPetals) * i;
            return (
              <path
                key={`outer-${i}`}
                d="M 100 100 L 91 48 C 88 32 94 15 100 2 C 106 15 112 32 109 48 Z"
                fill="url(#sunflowerPetalDark)"
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* Layer 2: Inner vibrant yellow petals (offset for fullness) */}
        <g>
          {Array.from({ length: innerPetals }).map((_, i) => {
            const angle = (360 / innerPetals) * i + 360 / (innerPetals * 2);
            return (
              <path
                key={`inner-${i}`}
                d="M 100 100 L 92 56 C 89 42 95 24 100 12 C 105 24 111 42 108 56 Z"
                fill="url(#sunflowerPetalLight)"
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* Center disk border ring */}
        <circle cx="100" cy="100" r="39" fill="#291206" opacity="0.4" />

        {/* Center disk */}
        <circle cx="100" cy="100" r="36" fill="url(#sunflowerCore)" />

        {/* Seed waffle/cross-hatch pattern */}
        <circle cx="100" cy="100" r="34" fill="url(#seedMesh)" />

        {/* Inner subtle rim highlight */}
        <circle
          cx="100"
          cy="100"
          r="35"
          fill="none"
          stroke="#B45309"
          strokeWidth="1.2"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
