import React, { useEffect, useState, useMemo } from "react";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { Terminal, ShieldAlert, WifiOff, Zap, Radio, Eye } from "lucide-react";

interface CustomerHackOverlayProps {
  durationMs?: number;
  onDismiss: () => void;
}

// Typewriter line component — reveals text character by character
function TypewriterLine({ text, delayMs = 0, speed = 30 }: { text: string; delayMs?: number; speed?: number }) {
  const [chars, setChars] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delayMs);
    return () => clearTimeout(startTimer);
  }, [delayMs]);

  useEffect(() => {
    if (!started) return;
    if (chars >= text.length) return;
    const timer = setTimeout(() => setChars((c) => c + 1), speed);
    return () => clearTimeout(timer);
  }, [started, chars, text.length, speed]);

  if (!started) return null;

  return (
    <div className="leading-tight text-[11px] animate-fade-in">
      <span className="text-eerie/70">{">"} </span>
      <span>{text.substring(0, chars)}</span>
      {chars < text.length && <span className="terminal-cursor" />}
    </div>
  );
}

// Matrix data rain column
function DataRainColumn({ index }: { index: number }) {
  const chars = useMemo(() => {
    const len = 8 + Math.floor(Math.random() * 12);
    return Array.from({ length: len }, () =>
      Math.random() > 0.5
        ? String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)) // katakana
        : Math.random() > 0.5
        ? String(Math.floor(Math.random() * 2))
        : String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("\n");
  }, []);

  const duration = 1.5 + Math.random() * 2;
  const delay = Math.random() * 1.5;

  return (
    <div
      className="absolute top-0 font-mono text-[10px] leading-[12px] text-eerie/60 whitespace-pre overflow-hidden data-rain-col"
      style={{
        left: `${index * 5}%`,
        "--rain-duration": `${duration}s`,
        "--rain-delay": `${delay}s`,
      } as React.CSSProperties}
    >
      {chars}
    </div>
  );
}

// Crack SVG pattern
function CrackPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full crack-spread pointer-events-none z-30"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Impact point */}
      <circle cx="200" cy="200" r="8" fill="white" opacity="0.9" />
      <circle cx="200" cy="200" r="20" stroke="white" strokeWidth="1" opacity="0.4" />

      {/* Major cracks radiating outward */}
      <path d="M200 200 L120 80 L100 60" stroke="white" strokeWidth="2" opacity="0.8" />
      <path d="M200 200 L300 90 L340 40" stroke="white" strokeWidth="2" opacity="0.8" />
      <path d="M200 200 L340 250 L390 260" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <path d="M200 200 L280 340 L310 390" stroke="white" strokeWidth="2" opacity="0.8" />
      <path d="M200 200 L90 300 L40 350" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <path d="M200 200 L60 180 L10 170" stroke="white" strokeWidth="2" opacity="0.8" />
      <path d="M200 200 L160 340 L140 400" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <path d="M200 200 L230 60 L240 10" stroke="white" strokeWidth="1.5" opacity="0.7" />

      {/* Minor branch cracks */}
      <path d="M150 130 L110 140" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M260 140 L290 120" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M280 280 L310 300" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M130 260 L100 280" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M170 100 L140 70" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M320 200 L360 190" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M240 300 L260 330" stroke="white" strokeWidth="1" opacity="0.4" />
      <path d="M80 230 L50 220" stroke="white" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

const TERMINAL_LINES = [
  "ERR 0x0049F: BUFFER_OVERFLOW_DETECTED",
  "INJECTING REMOTE ACCESS PAYLOAD...",
  "BYPASSING DISPLAY CONTROLLER v2.4.1...",
  "EXFILTRATING CUSTOMER STATE PROTOCOL...",
  "CAMERA STREAM COMPROMISED // PIPE OPEN",
  "CONNECTING TO REMOTE WORKER TERMINAL...",
  "MIRROR SESSION ESTABLISHED ✓",
];

