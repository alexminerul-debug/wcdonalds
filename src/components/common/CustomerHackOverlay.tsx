import React, { useEffect, useState } from "react";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { Terminal, ShieldAlert, WifiOff } from "lucide-react";
import { GlitchText } from "@/components/ui/GlitchText";

interface CustomerHackOverlayProps {
  durationMs?: number;
  onDismiss: () => void;
}

export function CustomerHackOverlay({ durationMs = 3000, onDismiss }: CustomerHackOverlayProps) {
  const [stage, setStage] = useState<"glitch" | "shatter" | "terminal">("glitch");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  useEffect(() => {
    try {
      SoundEngine.getInstance().playTerminalHacking();
    } catch {}

    const t1 = setTimeout(() => {
      setStage("shatter");
      try {
        SoundEngine.getInstance().playGlassShatter();
      } catch {}
    }, 450);

    const t2 = setTimeout(() => {
      setStage("terminal");
      setTerminalLines([
        "ERR 0x0049F: BUFFER_OVERFLOW_DETECTED",
        "CONNECTING TO REMOTE WORKER TERMINAL...",
        "EXFILTRATING CUSTOMER STATE PROTOCOL...",
        "BYPASSING DISPLAY CONTROLLER...",
        "CAMERA STREAM COMPROMISED // MIRRORING ACTIVE",
      ]);
    }, 900);

    const t3 = setTimeout(() => {
      onDismiss();
    }, durationMs + 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [durationMs, onDismiss]);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/95 select-none font-mono text-bone overflow-hidden">
      {/* Broken Screen Glass Cracks Overlay */}
      {stage === "shatter" && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-ping">
          <svg className="w-full h-full opacity-90 stroke-blood-bright fill-none stroke-2" viewBox="0 0 100 100">
            <path d="M50 50 L10 10 M50 50 L90 20 M50 50 L80 85 M50 50 L20 80 M50 50 L45 5 M50 50 L95 55 M50 50 L5 55" />
            <circle cx="50" cy="50" r="12" className="stroke-white stroke-1 fill-white/20" />
          </svg>
        </div>
      )}

      {/* Screen Glitch chromatic aberration */}
      <div className="absolute inset-0 chromatic-aberration opacity-80" />
      <div className="absolute inset-0 vhs-glitch opacity-90" />

      {/* Terminal Windows Appearing */}
      <div className="relative z-40 max-w-sm w-full mx-4 bg-void border-2 border-blood rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.8)] overflow-hidden">
        <div className="bg-blood text-void font-bold text-xs px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>CRITICAL_SYSTEM_BREACH.EXE</span>
          </div>
          <ShieldAlert className="w-4 h-4 animate-bounce" />
        </div>

        <div className="p-4 space-y-2 text-xs font-mono text-blood-bright bg-black/90 min-h-[140px]">
          <div className="flex items-center gap-2 text-bone font-bold mb-2">
            <WifiOff className="w-4 h-4 text-blood animate-pulse" />
            <GlitchText text="DEVICE COMPROMISED // WORKER MIRROR ACTIVE" intensity="high" />
          </div>

          {terminalLines.map((line, idx) => (
            <div key={idx} className="leading-tight animate-fade-in text-[11px]">
              &gt; {line}
            </div>
          ))}

          <div className="pt-3 flex items-center gap-2 text-safe text-[10px]">
            <span className="w-2 h-2 rounded-full bg-safe animate-ping" />
            <span>EXFILTRATION PROGRESS: 100% - MIRRORING FEED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
