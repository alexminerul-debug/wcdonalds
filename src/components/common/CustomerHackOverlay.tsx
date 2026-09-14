import React, { useEffect, useState, useMemo } from "react";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { Terminal, ShieldAlert, WifiOff, Zap, Eye, AlertTriangle, X, Lock } from "lucide-react";

interface CustomerHackOverlayProps {
  durationMs?: number;
  onDismiss: () => void;
}

interface TerminalWindowData {
  id: number;
  title: string;
  lines: string[];
  style: React.CSSProperties;
  color: "blood" | "eerie" | "amber";
  spawnMs: number;
  closeMs: number;
}

export function CustomerHackOverlay({ durationMs = 5000, onDismiss }: CustomerHackOverlayProps) {
  // Elapsed time tracker in ms
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);

  // 8 distinct hacker terminal windows scattered across customer's phone screen
  const windows: TerminalWindowData[] = useMemo(
    () => [
      {
        id: 1,
        title: "ROOT_SHELL_EXPLOIT.sh",
        lines: [
          "CONNECT 192.168.1.104:443",
          "PORT_BYPASS: 0x49FA... OK",
          "INJECTING REMOTE DEBUGGER",
        ],
        style: { top: "4%", left: "4%", width: "58%" },
        color: "eerie",
        spawnMs: 150,
        closeMs: 3300,
      },
      {
        id: 2,
        title: "SECURITY_BREACH.exe",
        lines: [
          "CRITICAL: BUFFER CORRUPTED",
          "BYPASS DISPLAY DRIVER v2.4",
        ],
        style: { top: "8%", right: "4%", width: "50%" },
        color: "blood",
        spawnMs: 450,
        closeMs: 3400,
      },
      {
        id: 3,
        title: "ALERT_INTRUSION_DETECTED",
        lines: [
          "UNAUTHORIZED WORKER POS CONNECTING...",
          "MIRRORING PERMISSION OVERRIDDEN",
        ],
        style: { top: "22%", left: "6%", width: "88%" },
        color: "blood",
        spawnMs: 800,
        closeMs: 3500,
      },
      {
        id: 4,
        title: "MEM_DUMP_0x3F.bin",
        lines: [
          "7F 45 4C 46 02 01 01 00",
          "00 00 00 00 00 00 00 00",
          "DUMPING FRAMEBUFFER TO STREAM",
        ],
        style: { top: "37%", left: "3%", width: "56%" },
        color: "eerie",
        spawnMs: 1200,
        closeMs: 3600,
      },
      {
        id: 5,
        title: "CAMERA_STREAM_PIPE.sys",
        lines: [
          "HOOKING FRONT SENSOR...",
          "PIPE: /dev/video0 -> POS_TERM",
        ],
        style: { top: "42%", right: "4%", width: "54%" },
        color: "amber",
        spawnMs: 1600,
        closeMs: 3700,
      },
      {
        id: 6,
        title: "NETSTAT_ACTIVE_SOCKET",
        lines: [
          "ESTABLISHED: WORKER_POS_01",
          "PROTOCOL: RAW_PIXEL_SYNC",
        ],
        style: { top: "56%", left: "5%", width: "52%" },
        color: "eerie",
        spawnMs: 2000,
        closeMs: 3800,
      },
      {
        id: 7,
        title: "DISPLAY_CAPTURE.sys",
        lines: [
          "ENCRYPTING VIDEO LINK...",
          "BITRATE: 60FPS UNCOMPRESSED",
        ],
        style: { top: "62%", right: "4%", width: "56%" },
        color: "blood",
        spawnMs: 2400,
        closeMs: 3900,
      },
      {
        id: 8,
        title: "SYSTEM_OVERRIDE_PANIC.sh",
        lines: [
          "ERR: SCREEN ACCESS COMPROMISED",
          "WORKER DEVICE LINK: 100% COMPLETE",
        ],
        style: { top: "74%", left: "6%", width: "88%" },
        color: "blood",
        spawnMs: 2700,
        closeMs: 4000,
      },
    ],
    []
  );

  useEffect(() => {
    const sound = SoundEngine.getInstance();
    try {
      sound.playStaticNoise();
      sound.playTerminalHacking();
      sound.playDataStream();
    } catch {}

    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      setElapsed(diff);
    }, 50);

    // At 3.2s: "when the worker connects to the customer's phone"
    const connectTimer = setTimeout(() => {
      setConnected(true);
      try {
        sound.playBreachEstablished();
      } catch {}
    }, 3200);

    // After 5 seconds, close
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(connectTimer);
      clearTimeout(dismissTimer);
    };
  }, [durationMs, onDismiss]);

  const timeLeftSec = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center select-none font-mono text-bone overflow-hidden ${
        elapsed > 400 && elapsed < 800 ? "hack-shake" : ""
      }`}
      style={{
        backgroundColor: connected ? "rgba(5, 5, 5, 0.88)" : "rgba(0, 0, 0, 0.94)",
      }}
    >
      {/* Background CRT scanlines & chromatic aberration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
          backgroundSize: "100% 3px",
        }}
      />
      <div className="absolute inset-0 vhs-glitch opacity-70 pointer-events-none z-10" />

      {/* Screen Crack Flash at 400ms */}
      {elapsed >= 400 && elapsed <= 900 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle at center, rgba(255,255,255,0.7) 0%, transparent 60%)",
            animation: "fade-in 0.1s ease-out",
          }}
        />
      )}

      {/* ================= LOTS OF TERMINAL WINDOWS APPEARING & DISAPPEARING ================= */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        {windows.map((win) => {
          // Window is visible if elapsed >= spawnMs AND elapsed < closeMs
          const isSpawned = elapsed >= win.spawnMs;
          const isClosing = elapsed >= win.closeMs;

          if (!isSpawned) return null;

          return (
            <div
              key={win.id}
              className={`absolute transition-all duration-300 pointer-events-auto ${
                isClosing
                  ? "scale-0 opacity-0 -translate-y-4"
                  : "animate-zoom-in scale-100 opacity-100"
              }`}
              style={win.style}
            >
              <div
                className={`bg-void/95 rounded-lg border-2 shadow-2xl overflow-hidden ${
                  win.color === "blood"
                    ? "border-blood shadow-[0_0_30px_rgba(255,0,0,0.5)]"
                    : win.color === "eerie"
                    ? "border-eerie/60 shadow-[0_0_30px_rgba(0,255,65,0.3)]"
                    : "border-amber-glow/60 shadow-[0_0_30px_rgba(255,150,0,0.3)]"
                }`}
              >
                {/* Window Header */}
                <div
                  className={`px-2 py-1 flex items-center justify-between text-[10px] font-bold ${
                    win.color === "blood"
                      ? "bg-blood text-bone"
                      : win.color === "eerie"
                      ? "bg-eerie/25 text-eerie border-b border-eerie/30"
                      : "bg-amber-glow/25 text-amber-glow border-b border-amber-glow/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Terminal className="w-3 h-3 shrink-0" />
                    <span className="truncate">{win.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <div className="w-2 h-2 rounded-full bg-black/60" />
                    <div className="w-2 h-2 rounded-full bg-black/60" />
                  </div>
                </div>

                {/* Window Content */}
                <div className="p-2 space-y-1 bg-black/95 text-[10px] font-mono leading-tight">
                  {win.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`truncate ${
                        win.color === "blood"
                          ? "text-blood-bright"
                          : win.color === "eerie"
                          ? "text-eerie"
                          : "text-amber-glow"
                      }`}
                    >
                      <span className="opacity-60">&gt; </span>
                      <span>{line}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 text-[9px] text-bone/50 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                    <span>STATUS: INJECTING...</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= WORKER CONNECTED BANNER (WHEN WINDOWS DISAPPEAR) ================= */}
      {connected && (
        <div className="relative z-40 max-w-sm w-full mx-4 animate-zoom-in text-center space-y-3">
          {/* Pulsing red badge */}
          <div className="mx-auto w-16 h-16 rounded-full bg-blood/20 border-2 border-blood flex items-center justify-center breach-pulse">
            <Eye className="w-8 h-8 text-blood-bright animate-pulse" />
          </div>

          <div className="bg-void/90 border-2 border-blood rounded-2xl p-4 shadow-[0_0_50px_rgba(255,0,0,0.7)] space-y-2">
            <div className="flex items-center justify-center gap-2 text-blood-bright font-black text-sm md:text-base glitch-text">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>WORKER CONNECTED TO YOUR PHONE</span>
            </div>

            <p className="text-xs text-bone/80 leading-relaxed">
              Your device screen is being live-streamed to the worker's POS counter.
            </p>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-safe">
              <span className="w-2.5 h-2.5 rounded-full bg-safe animate-ping" />
              <span>MIRROR ACTIVE ({timeLeftSec}s REMAINING)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
