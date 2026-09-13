import { useState, useCallback, useEffect, useRef } from 'react';
import usePartySocket from 'partysocket/react';
import { getPartyKitHost } from '@/shared/constants';
import { ClientMessage } from '@/shared/types';
import type { PartySocket } from 'partysocket';

export function useGameSocket(roomCode: string) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const queueRef = useRef<ClientMessage[]>([]);

  const host = getPartyKitHost();

  const socket = usePartySocket({
    host,
    room: roomCode,
    onOpen: () => setConnectionStatus('connected'),
    onClose: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('disconnected'),
  });

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      // Queue message to be sent as soon as socket connects
      queueRef.current.push(msg);
    }
  }, [socket]);

  // Flush queued messages upon connection
  useEffect(() => {
    if (socket && connectionStatus === 'connected' && queueRef.current.length > 0) {
      while (queueRef.current.length > 0) {
        const queued = queueRef.current.shift();
        if (queued) {
          socket.send(JSON.stringify(queued));
        }
      }
    }
  }, [socket, connectionStatus]);

  return { socket, sendMessage, connectionStatus };
}
