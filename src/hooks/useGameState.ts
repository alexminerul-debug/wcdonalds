import { useState, useEffect } from 'react';
import type { PartySocket } from 'partysocket';
import {
  GameRoomState,
  PlayerRole,
  TurnState,
  WorkerState,
  SecretRole,
  MenuItem,
  AnomalyTrait,
  TurnResult,
  CartItem,
  ServerMessage
} from '@/shared/types';

export function useGameState(socket: PartySocket | null) {
  const [gameState, setGameState] = useState<GameRoomState | null>(null);
  const [myRole, setMyRole] = useState<PlayerRole>('unassigned');
  const [myId, setMyId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<TurnState | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>({
    cart: [], balance: 0, lives: 3, abilities: [], totalServed: 0, totalCaught: 0
  });
  const [secretRole, setSecretRole] = useState<SecretRole | null>(null);
  const [secretOrder, setSecretOrder] = useState<MenuItem[] | null>(null);
  const [secretTraits, setSecretTraits] = useState<AnomalyTrait[] | null>(null);
  const [detectedTraits, setDetectedTraits] = useState<string[]>([]);
  const [paymentRequest, setPaymentRequest] = useState<{ total: number; items: CartItem[] } | null>(null);
  const [lastResult, setLastResult] = useState<TurnResult | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cctvGlitch, setCctvGlitch] = useState<{ effect: "static" | "blackout" | "distortion"; isAnomaly: boolean } | null>(null);

  useEffect(() => {
    if (socket) {
      setMyId(socket.id || '');
    }
  }, [socket]);

  useEffect(() => {
    if (currentTurn && myId) {
      setIsMyTurn(currentTurn.playerId === myId);
    } else {
      setIsMyTurn(false);
    }
  }, [currentTurn, myId]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        
        switch (msg.type) {
          case 'welcome':
            if (msg.connectionId) {
              setMyId(msg.connectionId);
            }
            break;

          case 'room-state':
            setGameState(msg.state);
            setWorkerState(msg.state.workerState);
            if (msg.state.workerState?.cart) {
              setCartItems(msg.state.workerState.cart);
            }
            setCurrentTurn(msg.state.currentTurn);
            const myConnId = msg.selfId || myId || socket.id;
            if (msg.selfId) {
              setMyId(msg.selfId);
            }
            const me = msg.state.players.find(p => p.id === myConnId || p.id === socket.id);
            if (me) {
              setMyRole(me.role);
              setIsHost(me.isHost);
            }
            break;

          case 'role-assigned':
            if (msg.playerId === myId || msg.playerId === socket.id) {
              setMyRole(msg.role);
            }
            break;
            
          case 'secret-role':
            setSecretRole(msg.secretRole);
            setSecretOrder(msg.order);
            setSecretTraits(msg.traits);
            break;
            
          case 'turn-start':
            setCurrentTurn(msg.turn);
            setDetectedTraits([]);
            setPaymentRequest(null);
            setLastResult(null);
            break;
            
          case 'trait-detected':
            setDetectedTraits(msg.allDetected);
            break;
            
          case 'payment-request':
            setPaymentRequest({ total: msg.total, items: msg.items });
            break;
            
          case 'payment-received':
            setPaymentRequest(null);
            break;
            
          case 'serve-result':
          case 'report-result':
            setPaymentRequest(null);
            setLastResult(msg.result);
            break;
            
          case 'cart-updated':
            setCartItems(msg.cart);
            if (gameState) {
              setWorkerState(prev => ({ ...prev, cart: msg.cart }));
            }
            break;
            
          case 'cctv-glitch':
            setCctvGlitch({ effect: msg.effect as "static" | "blackout" | "distortion", isAnomaly: msg.isAnomaly });
            setTimeout(() => {
              setCctvGlitch(null);
            }, 3000);
            break;
            
          case 'game-over':
            setWorkerState(msg.workerState);
            if (gameState) {
              setGameState(prev => prev ? { ...prev, phase: 'game_over', roundResults: msg.results } : null);
            }
            break;
        }
      } catch (err) {
        console.error('Error parsing game state message:', err);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, gameState]);

  return {
    gameState,
    myRole,
    myId,
    isHost,
    isMyTurn,
    currentTurn,
    workerState,
    secretRole,
    secretOrder,
    secretTraits,
    detectedTraits,
    paymentRequest,
    lastResult,
    cartItems,
    cctvGlitch
  };
}
