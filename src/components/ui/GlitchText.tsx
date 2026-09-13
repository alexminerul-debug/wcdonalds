import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlitchText({ text, className = '', intensity = 'medium' }: GlitchTextProps) {
  // Intensity could map to different animation durations or styles if needed.
  // For now, we apply the glitch-text class which uses data-text for chromatic aberration.
  
  return (
    <span 
      className={`glitch-text font-mono inline-block ${className}`} 
      data-text={text}
      style={{
        '--glitch-intensity': intensity === 'high' ? '2s' : intensity === 'low' ? '6s' : '4s',
      } as React.CSSProperties}
    >
      {text}
    </span>
  );
}
