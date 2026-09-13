import React, { useEffect, useState } from "react";
import type { AnomalyTrait, SecretRole } from "@/shared/types";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { Terminal, ShieldCheck, Eye, Wifi, X } from "lucide-react";
import { GlitchText } from "@/components/ui/GlitchText";

interface WorkerHackTerminalModalProps {
  durationMs?: number;
  traits: AnomalyTrait[] | null;
  secretRole: SecretRole;
  onDismiss: () => void;
}

export function WorkerHackTerminalModal({
  durationMs = 3000,
  traits,
  secretRole,
  onDismiss,
}: WorkerHackTerminalModalProps) {
  const [connecting, setConnecting] = useState(true);
  const [timeLeft, setTimeLeft] = useState(Math.round(durationMs / 1000));

  useEffect(() => {
    try {
      SoundEngine.getInstance().playTerminalHacking();
    } catch {}

    const connectTimer = setTimeout(() => {
      setConnecting(false);
    }, 700);

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    const closeTimer = setTimeout(() => {
      onDismiss();
    }, durationMs + 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
      clearTimeout(closeTimer);
    };
  }, [durationMs, onDismiss]);

  const isAnomaly = secretRole === "anomaly";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-mono text-bone animate-fade-in">
      <div className="max-w-md w-full bg-void border-2 border-amber-glow rounded-lg shadow-[0_0_40px_rgba(255,191,0,0.5)] overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-amber-glow text-black font-bold text-xs px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>REMOTE PHONE MIRROR // HACK_ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-black text-amber-glow px-2 py-0.5 rounded font-bold">
              {timeLeft}s REMAINING
            </span>
            <button onClick={onDismiss} className="text-black hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-black/90 space-y-3">
          {connecting ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-glow border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-amber-glow font-bold tracking-widest uppercase">
                ESTABLISHING SECURE SSH TUNNEL...
              </p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-smoke/30 pb-2">
                <div className="flex items-center gap-2 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-safe" />
                  <span>TARGET PHONE SCREEN STREAM</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                  isAnomaly ? "bg-blood text-bone" : "bg-safe text-black"
                }`}>
                  CLASSIFICATION: {isAnomaly ? "ANOMALY IDENTIFIED" : "NORMAL CUSTOMER"}
                </span>
              </div>

              {/* Customer Screen Mirror Preview */}
              <div className={`p-4 rounded border ${
                isAnomaly ? "bg-blood/10 border-blood/50" : "bg-safe/10 border-safe/40"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-amber-glow" />
                  <span className="text-xs font-bold text-bone">
                    {isAnomaly ? "ACTIVE HIDDEN ANOMALY TRAITS:" : "INSPECTION RESULT:"}
                  </span>
                </div>

                {isAnomaly && traits && traits.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {traits.map((trait) => (
                      <li key={trait.id} className="text-xs text-bone bg-black/60 p-2 rounded border border-smoke/20">
                        <div className="text-blood-bright font-bold">&gt; {trait.display}</div>
                        {trait.tip && <div className="text-[10px] text-amber-glow/80 mt-1">TIP: {trait.tip}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-fog leading-relaxed">
                    Customer device has no anomalous biological signatures recorded. Normal human biometric telemetry.
                  </p>
                )}
              </div>

              <div className="text-[10px] text-ash text-center pt-1">
                SCREEN MIRRORING CLOSES AUTOMATICALLY IN {timeLeft} SECONDS
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
