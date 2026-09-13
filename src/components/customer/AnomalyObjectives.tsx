import React from 'react';
import type { AnomalyTrait } from '@/shared/types';
import { AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { GlitchText } from '../ui/GlitchText';

interface AnomalyObjectivesProps {
  traits: AnomalyTrait[];
  detectedTraits: string[];
}

export function AnomalyObjectives({ traits = [], detectedTraits = [] }: AnomalyObjectivesProps) {
  const safeTraits = Array.isArray(traits) ? traits.filter(Boolean) : [];
  const safeDetected = Array.isArray(detectedTraits) ? detectedTraits : [];

  return (
    <div className="p-6 rounded-lg bg-abyss border border-blood/50 w-full max-w-md mx-auto relative mt-6">
      <div className="flex items-center space-x-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-blood animate-pulse" />
        <h2 className="text-xl font-mono text-blood uppercase tracking-widest font-bold">
          <GlitchText text="ANOMALY OBJECTIVES" intensity="low" />
        </h2>
      </div>
      
      <ul className="space-y-4 mb-6">
        {safeTraits.map((trait, index) => {
          if (!trait || !trait.id) return null;
          const isDetected = safeDetected.includes(trait.id);
          return (
            <li key={trait.id || index} className="flex items-start space-x-3">
              <div className="mt-1 flex-shrink-0">
                {isDetected ? (
                  <CheckCircle2 className="w-5 h-5 text-safe drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                ) : (
                  <Circle className="w-5 h-5 text-eerie-dim" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-mono text-sm sm:text-base transition-colors duration-500 ${isDetected ? 'text-safe line-through opacity-70' : 'text-bone'}`}>
                  {trait.display}
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-void text-ash border border-eerie rounded">
                    {trait.category}
                  </span>
                  {trait.difficulty && (
                    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded ${
                      trait.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                      trait.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' :
                      'bg-blood/20 text-blood-bright border border-blood/40'
                    }`}>
                      {trait.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      <div className="mt-4 pt-4 border-t border-eerie">
        <div className="flex items-center space-x-2 text-blood-bright text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-blood rec-blink"></div>
          <span className="uppercase tracking-widest opacity-80">
            AI Camera is observing your physical form...
          </span>
        </div>
      </div>
    </div>
  );
}
