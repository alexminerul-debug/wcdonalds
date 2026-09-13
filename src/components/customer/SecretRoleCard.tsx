import React, { useEffect, useState } from 'react';
import { Skull, AlertTriangle } from 'lucide-react';
import { GlitchText } from '../ui/GlitchText';

interface SecretRoleCardProps {
  role: 'normal' | 'anomaly';
  onDismiss: () => void;
}

export function SecretRoleCard({ role, onDismiss }: SecretRoleCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Dramatic reveal delay
    const showTimer = setTimeout(() => setVisible(true), 100);
    
    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 3000);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const isAnomaly = role === 'anomaly';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-void cursor-pointer select-none"
      onClick={onDismiss}
    >
      <div 
        className={`w-full max-w-sm rounded-lg p-8 border-2 transition-all duration-1000 transform flex flex-col items-center text-center
          ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          ${isAnomaly ? 'border-blood bg-blood/5 shadow-[0_0_50px_rgba(255,0,0,0.4)]' : 'border-safe bg-safe/5 shadow-[0_0_50px_rgba(0,255,0,0.2)]'}
        `}
      >
        {isAnomaly ? (
          <>
            <AlertTriangle className="w-24 h-24 text-blood mb-6 animate-pulse" />
            <h1 className="text-3xl font-bold font-mono text-blood-bright mb-4">
              <GlitchText text="YOU ARE THE ANOMALY" intensity="high" />
            </h1>
            <p className="text-ash font-mono mt-2">
              Deceive. Blend in. Strike.
            </p>
          </>
        ) : (
          <>
            <Skull className="w-24 h-24 text-safe mb-6" />
            <h1 className="text-3xl font-bold font-mono text-safe mb-4">
              YOU ARE A NORMAL CUSTOMER
            </h1>
            <p className="text-safe/70 font-mono mt-2 uppercase tracking-widest">
              Act natural. Nothing to hide.
            </p>
          </>
        )}
      </div>
      <div className="absolute bottom-12 text-eerie-dim font-mono text-sm animate-pulse">
        Tap to continue
      </div>
    </div>
  );
}
