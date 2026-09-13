import { useState, useEffect, useCallback, useRef } from 'react';
import type { PartySocket } from 'partysocket';
import { CanvasSnapshotViewer, CanvasSnapshotBroadcaster } from '@/lib/webrtc/fallback';

export type StreamMode = 'webrtc' | 'canvas' | 'disconnected';

export function useWebRTC(
  role: 'broadcaster' | 'viewer',
  socket: PartySocket | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [connectionMode, setConnectionMode] = useState<StreamMode>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const broadcasterRef = useRef<CanvasSnapshotBroadcaster | null>(null);
  const viewerRef = useRef<CanvasSnapshotViewer | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);

  const resetWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
    }
    watchdogTimerRef.current = window.setTimeout(() => {
      setConnectionMode('disconnected');
      setIsConnected(false);
    }, 4500);
  }, []);

  const startBroadcasting = useCallback(async (): Promise<MediaStream | null> => {
    if (!socket || !videoRef.current) return null;

    try {
      if (!broadcasterRef.current) {
        const broadcaster = new CanvasSnapshotBroadcaster(videoRef.current, socket, 8);
        broadcaster.start();
        broadcasterRef.current = broadcaster;
      } else {
        broadcasterRef.current.updateSocket(socket);
      }
      setConnectionMode('canvas');
      setIsConnected(true);
      return videoRef.current.srcObject as MediaStream;
    } catch (err) {
      console.error('Failed to start broadcaster:', err);
      setConnectionMode('disconnected');
      setIsConnected(false);
      throw err;
    }
  }, [socket, videoRef]);

  const startViewing = useCallback(() => {
    if (!socket || !canvasRef.current) return;

    if (viewerRef.current) {
      viewerRef.current.updateSocket(socket);
      return;
    }

    const viewer = new CanvasSnapshotViewer(canvasRef.current, socket);
    viewer.onFrameReceived = () => {
      setConnectionMode('canvas');
      setIsConnected(true);
      resetWatchdog();
    };

    viewerRef.current = viewer;
  }, [socket, canvasRef, resetWatchdog]);

  // Update socket on viewer if socket instance changes
  useEffect(() => {
    if (socket && viewerRef.current) {
      viewerRef.current.updateSocket(socket);
    }
    if (socket && broadcasterRef.current) {
      broadcasterRef.current.updateSocket(socket);
    }
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      if (broadcasterRef.current) {
        broadcasterRef.current.stop();
        broadcasterRef.current = null;
      }
      setConnectionMode('disconnected');
      setIsConnected(false);
    };
  }, []);

  return { connectionMode, isConnected, startBroadcasting, startViewing };
}
