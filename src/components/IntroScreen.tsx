import React, { useState, useEffect } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'merging' | 'moving'>('loading');

  useEffect(() => {
    if (phase === 'loading') {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 3) + 1; // Random increment
        if (current >= 100) {
          current = 100;
          clearInterval(interval);
          setPhase('merging');
          setTimeout(() => setPhase('moving'), 800); // 800ms for merging
          setTimeout(() => onComplete(), 1800); // 1000ms for moving to corner
        }
        setProgress(current);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase, onComplete]);

  // Calculate positions based on phase
  // Phase 'loading': distance is based on progress (100 -> 0)
  // Phase 'merging': distance is 0, they touch
  // Phase 'moving': they move to top left

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${phase === 'moving' ? 'pointer-events-none' : 'bg-slate-900/95 backdrop-blur-2xl'}`}>
      {/* Faded Background Hero - only visible during intro */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${phase === 'moving' ? 'opacity-0' : 'opacity-20'}`}>
        <img
          className="w-full h-full object-cover grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGEPzIZQKsof32BcUdYS5nDqdP0PEmleue3_zgjelnTKC1Qi6ykhTXd-nt1YJ9kmylJ7SEFMluW4HJ3-pyAC96bEWFhKpge_BNrODPRwSX72J1L1hnu65MB3G8RTCTlza-loLOyD41Svv7tu5P3m8mrRXNG-6I74HxdAS1JY_S2HPgL66vWdnD4QYFYMMhxLdOIG2jAPhHjkstfEvgjHz2N7dLSiPMp6b6koo3z9iKNf0jZzNlVHxwQD1r1tqGS8BsXO0pbBL1wls"
          alt="Background"
        />
      </div>

      {/* Intro Content */}
      <div className={`relative z-10 flex items-center justify-center w-full h-full transition-all duration-1000 ease-in-out ${phase === 'moving' ? 'opacity-0 scale-50 -translate-x-[40vw] -translate-y-[40vh]' : 'opacity-100 scale-100'}`}>
        
        <div className="flex items-center text-7xl md:text-[10rem] font-black tracking-tighter uppercase">
          {/* Left Text */}
          <span 
            className="text-white transition-transform duration-300 ease-out"
            style={{ 
              transform: phase === 'loading' ? `translateX(-${(100 - progress) * 0.4}vw)` : 'translateX(0)' 
            }}
          >
            Nato
          </span>

          {/* Progress Center */}
          <div 
            className={`mx-8 text-2xl md:text-5xl text-emerald-500 font-black tracking-widest transition-all duration-700 ${phase !== 'loading' ? 'opacity-0 w-0 mx-0 overflow-hidden scale-0' : 'opacity-100 scale-100'}`}
          >
            {progress}%
          </div>

          {/* Right Text */}
          <span 
            className="text-emerald-500 transition-transform duration-300 ease-out"
            style={{ 
              transform: phase === 'loading' ? `translateX(${(100 - progress) * 0.4}vw)` : 'translateX(0)' 
            }}
          >
            Fit
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
