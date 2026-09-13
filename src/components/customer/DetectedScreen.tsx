import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GlitchText } from '../ui/GlitchText';
import { vibrateAlarm } from '@/lib/effects/haptics';

interface DetectedScreenProps {
  onDismiss: () => void;
}

export function DetectedScreen({ onDismiss }: DetectedScreenProps) {
  useEffect(() => {
    // Vibrate when screen mounts
    vibrateAlarm();
    
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-blood siren-bg cursor-pointer select-none" onClick={onDismiss}>
      <div className="text-center bg-void/80 p-8 rounded-lg border-2 border-blood w-full max-w-sm backdrop-blur-sm">
        <AlertTriangle className="w-24 h-24 text-blood mx-auto mb-6 animate-pulse" />
        
        <h1 className="text-3xl sm:text-4xl font-bold font-mono text-blood mb-4 uppercase">
          <GlitchText text="YOU HAVE BEEN DETECTED!" intensity="high" />
        </h1>
        
        <div className="text-xl font-mono text-bone mt-6 uppercase tracking-widest font-bold">
          <GlitchText text="RETREAT IMMEDIATELY!" intensity="medium" />
        </div>
      </div>
    </div>
  );
}
