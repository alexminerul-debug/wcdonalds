import { useState, useCallback, useEffect } from 'react';
import usePartySocket from 'partysocket/react';
import { PARTYKIT_HOST } from '@/shared/constants';
import { ClientMessage } from '@/shared/types';
import type { PartySocket } from 'partysocket';

export function useGameSocket(roomCode: string) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomCode,
    onOpen: () => setConnectionStatus('connected'),
    onClose: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('disconnected'),
  });

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  }, [socket]);

  return { socket, sendMessage, connectionStatus };
}
