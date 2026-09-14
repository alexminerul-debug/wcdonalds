import React, { useEffect, useState, useMemo } from "react";
import type { AnomalyTrait, SecretRole } from "@/shared/types";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { Terminal, Eye, Wifi, X, ShieldCheck, Lock, Cpu } from "lucide-react";

interface WorkerHackTerminalModalProps {
  durationMs?: number;
  traits: AnomalyTrait[] | null;
  secretRole: SecretRole;
  onDismiss: () => void;
}

// Typewriter line component
function TypewriterLine({
  text,
  delayMs = 0,
  speed = 25,
  color = "text-eerie",
}: {
  text: string;
  delayMs?: number;
  speed?: number;
  color?: string;
}) {
  const [chars, setChars] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!started || chars >= text.length) return;
    const timer = setTimeout(() => setChars((c) => c + 1), speed);
    return () => clearTimeout(timer);
  }, [started, chars, text.length, speed]);

  if (!started) return null;

  return (
    <div className={`leading-relaxed text-xs ${color} animate-fade-in`}>
      <span className="text-eerie/50 mr-1">$</span>
      <span>{text.substring(0, chars)}</span>
      {chars < text.length && <span className="terminal-cursor" />}
    </div>
  );
}

// Matrix data rain column for background
function DataRainColumn({ index }: { index: number }) {
  const chars = useMemo(() => {
    const len = 10 + Math.floor(Math.random() * 15);
    return Array.from({ length: len }, () =>
      Math.random() > 0.6
        ? String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))
        : String(Math.floor(Math.random() * 2))
    ).join("\n");
  }, []);

  const duration = 2 + Math.random() * 3;
  const delay = Math.random() * 2;

  return (
    <div
      className="absolute top-0 font-mono text-[9px] leading-[11px] text-eerie/30 whitespace-pre data-rain-col"
      style={{
        left: `${index * 4}%`,
        "--rain-duration": `${duration}s`,
        "--rain-delay": `${delay}s`,
      } as React.CSSProperties}
    >
      {chars}
    </div>
  );
}

const CONNECT_LINES = [
  "INITIALIZING SSH TUNNEL...",
  "SCANNING TARGET DEVICE [192.168.x.x]...",
  "BYPASSING FIREWALL RULES...",
  "INJECTING PAYLOAD INTO DISPLAY BUFFER...",
  "PIPING FRAMEBUFFER TO MIRROR STREAM...",
  "HANDSHAKE COMPLETE ✓",
];