export function CustomerHackOverlay({ durationMs = 3000, onDismiss }: CustomerHackOverlayProps) {
  const [stage, setStage] = useState<
    "interference" | "crack" | "terminals" | "breach" | "mirror"
  >("interference");

  useEffect(() => {
    const sound = SoundEngine.getInstance();

    // Stage 1: interference (0ms)
    try { sound.playStaticNoise(); } catch {}
    try { sound.playDataStream(); } catch {}

    // Stage 2: crack (400ms)
    const t1 = setTimeout(() => {
      setStage("crack");
      try { sound.playScreenCrack(); } catch {}
    }, 400);

    // Stage 3: terminals (900ms)
    const t2 = setTimeout(() => {
      setStage("terminals");
      try { sound.playTerminalHacking(); } catch {}
    }, 900);

    // Stage 4: breach (2200ms)
    const t3 = setTimeout(() => {
      setStage("breach");
      try { sound.playBreachEstablished(); } catch {}
    }, 2200);

    // Stage 5: mirror (2800ms)
    const t4 = setTimeout(() => {
      setStage("mirror");
    }, 2800);

    // Auto dismiss
    const t5 = setTimeout(() => {
      onDismiss();
    }, durationMs + 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [durationMs, onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center select-none font-mono text-bone overflow-hidden ${
        stage === "crack" ? "hack-shake" : ""
      }`}
      style={{
        backgroundColor:
          stage === "interference"
            ? "rgba(0, 0, 0, 0.92)"
            : stage === "crack"
            ? "rgba(0, 0, 0, 0.97)"
            : "rgba(0, 0, 0, 0.96)",
      }}
    >
      {/* === STAGE 1: Interference === */}
      {stage === "interference" && (
        <>
          {/* Static noise grain */}
          <div className="absolute inset-0 signal-lost opacity-30 z-10" />
          {/* RGB offset bars */}
          <div className="absolute inset-0 vhs-glitch z-20" />
          {/* Chromatic aberration */}
          <div className="absolute inset-0 chromatic-aberration opacity-60 z-20" />
          {/* Center warning */}
          <div className="relative z-30 flex flex-col items-center gap-3 animate-fade-in">
            <Radio className="w-10 h-10 text-blood-bright animate-pulse" />
            <p className="text-sm text-blood-bright font-bold tracking-widest uppercase glitch-text">
              SIGNAL INTERCEPTED
            </p>
          </div>
        </>
      )}

      {/* === STAGE 2: Crack === */}
      {stage === "crack" && (
        <>
          {/* White flash */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, transparent 60%)",
              animation: "fade-in 0.05s ease-out, fade-in 0.4s ease-out reverse forwards",
            }}
          />
          {/* Crack SVG */}
          <CrackPattern />
          {/* Scanline sweep */}
          <div className="hack-scandown" />
          {/* Static noise */}
          <div className="absolute inset-0 signal-lost opacity-50 z-10" />
        </>
      )}

      {/* === STAGE 3: Terminals === */}
      {stage === "terminals" && (
        <>
          {/* Data rain background */}
          <div className="absolute inset-0 overflow-hidden opacity-20 z-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <DataRainColumn key={i} index={i} />
            ))}
          </div>
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15 z-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.5) 50%)",
              backgroundSize: "100% 3px",
            }}
          />

          {/* Terminal Window 1 — top-left */}
          <div
            className="absolute top-[8%] left-[5%] w-[55%] max-w-xs z-40 animate-zoom-in"
            style={{ animationDelay: "0ms" }}
          >
            <div className="bg-void border border-eerie/50 rounded shadow-[0_0_30px_rgba(0,255,65,0.3)] overflow-hidden">
              <div className="bg-eerie/20 border-b border-eerie/30 px-2 py-1 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-eerie" />
                <span className="text-[10px] text-eerie font-bold">EXPLOIT_v3.7.exe</span>
              </div>
              <div className="p-2 space-y-1 text-eerie bg-black/90 max-h-32 overflow-hidden">
                {TERMINAL_LINES.slice(0, 3).map((line, idx) => (
                  <TypewriterLine key={idx} text={line} delayMs={idx * 200} speed={20} />
                ))}
              </div>
            </div>
          </div>

          {/* Terminal Window 2 — center */}
          <div
            className="relative z-40 max-w-sm w-full mx-4 animate-zoom-in"
            style={{ animationDelay: "150ms" }}
          >
            <div className="bg-void border-2 border-blood rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.6)] overflow-hidden">
              <div className="bg-blood text-void font-bold text-xs px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>CRITICAL_SYSTEM_BREACH.EXE</span>
                </div>
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 space-y-1.5 text-xs font-mono text-blood-bright bg-black/90">
                <div className="flex items-center gap-2 text-bone font-bold mb-2">
                  <WifiOff className="w-4 h-4 text-blood animate-pulse" />
                  <span className="glitch-text neon-red text-sm">DEVICE COMPROMISED</span>
                </div>
                {TERMINAL_LINES.slice(3).map((line, idx) => (
                  <TypewriterLine key={idx} text={line} delayMs={300 + idx * 250} speed={25} />
                ))}
              </div>
            </div>
          </div>

          {/* Terminal Window 3 — bottom-right */}
          <div
            className="absolute bottom-[10%] right-[5%] w-[50%] max-w-xs z-40 animate-zoom-in"
            style={{ animationDelay: "300ms" }}
          >
            <div className="bg-void border border-amber-glow/50 rounded shadow-[0_0_20px_rgba(255,150,0,0.3)] overflow-hidden">
              <div className="bg-amber-glow/20 border-b border-amber-glow/30 px-2 py-1 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-glow" />
                <span className="text-[10px] text-amber-glow font-bold">PAYLOAD_INJECT</span>
              </div>
              <div className="p-2 bg-black/90">
                {/* Progress bar */}
                <div className="text-[10px] text-amber-glow/70 mb-1">INJECTION PROGRESS:</div>
                <div className="w-full h-2 bg-void rounded-full overflow-hidden border border-amber-glow/30">
                  <div
                    className="h-full bg-amber-glow rounded-full hack-progress-fill"
                    style={{ "--fill-duration": "1s" } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === STAGE 4: Breach Established === */}
      {stage === "breach" && (
        <div className="relative z-40 flex flex-col items-center gap-4 animate-zoom-in">
          <div className="w-20 h-20 rounded-full bg-blood/20 border-2 border-blood-bright flex items-center justify-center breach-pulse">
            <ShieldAlert className="w-10 h-10 text-blood-bright" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold neon-red tracking-wider glitch-text">
              BREACH ESTABLISHED
            </h2>
            <p className="text-xs text-bone/70 tracking-widest uppercase">
              CONNECTION TO WORKER TERMINAL: <span className="text-safe font-bold">ACTIVE</span>
            </p>
          </div>
          {/* Siren border pulse */}
          <div className="absolute inset-0 pointer-events-none siren-bg rounded-xl" />
        </div>
      )}

      {/* === STAGE 5: Mirror === */}
      {stage === "mirror" && (
        <>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/80 z-10" />
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 z-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
              backgroundSize: "100% 3px",
            }}
          />
          {/* Banner */}
          <div className="relative z-30 flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3 bg-blood/20 border border-blood/50 rounded-lg px-6 py-3">
              <div className="w-3 h-3 rounded-full bg-blood-bright animate-pulse" />
              <Eye className="w-5 h-5 text-blood-bright" />
              <span className="text-sm font-bold text-bone tracking-widest uppercase">
                WORKER IS VIEWING YOUR SCREEN
              </span>
              <div className="w-3 h-3 rounded-full bg-blood-bright animate-pulse" />
            </div>
            <p className="text-[10px] text-ash tracking-wider">
              MIRROR SESSION ACTIVE — YOUR DATA IS BEING EXFILTRATED
            </p>
          </div>
        </>
      )}
    </div>
  );
}
