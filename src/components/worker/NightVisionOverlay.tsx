import React from 'react';
import { clsx } from 'clsx';

interface NightVisionOverlayProps {
  active: boolean;
}

export function NightVisionOverlay({ active }: NightVisionOverlayProps) {
  return (
    <div 
      className={clsx(
        "pointer-events-none absolute inset-0 z-10 transition-opacity duration-1000",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-eerie/30 mix-blend-multiply" />
      <div className="absolute inset-0 scanline-overlay opacity-50" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,50,0,0.8)]" />
      <div className="absolute top-4 left-4 font-mono text-eerie text-sm animate-pulse">NVG_ACTIVE</div>
    </div>
  );
}
