import React from 'react';
import { clsx } from 'clsx';

interface GlitchEffectsProps {
  active: boolean;
  effect: 'static' | 'blackout' | 'distortion' | 'scanline' | null;
  isBloodMoon?: boolean;
}

export function GlitchEffects({ active, effect, isBloodMoon }: GlitchEffectsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* Ambient scanlines always present on CRT CCTV */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Red Night Moon crimson atmosphere */}
      {isBloodMoon && (
        <div className="absolute inset-0 bg-blood/15 mix-blend-color-burn pointer-events-none animate-pulse" />
      )}

      {active && effect === 'static' && (
        <div className="absolute inset-0 opacity-60 mix-blend-screen bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz4KPC9zdmc+')] animate-pulse" />
      )}
      
      {active && effect === 'blackout' && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          <div className="font-mono text-blood text-xl glitch-text animate-pulse">
            SIGNAL LOST // RECONNECTING...
          </div>
        </div>
      )}

      {active && (effect === 'distortion' || effect === 'scanline') && (
        <>
          <div className="absolute inset-0 chromatic-aberration" />
          <div className="absolute inset-0 vhs-glitch opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blood/20 to-transparent animate-bounce opacity-50" />
        </>
      )}
    </div>
  );
}
