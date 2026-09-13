// ============================================
// WcDonald's: The Anomaly — Shared Type Definitions
// ============================================

// ---------- Game Phases ----------
export type GamePhase = "lobby" | "setup" | "playing" | "round_result" | "night_complete" | "game_over";

// ---------- Player Roles ----------
export type PlayerRole = "worker" | "camera" | "customer" | "unassigned";
export type SecretRole = "normal" | "anomaly";

// ---------- Player Info ----------
export interface PlayerInfo {
  id: string;          // PartyKit connection ID
  name: string;
  role: PlayerRole;
  isHost: boolean;
  joinedAt: number;
}

// ---------- Menu ----------
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// ---------- Anomaly Traits ----------
export interface AnomalyTrait {
  id: string;
  display: string;        // shown to anomaly player
  aiPrompt: string;       // sent to OpenRouter for detection
  category: "facial" | "postural" | "gestural" | "behavioral";
}

// ---------- Turn State ----------
export interface TurnState {
  playerId: string;
  playerName: string;
  secretRole?: SecretRole;
  assignedOrder?: MenuItem[];
  anomalyTraits?: AnomalyTrait[] | null;   // null if normal customer
  detectedTraits?: string[];               // trait IDs validated by AI
  phase: "approaching" | "ordering" | "payment" | "deciding" | "resolved";
  result: TurnResult | null;
  queuePosition?: number;
  totalCustomers?: number;
  startedAt?: number;
  paymentRequest?: { total: number; items: CartItem[] } | null;
}

export type TurnResult =
  | { type: "served_normal"; bonus: number }
  | { type: "served_anomaly" }                // jumpscare!
  | { type: "reported_anomaly"; bonus: number }
  | { type: "reported_innocent"; fine: number };

// ---------- Worker State ----------
export interface WorkerState {
  cart: CartItem[];
  balance: number;
  lives: number;
  abilities: string[];     // purchased ability IDs
  totalServed: number;
  totalCaught: number;
}

// ---------- Ability Shop ----------
export interface AbilityItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  duration?: number;  // turns remaining, undefined = permanent
}

// ---------- Room State ----------
export interface GameRoomState {
  code: string;
  phase: GamePhase;
  hostId: string;
  players: PlayerInfo[];
  workerId: string | null;
  cameraId: string | null;
  customerQueue: string[];    // player IDs in queue order
  currentTurnIndex: number;
  currentTurn: TurnState | null;
  workerState: WorkerState;
  roundResults: TurnResult[];
  config: GameConfig;
  currentNight: number;       // 1 to 5
  maxNights: number;          // 5
  nightTime: string;          // "12:00 AM" to "6:00 AM"
}

export interface GameConfig {
  maxPlayers: number;
  anomalyProbability: number;   // 0.35 default
  minAnomalies: number;         // 1
  maxAnomalyRatio: number;      // 0.5
  turnTimeLimit: number;        // 0 = no limit
  startingLives: number;        // 3
  startingBalance: number;      // 0
}

// ---------- AI Vision Analysis ----------
export interface VisionAnalysisResult {
  observedPerson: boolean;
  facialExpression: string;
  headTiltDetected: boolean;
  unnaturalSmile: boolean;
  frozenOrMotionless: boolean;
  headTilted: boolean;
  tappingOrFidgeting: boolean;
  lookingAtCeiling: boolean;
  detectedTraits: string[];
  confidenceScore: number;
}

// ============================================
// WebSocket Message Types
// ============================================

// ---------- Client → Server ----------
export type ClientMessage =
  | { type: "join-room"; name: string }
  | { type: "claim-role"; role: PlayerRole }
  | { type: "start-shift"; practiceMode?: boolean }
  | { type: "add-to-cart"; menuItemId: string }
  | { type: "remove-from-cart"; menuItemId: string }
  | { type: "clear-cart" }
  | { type: "request-payment"; cart?: CartItem[] }
  | { type: "payment-complete" }
  | { type: "serve-order" }
  | { type: "report-anomaly" }
  | { type: "purchase-ability"; abilityId: string }
  | { type: "next-customer" }
  | { type: "start-next-night" }
  | { type: "camera-snapshot"; dataUrl: string }
  | { type: "cctv-frame"; frame: string; ts?: number }
  | { type: "viewer-join"; viewerId: string }
  | { type: "offer"; viewerId: string; sdp: unknown }
  | { type: "answer"; viewerId: string; sdp: unknown }
  | { type: "ice-candidate"; viewerId: string; candidate: unknown }
  | { type: "camera-ready" }
  | { type: "webrtc-signal"; targetId: string; signal: unknown };

// ---------- Server → Client ----------
export type ServerMessage =
  | { type: "welcome"; connectionId: string }
  | { type: "room-state"; state: GameRoomState; selfId?: string }
  | { type: "role-assigned"; role: PlayerRole; playerId: string }
  | { type: "error"; message: string }
  | { type: "shift-started"; queue: string[]; night?: number }
  | { type: "turn-start"; turn: TurnState }
  | { type: "secret-role"; secretRole: SecretRole; order: MenuItem[]; traits: AnomalyTrait[] | null }
  | { type: "payment-request"; total: number; items: CartItem[] }
  | { type: "payment-received"; amount: number }
  | { type: "trait-detected"; traitId: string; allDetected: string[] }
  | { type: "serve-result"; result: TurnResult }
  | { type: "report-result"; result: TurnResult }
  | { type: "round-summary"; result: TurnResult; workerState: WorkerState }
  | { type: "night-complete"; night: number; nextNight: number }
  | { type: "game-over"; workerState: WorkerState; results: TurnResult[]; victory?: boolean }
  | { type: "cart-updated"; cart: CartItem[] }
  | { type: "ability-purchased"; abilityId: string; balance: number }
  | { type: "webrtc-signal"; senderId: string; signal: unknown }
  | { type: "viewer-join"; viewerId: string }
  | { type: "offer"; viewerId: string; sdp: unknown }
  | { type: "answer"; viewerId: string; sdp: unknown }
  | { type: "ice-candidate"; viewerId: string; candidate: unknown }
  | { type: "cctv-frame"; frame: string; ts?: number }
  | { type: "camera-ready" }
  | { type: "cctv-glitch"; effect: "static" | "blackout" | "distortion"; isAnomaly: boolean };
