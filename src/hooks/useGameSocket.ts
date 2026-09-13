import { useState, useCallback, useEffect, useRef } from 'react';
import usePartySocket from 'partysocket/react';
import { getPartyKitHost } from '@/shared/constants';
import { ClientMessage } from '@/shared/types';
import type { PartySocket } from 'partysocket';

import { safeStorage } from '@/lib/storage';

export function getPersistentPlayerId(): string {
  let id = safeStorage.getSession('wcd_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36).slice(-4);
    safeStorage.setSession('wcd_player_id', id);
  }
  return id;
}

export function useGameSocket(roomCode: string) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const queueRef = useRef<ClientMessage[]>([]);

  const host = getPartyKitHost();
  const playerId = getPersistentPlayerId();

  const socket = usePartySocket({
    host,
    room: roomCode,
    id: playerId,
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
