import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameState } from "@/hooks/useGameState";
import { SecurityHUD } from "@/components/camera/SecurityHUD";
import { SnapshotEngine } from "@/components/camera/SnapshotEngine";
import { BroadcasterStreamer } from "@/lib/webrtc/broadcaster";
import { CanvasSnapshotBroadcaster } from "@/lib/webrtc/fallback";
import { Camera, ArrowLeft, RefreshCw, AlertTriangle, SwitchCamera } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { LeaveRoomButton } from "@/components/common/LeaveRoomButton";

export default function CameraPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const { socket, sendMessage, connectionStatus } = useGameSocket(code || "");
  const { gameState } = useGameState(socket);

  const streamRef = useRef<MediaStream | null>(null);
  const streamerRef = useRef<BroadcasterStreamer | null>(null);
  const fallbackBroadcasterRef = useRef<CanvasSnapshotBroadcaster | null>(null);
  const wakeLockRef = useRef<any>(null);

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

  // Request Screen Wake Lock so phone doesn't sleep or freeze stream
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch {
      // Wake Lock may fail on low battery or unsupported browser
    }
  };

  // Request camera function with progressive fallback
  const startCamera = async (targetFacing: "environment" | "user" = facingMode) => {
    setRequestingCamera(true);
    setError(null);

    // Release existing stream tracks if switching camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

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

    const constraintOptions: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: { facingMode: targetFacing },
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
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Autoplay deferred until touch:", playErr);
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
        }

        setCameraReady(true);
        requestWakeLock();

        // Setup broadcasters if socket is ready
        setupBroadcasters(stream);
      }
    } catch (err) {
      console.error("Camera setup error:", err);
      setError("Failed to initialize video stream.");
    } finally {
      setRequestingCamera(false);
    }
  };

  const setupBroadcasters = (stream: MediaStream) => {
    if (!socket || !videoRef.current) return;

    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (fallbackBroadcasterRef.current) {
      fallbackBroadcasterRef.current.stop();
      fallbackBroadcasterRef.current = null;
    }

    // Start WebRTC broadcaster
    try {
      const streamer = new BroadcasterStreamer(socket);
      // @ts-ignore
      streamer.stream = stream;
      streamerRef.current = streamer;
    } catch {}

    // Start Canvas Fallback broadcaster (8 FPS with backpressure check)
    try {
      const fallback = new CanvasSnapshotBroadcaster(videoRef.current, socket, 8);
      fallback.start();
      fallbackBroadcasterRef.current = fallback;
    } catch {}

    // Announce camera ready to worker
    sendMessage({ type: "camera-ready" });
  };

  // Flip camera between front & back
  const handleFlipCamera = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  // Auto-attempt camera on mount
  useEffect(() => {
    startCamera().catch(() => {});

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (streamerRef.current) {
        streamerRef.current.stop();
      }
      if (fallbackBroadcasterRef.current) {
        fallbackBroadcasterRef.current.stop();
      }
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, []);

  // Update socket connections on broadcaster when socket changes WITHOUT killing media stream
  useEffect(() => {
    if (socket && streamRef.current && cameraReady) {
      setupBroadcasters(streamRef.current);
    }
  }, [socket, connectionStatus, cameraReady]);

  // Join room and claim camera role on socket
  useEffect(() => {
    if (socket && connectionStatus === "connected") {
      sendMessage({ type: "join-room", name: "CCTV Camera" });
      sendMessage({ type: "claim-role", role: "camera" });
    }
  }, [socket, connectionStatus, sendMessage]);

  // Send snapshots for AI analysis (throttled to 3.0s)
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
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <LanguageSelector />
          <LeaveRoomButton roomCode={code} />
        </div>

        {cameraReady && (
          <button
            type="button"
            onClick={handleFlipCamera}
            className="pointer-events-auto px-2.5 py-1 text-xs font-mono rounded bg-void/80 border border-smoke/40 text-bone hover:border-amber-glow hover:text-amber-glow transition-colors flex items-center gap-1.5"
            title={t("flipCamera")}
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("flipCamera")}</span>
          </button>
        )}
      </div>

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

      {/* Snapshot Engine for AI (runs every 3.0s) */}
      {cameraReady && videoRef.current && (
        <SnapshotEngine
          videoElement={videoRef.current}
          onSnapshot={handleSnapshot}
          intervalMs={3000}
          targetWidth={480}
          targetHeight={360}
          quality={0.65}
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
                {t("cctvSecurityFeed")}
              </h1>
              <p className="text-xs text-fog mt-2">
                {t("allowCameraNotice")}
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
                onClick={() => startCamera(facingMode)}
                disabled={requestingCamera}
                className="w-full py-4 bg-amber-glow/20 border-2 border-amber-glow text-amber-glow
                           text-base uppercase tracking-widest font-bold cursor-pointer
                           hover:bg-amber-glow/30 transition-all flex items-center justify-center gap-2
                           disabled:opacity-40"
              >
                {requestingCamera ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("connecting")}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>{t("startCameraBtn")}</span>
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
