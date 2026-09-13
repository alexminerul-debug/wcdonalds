import React, { useState, useEffect } from "react";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { AlertCircle, CheckCircle2, XCircle, ShieldAlert, Cpu } from "lucide-react";
import { HorrorButton } from "@/components/ui/HorrorButton";

interface WorkerPuzzleModalProps {
  onSuccess: () => void;
  onFail: () => void;
}

export function WorkerPuzzleModal({ onSuccess, onFail }: WorkerPuzzleModalProps) {
  // Puzzle type: Wire alignment or quick code matching
  const [targetCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [userInput, setUserInput] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(7);
  const [resolved, setResolved] = useState<"success" | "fail" | null>(null);

  useEffect(() => {
    try {
      SoundEngine.getInstance().playAlarm();
    } catch {}

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleFail = () => {
    if (resolved) return;
    setResolved("fail");
    try {
      SoundEngine.getInstance().playPuzzleFail();
    } catch {}
    setTimeout(() => {
      onFail();
    }, 900);
  };

  const handleCheck = (val: string) => {
    const next = userInput + val;
    setUserInput(next);
    if (next === targetCode) {
      setResolved("success");
      try {
        SoundEngine.getInstance().playPuzzleSuccess();
      } catch {}
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else if (next.length >= targetCode.length) {
      handleFail();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-mono text-bone animate-fade-in">
      <div className="max-w-sm w-full bg-abyss border-2 border-blood rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="bg-blood text-black font-bold text-xs p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span>EMERGENCY OVERRIDE EVENT!</span>
          </div>
          <span className="bg-black text-blood-bright px-2 py-0.5 rounded font-bold animate-pulse">
            {secondsLeft}s
          </span>
        </div>

        <div className="p-4 space-y-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-fog uppercase">SYSTEM OVERLOAD IN PROGRESS</div>
            <p className="text-xs text-bone font-semibold">
              Enter security override code before time expires to preserve your life!
            </p>
          </div>

          {/* Target Code Display */}
          <div className="bg-black p-3 rounded border border-smoke/30 flex flex-col items-center justify-center">
            <span className="text-[10px] text-ash uppercase tracking-wider mb-1">SECURITY KEY:</span>
            <span className="text-3xl font-bold tracking-widest text-amber-glow">
              {targetCode}
            </span>
          </div>

          {/* User Code Input */}
          <div className="h-9 flex items-center justify-center border-b-2 border-smoke/50 text-2xl font-bold tracking-widest text-safe">
            {userInput || "____"}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9"].map((num) => (
              <button
                key={num}
                type="button"
                disabled={resolved !== null}
                onClick={() => handleCheck(num)}
                className="py-2.5 bg-void border border-smoke/30 rounded text-base font-bold text-bone hover:border-amber-glow hover:bg-smoke/10 active:scale-95 transition-all"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={resolved !== null}
              onClick={() => setUserInput("")}
              className="py-2.5 bg-void border border-smoke/30 rounded text-xs font-bold text-ash hover:text-bone"
            >
              CLEAR
            </button>
            <button
              type="button"
              disabled={resolved !== null}
              onClick={() => handleCheck("0")}
              className="py-2.5 bg-void border border-smoke/30 rounded text-base font-bold text-bone hover:border-amber-glow"
            >
              0
            </button>
            <button
              type="button"
              disabled={resolved !== null}
              onClick={handleFail}
              className="py-2.5 bg-void border border-blood/40 rounded text-[10px] font-bold text-blood-bright"
            >
              ABORT
            </button>
          </div>

          {resolved === "success" && (
            <div className="flex items-center justify-center gap-2 text-safe text-sm font-bold animate-pulse">
              <CheckCircle2 className="w-5 h-5" />
              <span>LIFE PRESERVED // SYSTEM STABILIZED</span>
            </div>
          )}

          {resolved === "fail" && (
            <div className="flex items-center justify-center gap-2 text-blood-bright text-sm font-bold animate-pulse">
              <XCircle className="w-5 h-5" />
              <span>OVERRIDE FAILED // LIFE LOST</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
