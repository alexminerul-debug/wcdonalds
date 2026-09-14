import React, { useEffect, useState, useMemo } from "react";
import type { AnomalyTrait, SecretRole, MenuItem } from "@/shared/types";
import { SoundEngine } from "@/lib/audio/soundEngine";
import {
  Terminal,
  Eye,
  Wifi,
  X,
  ShieldCheck,
  Lock,
  Cpu,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Battery,
  Signal,
  Radio,
} from "lucide-react";

interface WorkerHackTerminalModalProps {
  durationMs?: number;
  mirrorDurationMs?: number;
  customerName?: string;
  assignedOrder?: MenuItem[];
  traits: AnomalyTrait[] | null;
  secretRole: SecretRole;
  onDismiss: () => void;
}

// Matrix data rain column
function DataRainColumn({ index }: { index: number }) {
  const chars = useMemo(() => {
    const len = 10 + Math.floor(Math.random() * 14);
    return Array.from({ length: len }, () =>
      Math.random() > 0.6
        ? String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))
        : String(Math.floor(Math.random() * 2))
    ).join("\n");
  }, []);

  const duration = 1.8 + Math.random() * 2.5;
  const delay = Math.random() * 1.5;

  return (
    <div
      className="absolute top-0 font-mono text-[9px] leading-[11px] text-eerie/30 whitespace-pre data-rain-col select-none pointer-events-none"
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

// Terminal line component
function TerminalLine({ text, delayMs = 0 }: { text: string; delayMs?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <div className="leading-relaxed text-xs text-eerie font-mono animate-fade-in flex items-center gap-1.5">
      <span className="text-eerie/50">&gt;</span>
      <span>{text}</span>
    </div>
  );
}

export function WorkerHackTerminalModal({
  durationMs = 5000,
  mirrorDurationMs = 3000,
  customerName = "Customer",
  assignedOrder = [],
  traits,
  secretRole,
  onDismiss,
}: WorkerHackTerminalModalProps) {
  // Stage: "terminal" (connecting) -> "screen" (viewing customer's phone for 3s)
  const [stage, setStage] = useState<"terminal" | "screen">("terminal");
  const [mirrorTimeLeft, setMirrorTimeLeft] = useState(3);

  const isAnomaly = secretRole === "anomaly";

  useEffect(() => {
    const sound = SoundEngine.getInstance();
    try {
      sound.playTerminalHacking();
      sound.playDataStream();
    } catch {}

    // Step 1: Terminal connects for 1.4 seconds, then switches to customer's phone screen
    const connectTimer = setTimeout(() => {
      try {
        sound.playBreachEstablished();
      } catch {}
      setStage("screen");
    }, 1400);

    return () => {
      clearTimeout(connectTimer);
    };
  }, []);

  // Countdown timer for 3 seconds of viewing customer's screen
  useEffect(() => {
    if (stage !== "screen") return;

    const interval = setInterval(() => {
      setMirrorTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // After exactly 3 seconds on screen stage, close modal
    const closeTimer = setTimeout(() => {
      onDismiss();
    }, mirrorDurationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(closeTimer);
    };
  }, [stage, mirrorDurationMs, onDismiss]);

  const CONNECT_LINES = [
    `TARGET ACQUIRED: ${customerName.toUpperCase()}'S PHONE`,
    "PROBING PORT 443 // BYPASSING LOCKSCREEN...",
    "INJECTING REMOTE MIRROR DRIVER (v3.1)...",
    "DECRYPTING DISPLAY FRAMEBUFFER [1080x2400]...",
    "STREAM SYNCHRONIZED — MIRRORING CUSTOMER SCREEN NOW ✓",
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-md select-none font-mono text-bone animate-fade-in overflow-hidden">
      {/* ================= STAGE 1: TERMINAL CONNECTING ================= */}
      {stage === "terminal" && (
        <div className="relative z-20 max-w-lg w-full">
          {/* Matrix data rain background */}
          <div className="absolute -inset-10 overflow-hidden opacity-30 pointer-events-none">
            {Array.from({ length: 25 }).map((_, i) => (
              <DataRainColumn key={i} index={i} />
            ))}
          </div>

          <div className="bg-void/95 border-2 border-eerie/60 rounded-lg shadow-[0_0_50px_rgba(0,255,65,0.3)] overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-eerie/20 border-b border-eerie/40 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blood" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-glow" />
                  <div className="w-2.5 h-2.5 rounded-full bg-safe" />
                </div>
                <Terminal className="w-4 h-4 text-eerie ml-2" />
                <span className="text-xs text-eerie font-bold tracking-wider">
                  REMOTE_EXPLOIT // INTRUSION_DAEMON
                </span>
              </div>
              <Cpu className="w-4 h-4 text-eerie animate-spin" />
            </div>

            {/* Terminal Body */}
            <div className="p-4 space-y-2.5 bg-black/95 min-h-[170px]">
              {CONNECT_LINES.map((line, idx) => (
                <TerminalLine key={idx} text={line} delayMs={idx * 220} />
              ))}
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-4 bg-black/95">
              <div className="flex items-center justify-between text-[11px] text-eerie/70 mb-1.5">
                <span className="font-bold">INITIALIZING PHONE MIRROR HOOK</span>
                <span className="animate-pulse text-safe">CONNECTING...</span>
              </div>
              <div className="w-full h-2 bg-void rounded-full overflow-hidden border border-eerie/30">
                <div
                  className="h-full bg-gradient-to-r from-eerie-dim via-eerie to-safe rounded-full hack-progress-fill"
                  style={{ "--fill-duration": "1.3s" } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 2: CUSTOMER'S ACTUAL PHONE SCREEN (3 SECONDS) ================= */}
      {stage === "screen" && (
        <div className="relative z-30 flex flex-col items-center max-w-sm w-full animate-zoom-in">
          {/* Top Live Streaming Banner */}
          <div className="w-full mb-2 bg-blood/90 text-bone px-3 py-1.5 rounded flex items-center justify-between text-xs font-bold shadow-lg border border-blood-bright animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-bone animate-ping" />
              <span>LIVE CUSTOMER PHONE MIRROR</span>
            </div>
            <span className="bg-black/60 text-blood-bright px-2 py-0.5 rounded font-mono">
              CLOSES IN {mirrorTimeLeft}s
            </span>
          </div>

          {/* SMARTPHONE FRAME MOCKUP */}
          <div className="w-full bg-[#1c1c1e] p-2.5 rounded-[36px] shadow-[0_0_60px_rgba(255,255,255,0.15)] border-4 border-[#3a3a3c] relative overflow-hidden">
            {/* Front speaker & Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
            </div>

            {/* Phone Screen Glass */}
            <div className="relative w-full aspect-[9/18.5] bg-abyss rounded-[28px] overflow-hidden flex flex-col border border-black text-bone">
              {/* Scanline CRT overlay for mirrored aesthetic */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20 z-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)",
                  backgroundSize: "100% 3px",
                }}
              />

              {/* Top Phone Status Bar */}
              <div className="pt-3 px-5 pb-1 flex justify-between items-center text-[10px] text-bone/70 shrink-0 select-none z-30">
                <span className="font-semibold">11:59 PM</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <span className="text-[9px] font-bold">5G</span>
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Customer App Header inside phone */}
              <div className="px-4 py-2 bg-void border-b border-smoke/40 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[11px] font-black tracking-wider text-amber-glow">
                    WcDONALD'S APP
                  </div>
                  <div className="text-[9px] text-fog truncate max-w-[130px]">
                    User: {customerName}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-blood/20 border border-blood/40 px-1.5 py-0.5 rounded text-[8px] text-blood-bright font-bold">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span>MIRRORED</span>
                </div>
              </div>

              {/* CUSTOMER PHONE SCREEN CONTENT */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto custom-scrollbar relative z-20">
                {/* 1. CLASSIFICATION BADGE */}
                {isAnomaly ? (
                  <div className="p-2.5 bg-blood/20 border-2 border-blood rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.4)] animate-pulse">
                    <div className="flex items-center gap-2 text-blood-bright font-black text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>CLASSIFICATION: ANOMALY</span>
                    </div>
                    <p className="text-[9px] text-bone/80 mt-1 leading-tight font-sans">
                      Device belongs to an active anomaly subject. High threat level.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-safe/15 border-2 border-safe/60 rounded-xl">
                    <div className="flex items-center gap-2 text-safe font-black text-xs">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>CLASSIFICATION: NORMAL CUSTOMER</span>
                    </div>
                    <p className="text-[9px] text-bone/80 mt-1 leading-tight font-sans">
                      Verified human telemetry. No anomaly traits detected.
                    </p>
                  </div>
                )}

                {/* 2. CUSTOMER'S ACTUAL ORDER ON THEIR PHONE */}
                <div className="bg-void/80 border border-smoke/30 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold text-amber-glow uppercase tracking-wider mb-1.5 flex justify-between items-center">
                    <span>Customer's Order</span>
                    <span className="text-[9px] text-ash font-normal">
                      {assignedOrder.length} items
                    </span>
                  </div>

                  {assignedOrder.length > 0 ? (
                    <div className="space-y-1.5">
                      {assignedOrder.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className="flex items-center justify-between bg-abyss/80 border border-smoke/20 px-2 py-1.5 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base shrink-0">{item.emoji}</span>
                            <span className="truncate text-[11px] text-bone font-medium">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-glow font-bold shrink-0 ml-1">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-fog italic text-center py-2">
                      Order details synchronizing...
                    </div>
                  )}
                </div>

                {/* 3. SECRET ANOMALY OBJECTIVES / DIRECTIVES (IF ANOMALY) */}
                {isAnomaly && traits && traits.length > 0 && (
                  <div className="bg-blood/10 border border-blood/40 rounded-xl p-2.5 space-y-1.5">
                    <div className="text-[10px] font-bold text-blood-bright uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Active Anomaly Instructions:</span>
                    </div>

                    <div className="space-y-1.5">
                      {traits.map((trait) => (
                        <div
                          key={trait.id}
                          className="bg-black/70 border border-blood/30 p-2 rounded-lg text-[10px] text-bone"
                        >
                          <div className="text-blood-bright font-bold flex items-start gap-1">
                            <span className="text-blood-bright">⚠</span>
                            <span>{trait.display}</span>
                          </div>
                          {trait.tip && (
                            <div className="text-[9px] text-amber-glow/90 mt-1 pl-3 italic">
                              Tip: {trait.tip}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isAnomaly && (
                  <div className="bg-void/40 border border-smoke/20 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-fog">
                      Customer is browsing the mobile rewards menu.
                    </div>
                    <div className="text-[9px] text-safe font-bold mt-1">
                      LOYALTY POINTS: 450 PTS (GOLD)
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Phone Home Bar Indicator */}
              <div className="py-2 flex justify-center shrink-0">
                <div className="w-28 h-1 bg-bone/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="mt-2 text-xs font-mono text-ash hover:text-bone flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE STREAM NOW</span>
          </button>
        </div>
      )}
    </div>
  );
}
