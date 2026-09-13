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
    // Generous 20-second watchdog accommodates mobile tab switches and garbage collection
    watchdogTimerRef.current = window.setTimeout(() => {
      setConnectionMode('disconnected');
      setIsConnected(false);
    }, 20000);
  }, []);

  const startBroadcasting = useCallback(async (): Promise<MediaStream | null> => {
    if (!socket || !videoRef.current) return null;

    try {
      if (!broadcasterRef.current) {
        const broadcaster = new CanvasSnapshotBroadcaster(videoRef.current, socket, 10);
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

    // If viewer already exists for this exact canvas, update socket and ping broadcaster
    if (viewerRef.current) {
      if (viewerRef.current.canvas === canvasRef.current) {
        viewerRef.current.updateSocket(socket);
        resetWatchdog();
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'viewer-join', viewerId: socket.id }));
          }
        } catch {}
        return;
      } else {
        // Canvas element changed (e.g. tab switched) - recreate viewer
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    }

    const viewer = new CanvasSnapshotViewer(canvasRef.current, socket);
    viewer.onFrameReceived = () => {
      setConnectionMode('canvas');
      setIsConnected(true);
      resetWatchdog();
    };

    viewerRef.current = viewer;

    setConnectionMode('canvas');
    resetWatchdog();

    // Notify room that a viewer joined so camera can emit a frame immediately
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'viewer-join', viewerId: socket.id }));
      }
    } catch {}
  }, [socket, canvasRef, resetWatchdog]);

  // Auto-initialize viewer as soon as socket and canvas are present
  useEffect(() => {
    if (role === 'viewer' && socket && canvasRef.current) {
      startViewing();
    }
  }, [role, socket, canvasRef.current, startViewing]);

  // Active Auto-Recovery Loop: keeps stream alive and auto-recovers from packet loss or tab switches
  useEffect(() => {
    if (role !== 'viewer' || !socket) return;

    const recoveryInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'viewer-join', viewerId: socket.id }));
        } catch {}
      }
    }, 3500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startViewing();
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ type: 'viewer-join', viewerId: socket.id }));
          } catch {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(recoveryInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [role, socket, startViewing]);

  // Update socket on viewer / broadcaster if socket instance changes
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
