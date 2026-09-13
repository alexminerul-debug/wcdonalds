import React from 'react';
import { Users, Clock } from 'lucide-react';

interface QueueWaitingProps {
  position: number;
  totalInQueue: number;
  onPreviewMenu: () => void;
}

export function QueueWaiting({ position, totalInQueue, onPreviewMenu }: QueueWaitingProps) {
  const ahead = Math.max(0, position - 1);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-void text-bone p-6 select-none">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        
        {/* Pulse Effect Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-blood/20 rounded-full blur-3xl pulse-glow animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            <Clock className="w-12 h-12 mb-4 text-blood opacity-80" />
            <h2 className="text-xl font-mono text-eerie-dim uppercase tracking-widest">
              {ahead === 0 ? "You're Next!" : "Please Wait"}
            </h2>
            <div className="text-6xl font-bold font-mono mt-4 mb-2 text-blood-bright glitch-text" data-text={`#${position}`}>
              #{position}
            </div>
            <p className="text-lg font-mono text-ash uppercase">
              {ahead === 0 ? "Step up to counter" : "in line"}
            </p>
          </div>
        </div>

        {/* Queue Info */}
        <div className="flex items-center space-x-2 text-smoke bg-abyss px-6 py-3 rounded-full border border-eerie">
          <Users className="w-5 h-5" />
          <span className="font-mono">
            {ahead === 0 ? "Preparing your order card..." : `${ahead} of ${totalInQueue} customers ahead`}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="w-full pb-8">
        <button 
          onClick={onPreviewMenu}
          className="w-full py-4 border-2 border-blood text-blood-bright font-mono uppercase tracking-widest hover:bg-blood/10 transition-colors rounded-none"
        >
          Preview Menu
        </button>
      </div>
    </div>
  );
}
