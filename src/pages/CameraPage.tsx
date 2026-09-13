import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameState } from "@/hooks/useGameState";
import { SecurityHUD } from "@/components/camera/SecurityHUD";
import { SnapshotEngine } from "@/components/camera/SnapshotEngine";
import { BroadcasterStreamer } from "@/lib/webrtc/broadcaster";
import { CanvasSnapshotBroadcaster } from "@/lib/webrtc/fallback";
import { Camera, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

export default function CameraPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  const { socket, sendMessage, connectionStatus } = useGameSocket(code || "");
  const { gameState } = useGameState(socket);

  const streamerRef = useRef<BroadcasterStreamer | null>(null);
  const fallbackBroadcasterRef = useRef<CanvasSnapshotBroadcaster | null>(null);

  // Frame counting for FPS display
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  const updateFps = useCallback(() => {
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
  }, []);

  // Request camera function with progressive fallback
  const startCamera = async () => {
    if (cameraReady) return;
    setRequestingCamera(true);
    setError(null);

    // Check secure context
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setError(
        "Mobile browsers require HTTPS to grant camera access. Please access via your Cloudflare Pages URL (https://...)."
      );
      setRequestingCamera(false);
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported on this browser or context.");
      setRequestingCamera(false);
      return;
    }

    let stream: MediaStream | null = null;

    // Constraint attempt list: progressive degradation
    const constraintOptions: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: { facingMode: "environment" },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    for (const constraints of constraintOptions) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err: any) {
        console.warn("Failed constraints attempt:", constraints, err);
        // If user explicitly denied, don't keep looping
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Camera permission denied. Please allow camera access in browser settings.");
          setRequestingCamera(false);
          return;
        }
      }
    }

    if (!stream) {
      setError("Could not activate camera with available hardware. Try another camera/browser.");
      setRequestingCamera(false);
      return;
    }

    try {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        setCameraReady(true);

        // Start WebRTC broadcaster
        if (socket) {
          const streamer = new BroadcasterStreamer(socket);
          // @ts-ignore
          streamer.stream = stream;
          streamerRef.current = streamer;

          // Start Canvas Fallback broadcaster (10 FPS)
          const fallback = new CanvasSnapshotBroadcaster(videoRef.current, socket, 10);
          fallback.start();
          fallbackBroadcasterRef.current = fallback;
        }
      }
    } catch (playErr) {
      console.error("Video playback error:", playErr);
      setError("Failed to stream video to screen.");
    } finally {
      setRequestingCamera(false);
    }
  };

  // Auto-attempt camera once on mount
  useEffect(() => {
    startCamera().catch(() => {});

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
      if (streamerRef.current) {
        streamerRef.current.stop();
      }
      if (fallbackBroadcasterRef.current) {
        fallbackBroadcasterRef.current.stop();
      }
    };
  }, [socket]);

  // Claim camera role on socket
  useEffect(() => {
    if (socket) {
      sendMessage({ type: "claim-role", role: "camera" });
    }
  }, [socket, sendMessage]);

  // Send snapshots for AI analysis
  const handleSnapshot = useCallback(
    (dataUrl: string) => {
      if (socket && gameState?.phase === "playing") {
        sendMessage({ type: "camera-snapshot", dataUrl });
      }
      updateFps();
    },
    [socket, gameState?.phase, sendMessage, updateFps]
  );

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none font-mono">
      {/* Camera Video Stream */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover ${
          cameraReady ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        playsInline
        muted
        autoPlay
      />

      {/* Security HUD Overlay */}
      {cameraReady && (
        <SecurityHUD
          cameraReady={cameraReady}
          fps={fps}
          connectionStatus={connectionStatus}
          currentCustomer={gameState?.currentTurn?.playerName || null}
          roomCode={code || ""}
        />
      )}

      {/* Snapshot Engine for AI (runs every 2.8s) */}
      {cameraReady && videoRef.current && (
        <SnapshotEngine
          videoElement={videoRef.current}
          onSnapshot={handleSnapshot}
          intervalMs={2800}
          targetWidth={512}
          targetHeight={512}
          quality={0.7}
          active={gameState?.phase === "playing"}
        />
      )}

      {/* Pre-activation / User gesture prompt screen for mobile */}
      {!cameraReady && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full p-6 text-center bg-abyss">
          <div className="max-w-md w-full p-8 border border-fog/30 bg-void space-y-6">
            <div className="relative">
              <Camera className="w-16 h-16 mx-auto text-amber-glow animate-pulse" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-bone uppercase tracking-widest">
                CCTV CAMERA SENSOR
              </h1>
              <p className="text-xs text-fog mt-2">
                Mount this device facing the fast-food counter.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-blood/10 border border-blood text-blood-bright text-xs text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={requestingCamera}
                className="w-full py-4 bg-amber-glow/20 border-2 border-amber-glow text-amber-glow
                           text-base uppercase tracking-widest font-bold cursor-pointer
                           hover:bg-amber-glow/30 transition-all flex items-center justify-center gap-2
                           disabled:opacity-40"
              >
                {requestingCamera ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Requesting Access...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>ACTIVATE CCTV CAMERA</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/room/${code}`)}
                className="w-full py-2.5 text-xs text-fog hover:text-bone border border-fog/20 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Lobby</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanline CRT overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
        }}
      />
    </div>
  );
}
