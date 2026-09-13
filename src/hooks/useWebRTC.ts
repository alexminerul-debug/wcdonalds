import { useState, useEffect, useCallback, useRef } from 'react';
import type { PartySocket } from 'partysocket';
import { ServerMessage } from '@/shared/types';
import { BroadcasterStreamer } from '@/lib/webrtc/broadcaster';
import { HybridStreamManager, StreamMode } from '@/lib/webrtc/hybridStream';

export function useWebRTC(
  role: 'broadcaster' | 'viewer',
  socket: PartySocket | null,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [connectionMode, setConnectionMode] = useState<StreamMode>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const streamerRef = useRef<BroadcasterStreamer | null>(null);
  const managerRef = useRef<HybridStreamManager | null>(null);

  const startBroadcasting = useCallback(async (): Promise<MediaStream | null> => {
    if (!socket || !videoRef.current) return null;

    try {
      if (!streamerRef.current) {
        streamerRef.current = new BroadcasterStreamer(socket);
      }
      await streamerRef.current.startCamera(videoRef.current);
      setConnectionMode('webrtc');
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
    if (!socket || !videoRef.current || !canvasRef.current) return;

    if (managerRef.current) {
      managerRef.current.stop();
    }

    const viewerId = socket.id || `viewer-${Math.random().toString(36).substring(2, 9)}`;
    const manager = new HybridStreamManager(
      socket,
      videoRef.current,
      canvasRef.current,
      viewerId
    );

    manager.onModeChange = (mode) => {
      setConnectionMode(mode);
      setIsConnected(mode !== 'disconnected');
    };

    manager.start();
    managerRef.current = manager;
  }, [socket, videoRef, canvasRef]);

  // Handle fallback base64 frames if sent as cctv-frame
  useEffect(() => {
    if (!socket || role !== 'viewer' || !canvasRef.current) return;

    const handleFrameMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === 'cctv-frame' && msg.frame && canvasRef.current) {
            setConnectionMode('canvas');
            setIsConnected(true);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
              if (canvas.width !== img.width || canvas.height !== img.height) {
                canvas.width = img.width;
                canvas.height = img.height;
              }
              ctx?.drawImage(img, 0, 0);
            };
            img.src = msg.frame;
          }
        }
      } catch (e) {
        // Non-JSON or binary is handled by CanvasSnapshotViewer
      }
    };

    socket.addEventListener('message', handleFrameMessage);
    return () => socket.removeEventListener('message', handleFrameMessage);
  }, [socket, role, canvasRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
        managerRef.current = null;
      }
      if (streamerRef.current) {
        streamerRef.current.stop();
        streamerRef.current = null;
      }
      setConnectionMode('disconnected');
      setIsConnected(false);
    };
  }, []);

  return { connectionMode, isConnected, startBroadcasting, startViewing };
}
