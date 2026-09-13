import React from 'react';
import { NightVisionOverlay } from './NightVisionOverlay';
import { GlitchEffects } from './GlitchEffects';
import { Video, WifiOff, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface CCTVFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  connectionMode: 'webrtc' | 'canvas' | 'disconnected';
  isAnomaly: boolean;
  nightVisionOn: boolean;
  cctvGlitch: { effect: 'static' | 'blackout' | 'distortion'; isAnomaly: boolean } | null;
  hasUvScanner: boolean;
  hasStabilizer: boolean;
}

export function CCTVFeed({
  videoRef,
  canvasRef,
  connectionMode,
  isAnomaly,
  nightVisionOn,
  cctvGlitch,
  hasUvScanner,
  hasStabilizer
}: CCTVFeedProps) {
  const isDisconnected = connectionMode === 'disconnected';
  const glitchEffect = hasStabilizer && cctvGlitch?.effect === 'blackout' ? 'distortion' : cctvGlitch?.effect;

  return (
    <div className="relative w-full aspect-video bg-black border-2 border-smoke/50 rounded overflow-hidden">
      {/* Base Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={clsx(
          "absolute inset-0 w-full h-full object-cover",
          connectionMode !== 'webrtc' && "hidden"
        )}
      />
      
      <canvas
        ref={canvasRef}
        className={clsx(
          "absolute inset-0 w-full h-full object-cover",
          connectionMode !== 'canvas' && "hidden"
        )}
      />

      {/* Disconnected State */}
      {isDisconnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-void z-30">
          <WifiOff className="w-12 h-12 text-blood mb-4 animate-pulse" />
          <span className="font-mono text-blood text-xl glitch-text">NO SIGNAL</span>
        </div>
      )}

      {/* Overlays */}
      {!isDisconnected && (
        <>
          <NightVisionOverlay active={nightVisionOn} />
          
          <GlitchEffects 
            active={isAnomaly && !!cctvGlitch} 
            effect={glitchEffect || null} 
          />

          {hasUvScanner && (
            <div className="pointer-events-none absolute inset-0 z-15 opacity-30 mix-blend-screen"
                 style={{
                   backgroundImage: 'linear-gradient(rgba(100,0,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(100,0,255,0.2) 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }}
            />
          )}

          {/* Camera UI HUD */}
          <div className="absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 bg-black/50 px-2 py-1 rounded">
                <div className="w-3 h-3 rounded-full animate-pulse bg-safe" />
                <span className="font-mono text-xs text-bone">
                  CAM_01 // {connectionMode === 'canvas' ? 'LIVE' : connectionMode.toUpperCase()}
                </span>
              </div>
              <div className="font-mono text-xs text-bone bg-black/50 px-2 py-1 rounded">
                REC <span className="text-blood animate-pulse inline-block ml-1">●</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="font-mono text-xs text-ash">
                {new Date().toISOString().split('T')[0]}<br/>
                {new Date().toLocaleTimeString()}
              </div>
              {hasStabilizer && (
                <div className="flex items-center gap-1 font-mono text-xs text-safe bg-black/50 px-2 py-1 rounded">
                  <AlertCircle className="w-3 h-3" /> STABILIZER_ACTIVE
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
