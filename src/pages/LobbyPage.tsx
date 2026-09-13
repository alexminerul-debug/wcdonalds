import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameState } from "@/hooks/useGameState";
import type { PlayerRole } from "@/shared/types";
import {
  Monitor,
  Camera,
  Users,
  Play,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Skull,
  Shield,
  User,
  Server,
} from "lucide-react";
import { ServerSettingsModal } from "@/components/ui/ServerSettingsModal";

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);

  const { socket, sendMessage, connectionStatus } = useGameSocket(code || "");
  const {
    gameState,
    myRole,
    myId,
    isHost,
  } = useGameState(socket);

  // Navigate to role-specific page when game starts
  useEffect(() => {
    if (gameState?.phase === "playing" || gameState?.phase === "game_over") {
      if (myRole === "worker") navigate(`/room/${code}/worker`);
      else if (myRole === "camera") navigate(`/room/${code}/camera`);
      else if (myRole === "customer") navigate(`/room/${code}/customer`);
    }
  }, [gameState?.phase, myRole, code, navigate]);

  const handleJoin = () => {
    if (!playerName.trim()) return;
    sendMessage({ type: "join-room", name: playerName.trim() });
    setHasJoined(true);
  };

  const handleClaimRole = (role: PlayerRole) => {
    sendMessage({ type: "claim-role", role });
  };

  const handleStartShift = () => {
    sendMessage({ type: "start-shift" });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const customers = gameState?.players.filter((p) => p.role === "customer") || [];
  const hasWorker = !!gameState?.workerId;
  const hasCamera = !!gameState?.cameraId;
  const canStart = hasWorker && hasCamera && customers.length >= 1;

  // Name entry screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-abyss flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blood-bright glitch-text">
            WcDonald's
          </h1>
          <div className="mt-2 text-fog text-sm tracking-widest uppercase">
            Room {code}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <input
            type="text"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={20}
            autoFocus
            className="w-full bg-void border border-fog/30 text-bone text-center text-xl
                       px-6 py-4 placeholder:text-fog/40
                       focus:outline-none focus:border-amber-glow transition-all"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={!playerName.trim()}
            className="w-full bg-blood/20 border border-blood text-blood-bright
                       px-8 py-4 text-lg uppercase tracking-wider font-bold cursor-pointer
                       hover:bg-blood/40 transition-all duration-300
                       disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            Enter the Shift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss p-4 md:p-8">
      {/* Connection Status Button */}
      <button
        type="button"
        onClick={() => setServerModalOpen(true)}
        className="fixed top-3 right-3 z-50 flex items-center gap-2 text-xs bg-void/80 border border-fog/20 px-2 py-1 hover:border-amber-glow transition-all cursor-pointer"
        title="Click to configure server connection"
      >
        {connectionStatus === "connected" ? (
          <Wifi className="w-3 h-3 text-safe" />
        ) : (
          <WifiOff className="w-3 h-3 text-blood-bright" />
        )}
        <span className="text-fog uppercase">{connectionStatus}</span>
        <Server className="w-3 h-3 text-fog/50 ml-1" />
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blood-bright">WcDonald's</h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="text-2xl font-mono text-bone tracking-[0.4em]">
            {code}
          </span>
          <button
            onClick={copyCode}
            className="text-fog hover:text-amber-glow transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-safe" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-fog/60 text-xs mt-1">
          Share this code with other players
        </p>
      </div>

      {/* Role Selection */}
      <div className="max-w-md mx-auto space-y-3 mb-8">
        <h2 className="text-sm text-fog uppercase tracking-widest mb-4 text-center">
          Choose Your Role
        </h2>

        {/* Worker */}
        <button
          type="button"
          onClick={() => handleClaimRole("worker")}
          disabled={hasWorker && myRole !== "worker"}
          className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 ${
            myRole === "worker"
              ? "bg-amber-glow/15 border-amber-glow text-amber-glow cursor-pointer"
              : hasWorker
              ? "bg-void border-fog/10 text-fog/30 cursor-not-allowed"
              : "bg-void border-fog/30 text-bone hover:border-amber-glow hover:bg-amber-glow/5 cursor-pointer"
          }`}
        >
          <Monitor className="w-8 h-8 flex-shrink-0" />
          <div className="text-left flex-1">
            <div className="font-bold text-sm uppercase tracking-wider">
              Take Counter (Worker)
            </div>
            <div className="text-xs text-fog mt-1">
              Manage the register, watch CCTV, detect anomalies
            </div>
          </div>
          {hasWorker && myRole !== "worker" && (
            <Shield className="w-4 h-4 text-fog/30" />
          )}
          {myRole === "worker" && <Check className="w-5 h-5" />}
        </button>

        {/* Camera */}
        <button
          type="button"
          onClick={() => handleClaimRole("camera")}
          disabled={hasCamera && myRole !== "camera"}
          className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 ${
            myRole === "camera"
              ? "bg-eerie/15 border-eerie text-eerie cursor-pointer"
              : hasCamera
              ? "bg-void border-fog/10 text-fog/30 cursor-not-allowed"
              : "bg-void border-fog/30 text-bone hover:border-eerie hover:bg-eerie/5 cursor-pointer"
          }`}
        >
          <Camera className="w-8 h-8 flex-shrink-0" />
          <div className="text-left flex-1">
            <div className="font-bold text-sm uppercase tracking-wider">
              Mount CCTV Camera
            </div>
            <div className="text-xs text-fog mt-1">
              Dedicated device pointing at the counter
            </div>
          </div>
          {hasCamera && myRole !== "camera" && (
            <Shield className="w-4 h-4 text-fog/30" />
          )}
          {myRole === "camera" && <Check className="w-5 h-5" />}
        </button>

        {/* Customer */}
        <button
          type="button"
          onClick={() => handleClaimRole("customer")}
          className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 cursor-pointer ${
            myRole === "customer"
              ? "bg-blood/15 border-blood text-blood-bright"
              : "bg-void border-fog/30 text-bone hover:border-blood hover:bg-blood/5"
          }`}
        >
          <Users className="w-8 h-8 flex-shrink-0" />
          <div className="text-left flex-1">
            <div className="font-bold text-sm uppercase tracking-wider">
              Join Queue (Customer)
            </div>
            <div className="text-xs text-fog mt-1">
              Step up to the counter and place your order
            </div>
          </div>
          <span className="text-xs text-fog bg-ash px-2 py-1">
            {customers.length}/8
          </span>
          {myRole === "customer" && <Check className="w-5 h-5" />}
        </button>
      </div>

      {/* Player List */}
      <div className="max-w-md mx-auto mb-8">
        <h2 className="text-sm text-fog uppercase tracking-widest mb-3 text-center">
          Players ({gameState?.players.length || 0}/10)
        </h2>
        <div className="space-y-1">
          {(gameState?.players || []).map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between px-4 py-2 bg-void border border-fog/10 ${
                player.id === myId ? "border-amber-glow/30" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-fog" />
                <span className="text-sm text-bone">
                  {player.name}
                  {player.id === myId && (
                    <span className="text-fog text-xs ml-2">(you)</span>
                  )}
                  {player.isHost && (
                    <span className="text-amber-glow text-xs ml-2">★ HOST</span>
                  )}
                </span>
              </div>
              <span className="text-xs text-fog uppercase tracking-wider">
                {player.role === "unassigned" ? "—" : player.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Start Button (Host only) */}
      {isHost && (
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleStartShift}
            disabled={!canStart}
            className={`w-full flex items-center justify-center gap-3 px-8 py-5 text-xl uppercase tracking-widest font-bold
                       transition-all duration-300 active:scale-95 ${
                         canStart
                           ? "bg-blood/30 border-2 border-blood text-blood-bright hover:bg-blood/50 hover:shadow-[0_0_40px_rgba(220,20,60,0.3)] pulse-glow cursor-pointer"
                           : "bg-void border-2 border-fog/20 text-fog/30 cursor-not-allowed"
                       }`}
          >
            <Play className="w-6 h-6" />
            Start Shift
          </button>
          {!canStart && (
            <p className="text-fog/40 text-xs text-center mt-3">
              Need: 1 Worker + 1 Camera + at least 1 Customer
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-12">
        <Skull className="mx-auto w-6 h-6 text-blood/30 mb-2" />
        <p className="text-fog/20 text-xs tracking-widest uppercase">
          Waiting for shift to begin...
        </p>
      </div>

      {/* Server Settings Modal */}
      <ServerSettingsModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
      />
    </div>
  );
}
