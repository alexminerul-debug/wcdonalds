import { useEffect, useRef } from "react";

interface SnapshotEngineProps {
  videoElement: HTMLVideoElement;
  onSnapshot: (dataUrl: string) => void;
  intervalMs: number;
  targetWidth: number;
  targetHeight: number;
  quality: number;
  active: boolean;
}

export function SnapshotEngine({
  videoElement,
  onSnapshot,
  intervalMs,
  targetWidth,
  targetHeight,
  quality,
  active,
}: SnapshotEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Create offscreen canvas for snapshot capture
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = targetWidth;
      canvasRef.current.height = targetHeight;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const captureFrame = () => {
      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      // Draw video frame to downscaled canvas
      ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);

      // Convert to JPEG data URL
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      onSnapshot(dataUrl);
    };

    intervalRef.current = window.setInterval(captureFrame, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, videoElement, onSnapshot, intervalMs, targetWidth, targetHeight, quality]);

  // This component renders nothing — it's purely side-effect driven
  return null;
}
