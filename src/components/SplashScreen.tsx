import React, { useEffect, useState } from 'react';
import { SunflowerLogo } from './SunflowerLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const targetName = 'Arjaan';

  useEffect(() => {
    let charIndex = 0;
    // Typing effect for "Arjaan"
    const typingInterval = setInterval(() => {
      if (charIndex <= targetName.length) {
        setDisplayText(targetName.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setShowSubtitle(true);
        // Fade out into main clean interface
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
          const completeTimer = setTimeout(() => {
            onComplete();
          }, 600);
          return () => clearTimeout(completeTimer);
        }, 1200);
        return () => clearTimeout(fadeTimer);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, [onComplete]);

  return (
    <div
      onClick={() => onComplete()}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-white transition-opacity duration-700 cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Radiant golden yellow light backlight */}
      <div
        className="absolute w-[360px] h-[360px] md:w-[500px] md:h-[500px] rounded-full blur-3xl pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(234, 179, 8, 0.15) 50%, transparent 75%)',
        }}
      />

      {/* Rotating golden geometric rings */}
      <div className="absolute w-72 h-72 rounded-full border border-amber-500/20 border-dashed animate-[sunflowerSpin_30s_linear_infinite]" />
      <div className="absolute w-96 h-96 rounded-full border border-amber-400/10" />

      {/* Center Sunflower Logo with warm glow */}
      <div className="relative mb-8 transform transition-transform duration-700 hover:scale-105">
        <SunflowerLogo size={120} glow={true} spin={false} />
      </div>

      {/* Printed name "Arjaan" */}
      <div className="relative text-center px-4">
        <div className="inline-flex items-baseline">
          <span className="text-4xl md:text-6xl font-extrabold tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(245,158,11,0.5)]">
            {displayText}
          </span>
          <span className="w-1 md:w-1.5 h-8 md:h-12 ml-1 bg-amber-400 animate-pulse rounded-full inline-block" />
        </div>

        {/* Clean subtitle */}
        <div
          className={`mt-4 text-xs md:text-sm font-medium tracking-widest text-amber-300/80 uppercase transition-all duration-700 ${
            showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          Sunflower Precision Clock &amp; Athletic Suite
        </div>
      </div>

      {/* Quick skip prompt */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute bottom-10 px-4 py-2 text-xs text-stone-400 hover:text-amber-300 transition-colors tracking-wider"
      >
        Click anywhere to continue &rarr;
      </button>
    </div>
  );
};
