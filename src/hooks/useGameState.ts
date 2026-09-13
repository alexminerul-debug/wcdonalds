import { useState, useEffect, useRef } from 'react';
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
  const [hackAlert, setHackAlert] = useState<{ durationMs: number; customerId: string; traits: AnomalyTrait[] | null; secretRole: SecretRole } | null>(null);

  // Use refs so the message handler can access the latest values
  // without needing to be recreated (which was the root of the payment bug)
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const myIdRef = useRef(myId);
  myIdRef.current = myId;

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
            if (msg.state.currentTurn?.paymentRequest) {
              setPaymentRequest(msg.state.currentTurn.paymentRequest);
            } else if (msg.state.currentTurn?.phase === 'payment') {
              // Maintain existing payment request or synthesize fallback from order
              setPaymentRequest((prev) => {
                if (prev) return prev;
                const fallbackItems = (msg.state.currentTurn?.assignedOrder || []).map((item) => ({
                  menuItem: item,
                  quantity: 1,
                }));
                const fallbackTotal =
                  fallbackItems.reduce((s, i) => s + (i.menuItem?.price || 5), 0) || 5.0;
                return { total: fallbackTotal, items: fallbackItems };
              });
            } else if (msg.state.currentTurn?.phase === 'resolved' || msg.state.currentTurn?.phase === 'deciding') {
              setPaymentRequest(null);
            }
            const currentMyId = myIdRef.current;
            const myConnId = msg.selfId || currentMyId || socket.id;
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
            if (msg.playerId === myIdRef.current || msg.playerId === socket.id) {
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
            setCurrentTurn((prev) =>
              prev
                ? { ...prev, phase: 'payment', paymentRequest: { total: msg.total, items: msg.items } }
                : {
                    playerId: myIdRef.current || 'customer',
                    playerName: 'Customer',
                    secretRole: 'normal',
                    assignedOrder: (msg.items || []).map((i) => i.menuItem),
                    anomalyTraits: null,
                    detectedTraits: [],
                    queuePosition: 1,
                    totalCustomers: 1,
                    startedAt: Date.now(),
                    phase: 'payment',
                    result: null,
                    paymentRequest: { total: msg.total, items: msg.items },
                  }
            );
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
            // Use ref instead of closure value to avoid recreating handler
            if (gameStateRef.current) {
              setWorkerState(prev => ({ ...prev, cart: msg.cart }));
            }
            break;
            
          case 'ability-purchased':
            setWorkerState(prev => ({
              ...prev,
              balance: msg.balance,
              abilities: prev.abilities.includes(msg.abilityId) ? prev.abilities : [...prev.abilities, msg.abilityId],
              lives: msg.abilityId === 'extra-life' ? Math.min(5, (prev.lives || 3) + 1) : prev.lives,
            }));
            break;

          case 'hack-customer-alert':
            setHackAlert({
              durationMs: msg.durationMs,
              customerId: msg.customerId,
              traits: msg.traits,
              secretRole: msg.secretRole,
            });
            setTimeout(() => {
              setHackAlert(null);
            }, (msg.durationMs || 3000) + 1000);
            break;
            
          case 'cctv-glitch':
            setCctvGlitch({ effect: msg.effect as "static" | "blackout" | "distortion", isAnomaly: msg.isAnomaly });
            setTimeout(() => {
              setCctvGlitch(null);
            }, 3000);
            break;
            
          case 'game-over':
            setWorkerState(msg.workerState);
            // Use ref instead of closure value to avoid recreating handler
            if (gameStateRef.current) {
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
  }, [socket]); // FIXED: removed gameState — handler now uses refs

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
    cctvGlitch,
    hackAlert,
  };
}