export function WorkerHackTerminalModal({
  durationMs = 3000,
  traits,
  secretRole,
  onDismiss,
}: WorkerHackTerminalModalProps) {
  const [stage, setStage] = useState<"connecting" | "established" | "mirror">(
    "connecting"
  );
  const [timeLeft, setTimeLeft] = useState(Math.round(durationMs / 1000));

  useEffect(() => {
    const sound = SoundEngine.getInstance();

    // Sound for connecting
    try { sound.playTerminalHacking(); } catch {}
    try { sound.playDataStream(); } catch {}

    // Stage 2: established (1200ms)
    const t1 = setTimeout(() => {
      setStage("established");
      try { sound.playBreachEstablished(); } catch {}
    }, 1200);

    // Stage 3: mirror (1800ms)
    const t2 = setTimeout(() => {
      setStage("mirror");
    }, 1800);

    // Countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Auto close
    const t3 = setTimeout(() => {
      onDismiss();
    }, durationMs + 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
      clearTimeout(t3);
    };
  }, [durationMs, onDismiss]);

  const isAnomaly = secretRole === "anomaly";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none font-mono text-bone animate-fade-in">
      {/* === STAGE 1: Connecting — Full-screen terminal with data rain === */}
      {stage === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Matrix rain background */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 25 }).map((_, i) => (
              <DataRainColumn key={i} index={i} />
            ))}
          </div>

          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 z-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%)",
              backgroundSize: "100% 3px",
            }}
          />

          {/* Terminal content */}
          <div className="relative z-20 max-w-md w-full mx-4">
            <div className="bg-void/95 border border-eerie/40 rounded-lg shadow-[0_0_40px_rgba(0,255,65,0.2)] overflow-hidden">
              {/* Terminal header */}
              <div className="bg-eerie/15 border-b border-eerie/30 px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blood" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-glow" />
                    <div className="w-2.5 h-2.5 rounded-full bg-safe" />
                  </div>
                  <Lock className="w-3 h-3 text-eerie ml-2" />
                  <span className="text-[10px] text-eerie font-bold">
                    REMOTE_HACK_TERMINAL
                  </span>
                </div>
                <Cpu className="w-3.5 h-3.5 text-eerie animate-pulse" />
              </div>

              {/* Terminal body */}
              <div className="p-4 space-y-2 bg-black/95 min-h-[180px]">
                {CONNECT_LINES.map((line, idx) => (
                  <TypewriterLine
                    key={idx}
                    text={line}
                    delayMs={idx * 180}
                    speed={18}
                    color={idx === CONNECT_LINES.length - 1 ? "text-safe" : "text-eerie"}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-4 pb-3 bg-black/95">
                <div className="flex items-center justify-between text-[10px] text-eerie/60 mb-1">
                  <span>ESTABLISHING CONNECTION</span>
                  <span className="animate-pulse">■ ■ ■</span>
                </div>
                <div className="w-full h-1.5 bg-void rounded-full overflow-hidden border border-eerie/20">
                  <div
                    className="h-full bg-gradient-to-r from-eerie-dim to-eerie rounded-full hack-progress-fill"
                    style={{ "--fill-duration": "1.1s" } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === STAGE 2: Established — Flash of green confirmation === */}
      {stage === "established" && (
        <div className="relative z-20 flex flex-col items-center gap-4 animate-zoom-in">
          {/* Green flash overlay */}
          <div
            className="absolute inset-[-200px] pointer-events-none z-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(0,255,65,0.15) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10 w-20 h-20 rounded-full bg-safe/10 border-2 border-safe flex items-center justify-center shadow-[0_0_40px_rgba(0,200,83,0.5)]">
            <ShieldCheck className="w-10 h-10 text-safe" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <h2 className="text-2xl font-extrabold neon-green tracking-wider">
              CONNECTION SECURED
            </h2>
            <p className="text-xs text-bone/60 tracking-widest uppercase">
              MIRROR STREAM LOCKED — DECRYPTING TARGET DISPLAY
            </p>
          </div>
        </div>
      )}

      {/* === STAGE 3: Mirror — Clean panel showing customer data === */}
      {stage === "mirror" && (
        <div className="relative z-20 max-w-md w-full mx-4 animate-zoom-in">
          {/* Subtle scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 z-50 rounded-lg"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 50%)",
              backgroundSize: "100% 2px",
            }}
          />

          <div className="bg-void border-2 border-amber-glow rounded-lg shadow-[0_0_40px_rgba(255,191,0,0.4)] overflow-hidden">
            {/* Header */}
            <div className="bg-amber-glow text-black font-bold text-xs px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>REMOTE PHONE MIRROR // HACK_ACTIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-black text-amber-glow px-2 py-0.5 rounded font-bold">
                  {timeLeft}s
                </span>
                <button
                  onClick={onDismiss}
                  className="text-black hover:opacity-75"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mirror content */}
            <div className="p-4 bg-black/90 space-y-3">
              {/* Connection status */}
              <div className="flex items-center justify-between border-b border-smoke/30 pb-2 animate-fade-in">
                <div className="flex items-center gap-2 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-safe" />
                  <span>TARGET PHONE STREAM</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded uppercase animate-slide-up ${
                    isAnomaly
                      ? "bg-blood text-bone"
                      : "bg-safe text-black"
                  }`}
                >
                  {isAnomaly ? "⚠ ANOMALY" : "✓ NORMAL"}
                </span>
              </div>

              {/* Classification */}
              <div
                className={`p-4 rounded border animate-slide-up ${
                  isAnomaly
                    ? "bg-blood/10 border-blood/50"
                    : "bg-safe/10 border-safe/40"
                }`}
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-amber-glow" />
                  <span className="text-xs font-bold text-bone">
                    {isAnomaly
                      ? "DETECTED ANOMALY SIGNATURES:"
                      : "SCAN RESULT:"}
                  </span>
                </div>

                {isAnomaly && traits && traits.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {traits.map((trait, idx) => (
                      <li
                        key={trait.id}
                        className="text-xs text-bone bg-black/60 p-2.5 rounded border border-smoke/20 animate-slide-up"
                        style={{
                          animationDelay: `${200 + idx * 120}ms`,
                        }}
                      >
                        <div className="text-blood-bright font-bold flex items-center gap-1.5">
                          <span className="text-blood-bright/60">▸</span>
                          {trait.display}
                        </div>
                        {trait.tip && (
                          <div className="text-[10px] text-amber-glow/80 mt-1 pl-4">
                            TIP: {trait.tip}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-fog leading-relaxed">
                    No anomalous biological signatures. Normal human biometric telemetry confirmed.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div
                className="text-[10px] text-ash text-center pt-1 flex items-center justify-center gap-2 animate-fade-in"
                style={{ animationDelay: "400ms" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                <span>
                  MIRROR CLOSES IN {timeLeft}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
