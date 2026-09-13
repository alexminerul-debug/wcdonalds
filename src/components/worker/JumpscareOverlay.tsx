import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { SoundEngine } from '@/lib/audio/soundEngine';

interface JumpscareOverlayProps {
  active: boolean;
  onDismiss: () => void;
}

export function JumpscareOverlay({ active, onDismiss }: JumpscareOverlayProps) {
  useEffect(() => {
    if (active) {
      SoundEngine.getInstance().playJumpscare();
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [active, onDismiss]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none jumpscare overflow-hidden">
      <div className="absolute inset-0 bg-blood mix-blend-multiply animate-pulse" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-screen opacity-50" />
      <h1 className="font-mono text-6xl text-bone glitch-text z-10 text-center tracking-tighter mix-blend-exclusion filter drop-shadow-[0_0_20px_rgba(255,0,0,1)]">
        ANOMALY<br/>SERVED
      </h1>
    </div>
  );
}
