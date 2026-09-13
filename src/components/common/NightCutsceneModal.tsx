import React, { useEffect, useState } from "react";
import { Moon, Skull, Play } from "lucide-react";
import { GlitchText } from "../ui/GlitchText";

interface NightCutsceneModalProps {
  nightNumber: number;
  isBloodMoon?: boolean;
  onDismiss: () => void;
}

export function NightCutsceneModal({
  nightNumber,
  isBloodMoon = false,
  onDismiss,
}: NightCutsceneModalProps) {
  const [clockTime, setClockTime] = useState("11:59 PM");

  useEffect(() => {
    // 1. Clock ticks from 11:59 PM to 12:00 AM
    const clockTimer = setTimeout(() => {
      setClockTime("12:00 AM");
    }, 1100);

    // 2. Auto dismiss after 6s if not clicked
    const autoDismissTimer = setTimeout(() => {
      onDismiss();
    }, 6000);

    return () => {
      clearTimeout(clockTimer);
      clearTimeout(autoDismissTimer);
    };
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/95 select-none font-mono text-bone overflow-hidden backdrop-blur-md animate-fade-in">
      {/* Scanline CRT overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Red ambient pulse for Blood Moon */}
      {isBloodMoon && (
        <div className="absolute inset-0 bg-blood/20 mix-blend-color-burn pointer-events-none animate-pulse" />
      )}

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 px-4">
        {/* Animated Moon / Symbol */}
        <div className="flex justify-center">
          {isBloodMoon ? (
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-blood border-4 border-blood-bright flex items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.8)] animate-pulse">
                <Skull className="w-12 h-12 text-black animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 bg-blood-bright text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-ping">
                30% EVENT
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-amber-glow/60 flex items-center justify-center bg-amber-glow/10 shadow-[0_0_30px_rgba(255,176,0,0.3)]">
              <Moon className="w-10 h-10 text-amber-glow animate-pulse" />
            </div>
          )}
        </div>

        {/* Digital Clock */}
        <div className="bg-void/80 border border-smoke/30 py-2 px-6 rounded-lg inline-block shadow-inner">
          <span
            className={`text-2xl sm:text-3xl font-bold tracking-widest ${
              clockTime === "12:00 AM"
                ? isBloodMoon
                  ? "text-blood-bright animate-pulse"
                  : "text-amber-glow animate-pulse"
                : "text-fog"
            }`}
          >
            {clockTime}
          </span>
        </div>

        {/* Night Title */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-ash">
            WCDONALDS NIGHT SHIFT // EMPLOYEE LOG
          </div>
          {isBloodMoon ? (
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blood-bright tracking-tight glitch-text">
                <GlitchText text="RED NIGHT MOON" intensity="high" />
              </h1>
              <p className="text-sm font-bold text-blood animate-pulse uppercase tracking-wider">
                [BLOOD MOON RISES - 2X CUSTOMERS & HARDER ANOMALIES]
              </p>
            </div>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-bold text-bone tracking-wide">
              NIGHT {nightNumber}
            </h1>
          )}
        </div>

        {/* Lore / Briefing */}
        <div className="text-xs sm:text-sm text-fog font-mono bg-void/60 p-4 rounded border border-smoke/20 max-w-md mx-auto leading-relaxed">
          {isBloodMoon ? (
            <p className="text-bone">
              <span className="text-blood-bright font-bold">WARNING: </span>
              Atmospheric distortion critical. Double customer traffic arriving.
              Anomalies are exhibiting deceptive, subtle behaviors. Observe CCTV closely!
            </p>
          ) : (
            <p>
              Check the monitor for unusual customer behavior. Match their spoken order, verify cash payment, and report anomalies before 6:00 AM.
            </p>
          )}
        </div>

        {/* Ready Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className={`px-8 py-3 rounded font-mono font-bold text-sm tracking-wider uppercase flex items-center gap-2 mx-auto transition-all shadow-lg active:scale-95 ${
              isBloodMoon
                ? "bg-blood hover:bg-blood-bright text-black border border-blood-bright shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                : "bg-amber-glow hover:bg-amber-glow/90 text-black border border-amber-glow"
            }`}
          >
            <span>CLOCK IN // BEGIN SHIFT</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
