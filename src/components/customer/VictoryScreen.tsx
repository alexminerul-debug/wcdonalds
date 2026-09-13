import React, { useEffect } from 'react';
import { Skull } from 'lucide-react';
import { GlitchText } from '../ui/GlitchText';

interface VictoryScreenProps {
  terrorPoints: number;
  onDismiss: () => void;
}

export function VictoryScreen({ terrorPoints, onDismiss }: VictoryScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-void cursor-pointer select-none" onClick={onDismiss}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-safe/20 via-void to-void pulse-glow"></div>
      
      <div className="relative z-10 text-center p-8 w-full max-w-sm">
        <Skull className="w-24 h-24 text-safe mx-auto mb-8 drop-shadow-[0_0_15px_rgba(0,255,0,0.8)] animate-pulse" />
        
        <h1 className="text-3xl sm:text-4xl font-bold font-mono text-safe mb-4">
          <GlitchText text="THE ANOMALY PREVAILS" intensity="medium" />
        </h1>
        
        <p className="text-bone font-mono mt-4 text-lg">
          You were served undetected.
        </p>
        <p className="text-eerie-dim font-mono mt-2 mb-8 uppercase tracking-widest text-sm">
          Terror spreads.
        </p>
        
        <div className="inline-block border border-safe bg-safe/10 px-6 py-3 rounded-lg">
          <div className="text-sm font-mono text-safe uppercase tracking-widest mb-1">Terror Points Gained</div>
          <div className="text-4xl font-mono font-bold text-safe animate-pulse">+{terrorPoints}</div>
        </div>
      </div>
    </div>
  );
}
