import { useState, useEffect } from "react";

interface SecurityHUDProps {
  cameraReady: boolean;
  fps: number;
  connectionStatus: string;
  currentCustomer: string | null;
  roomCode: string;
}

export function SecurityHUD({
  cameraReady,
  fps,
  connectionStatus,
  currentCustomer,
  roomCode,
}: SecurityHUDProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timestamp = time.toLocaleTimeString("en-US", { hour12: false });
  const datestamp = time.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-mono text-xs">
      {/* Top-left: REC indicator + Camera ID */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="rec-blink text-blood-bright text-lg font-bold">●</span>
          <span className="text-white/80 text-sm font-bold tracking-wider">REC</span>
        </div>
        <div className="text-white/50 tracking-wider mt-1">
          CAM-01: COUNTER DRIVE-THRU
        </div>
        <div className="text-white/30 tracking-wider">
          ROOM: {roomCode}
        </div>
      </div>

      {/* Top-right: Timestamp */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-white/70 text-sm tracking-widest">
          {timestamp}
        </div>
        <div className="text-white/40 tracking-wider">
          {datestamp}
        </div>
      </div>

      {/* Bottom-left: Status info */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "connecting"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <span className="text-white/50 uppercase tracking-wider">
            {connectionStatus === "connected"
              ? "LINK ACTIVE"
              : connectionStatus === "connecting"
              ? "ESTABLISHING LINK..."
              : "LINK DOWN"}
          </span>
        </div>
        {!cameraReady && (
          <div className="text-yellow-500/70 tracking-wider">
            INITIALIZING SENSOR...
          </div>
        )}
      </div>

      {/* Bottom-right: FPS + Resolution */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="text-white/40 tracking-wider">
          {fps} FPS
        </div>
        <div className="text-white/30 tracking-wider">
          512×512 JPEG
        </div>
      </div>

      {/* Center: Current customer overlay */}
      {currentCustomer && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="border border-white/20 px-6 py-1">
            <span className="text-white/40 tracking-[0.4em] text-[10px] uppercase">
              Subject: {currentCustomer}
            </span>
          </div>
        </div>
      )}

      {/* Crosshair corners */}
      <div className="absolute top-[15%] left-[15%] w-8 h-8 border-t border-l border-white/20" />
      <div className="absolute top-[15%] right-[15%] w-8 h-8 border-t border-r border-white/20" />
      <div className="absolute bottom-[15%] left-[15%] w-8 h-8 border-b border-l border-white/20" />
      <div className="absolute bottom-[15%] right-[15%] w-8 h-8 border-b border-r border-white/20" />
    </div>
  );
}
