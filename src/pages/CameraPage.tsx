import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameState } from "@/hooks/useGameState";
import { SecurityHUD } from "@/components/camera/SecurityHUD";
import { SnapshotEngine } from "@/components/camera/SnapshotEngine";

export default function CameraPage() {
  const { code } = useParams<{ code: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  const { socket, sendMessage, connectionStatus } = useGameSocket(code || "");
  const { gameState } = useGameState(socket);

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

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError(
          "Camera access denied. Please allow camera permissions and reload."
        );
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Notify server that camera is ready
  useEffect(() => {
    if (cameraReady && socket) {
      sendMessage({ type: "claim-role", role: "camera" });
    }
  }, [cameraReady, socket, sendMessage]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-blood-bright text-xl mb-4">⚠ Camera Error</div>
          <p className="text-fog text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Security HUD Overlay */}
      <SecurityHUD
        cameraReady={cameraReady}
        fps={fps}
        connectionStatus={connectionStatus}
        currentCustomer={
          gameState?.currentTurn?.playerName || null
        }
        roomCode={code || ""}
      />

      {/* Snapshot Engine (invisible — captures frames and sends to server) */}
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

      {/* Scanline overlay for authentic CCTV look */}
      <div className="absolute inset-0 pointer-events-none bg-repeating-linear-gradient opacity-10"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
