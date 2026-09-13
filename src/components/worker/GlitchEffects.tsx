import React from 'react';
import { clsx } from 'clsx';

interface GlitchEffectsProps {
  active: boolean;
  effect: 'static' | 'blackout' | 'distortion' | null;
}

export function GlitchEffects({ active, effect }: GlitchEffectsProps) {
  if (!active || !effect) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {effect === 'static' && (
        <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] animate-pulse" />
      )}
      
      {effect === 'blackout' && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          <div className="font-mono text-blood text-xl glitch-text animate-pulse">
            SIGNAL LOST // RECONNECTING...
          </div>
        </div>
      )}

      {effect === 'distortion' && (
        <>
          <div className="absolute inset-0 chromatic-aberration" />
          <div className="absolute inset-0 vhs-glitch opacity-60" />
        </>
      )}
    </div>
  );
}
