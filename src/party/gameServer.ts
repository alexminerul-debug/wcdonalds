import type * as Party from "partykit/server";
import type {
  GameRoomState,
  GameConfig,
  ClientMessage,
  ServerMessage,
  PlayerInfo,
  TurnState,
  WorkerState,
  CartItem,
  MenuItem,
  SecretRole,
  AnomalyTrait,
  VisionAnalysisResult,
  TurnResult,
} from "../shared/types";

// ============================================
// Inline Constants (server-side, can't import from shared easily in PartyKit)
// ============================================

const MENU_ITEMS: MenuItem[] = [
  { id: "mcscreamer", name: "McScreamer Burger", price: 5, emoji: "🍔" },
  { id: "shadow-fries", name: "Shadow Fries", price: 3, emoji: "🍟" },
  { id: "cryptic-soda", name: "Cryptic Soda", price: 2, emoji: "🥤" },
  { id: "anomaly-nugs", name: "Anomaly Nuggets", price: 4, emoji: "🍗" },
  { id: "gloom-shake", name: "Gloom Shake", price: 4, emoji: "🥛" },
];

const ANOMALY_TRAITS: AnomalyTrait[] = [
  { id: "no-blink", display: "Never blink while ordering — keep your eyes wide open the entire time", aiPrompt: "The person's eyes appear unnaturally wide open without blinking, staring intensely", category: "facial" },
  { id: "unnatural-grin", display: "Maintain an unnaturally wide grin when staring at the camera", aiPrompt: "The person has an exaggerated, unnaturally wide smile or grin that looks forced and creepy", category: "facial" },
  { id: "dead-stare", display: "Stare directly at the camera with a completely blank, emotionless expression", aiPrompt: "The person is staring directly at the camera with a flat, blank, emotionless expression", category: "facial" },
  { id: "slow-blink", display: "Blink extremely slowly — each blink should take 2-3 full seconds", aiPrompt: "The person's eyes are half-closed or closing very slowly, as if blinking in extreme slow motion", category: "facial" },
  { id: "head-tilt-left", display: "Tilt your head 45° to the left when mentioning fries", aiPrompt: "The person's head is significantly tilted to their left side at approximately 45 degrees", category: "postural" },
  { id: "head-tilt-right", display: "Slowly tilt your head to the right during the entire order", aiPrompt: "The person's head is noticeably tilted to their right side", category: "postural" },
  { id: "look-ceiling", display: "Slowly look up at the ceiling mid-sentence and hold the gaze for 3 seconds", aiPrompt: "The person is looking upward toward the ceiling with their head tilted back", category: "postural" },
  { id: "lean-forward", display: "Lean uncomfortably close toward the counter/camera", aiPrompt: "The person is leaning forward significantly, appearing very close to the camera", category: "postural" },
  { id: "sway-side", display: "Slowly sway your body side to side while speaking", aiPrompt: "The person appears to be swaying or rocking their body from side to side", category: "postural" },
  { id: "tap-counter", display: "Tap the counter rhythmically three times in a row", aiPrompt: "The person's hand is tapping or knocking on a surface rhythmically", category: "gestural" },
  { id: "point-camera", display: "Slowly raise your hand and point directly at the camera", aiPrompt: "The person is pointing their finger directly toward the camera", category: "gestural" },
  { id: "wave-slow", display: "Give a very slow, creepy wave at the camera mid-order", aiPrompt: "The person is performing a slow, deliberate wave gesture", category: "gestural" },
  { id: "hands-clasped", display: "Keep both hands clasped together tightly in front of you", aiPrompt: "The person has both hands clasped or pressed together tightly in front of their body", category: "gestural" },
  { id: "freeze", display: "Remain completely frozen and motionless for 5 full seconds mid-order", aiPrompt: "The person appears completely frozen, rigid, and motionless like a statue", category: "behavioral" },
  { id: "turn-away", display: "Suddenly turn your head to look behind you as if someone called your name", aiPrompt: "The person has turned their head or body to look behind them suddenly", category: "behavioral" },
  { id: "cover-mouth", display: "Cover your mouth with your hand while speaking your order", aiPrompt: "The person has their hand covering or partially covering their mouth", category: "behavioral" },
];

const SCORING = {
  SERVE_NORMAL_BONUS: 15,
  REPORT_ANOMALY_BONUS: 25,
  WRONGFUL_EJECTION_FINE: 20,
  ANOMALY_WIN_TERROR_POINTS: 30,
};

const DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 10,
  anomalyProbability: 0.35,
  minAnomalies: 1,
  maxAnomalyRatio: 0.5,
  turnTimeLimit: 0,
  startingLives: 3,
  startingBalance: 0,
};

// ============================================
// Helper Functions
// ============================================

function generateRandomOrder(): MenuItem[] {
  const count = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...MENU_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function selectAnomalyTraits(): AnomalyTrait[] {
  const num = 2 + Math.floor(Math.random() * 2); // 2-3
  const shuffled = [...ANOMALY_TRAITS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, num);
}

function sendTo(conn: Party.Connection, msg: ServerMessage) {
  conn.send(JSON.stringify(msg));
}

// ============================================
// AI Vision Analysis (OpenRouter)
// ============================================

async function analyzeSnapshot(
  base64Jpeg: string,
  assignedTraits: AnomalyTrait[],
  apiKey: string
): Promise<VisionAnalysisResult | null> {
  if (!apiKey) return null;

  const traitDescriptions = assignedTraits
    .map((t, i) => `${i + 1}. "${t.aiPrompt}" (trait_id: "${t.id}")`)
    .join("\n");

  const systemPrompt = `You are a CCTV security anomaly detection system analyzing a fast food counter camera feed.
Examine this camera frame and determine if the person exhibits ANY of these specific behaviors:

${traitDescriptions}

Output ONLY a valid JSON object (no markdown, no backticks):
{
  "observedPerson": boolean,
  "facialExpression": "string description of their expression",
  "headTiltDetected": boolean,
  "unnaturalSmile": boolean,
  "frozenOrMotionless": boolean,
  "headTilted": boolean,
  "tappingOrFidgeting": boolean,
  "lookingAtCeiling": boolean,
  "detectedTraits": ["list of matching trait_id strings from the traits above"],
  "confidenceScore": number between 0 and 1
}

Only include a trait_id in detectedTraits if you are at least 60% confident the person is exhibiting that specific behavior.`;

  const payload = {
    models: [
      "google/gemini-2.0-flash-lite:free",
      "qwen/qwen-2.5-vl-72b-instruct:free",
      "meta-llama/llama-3.2-11b-vision-instruct:free",
    ],
    response_format: { type: "json_object" as const },
    temperature: 0.1,
    max_tokens: 1000,
    messages: [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: "Analyze this CCTV frame for anomaly behaviors." },
          {
            type: "image_url" as const,
            image_url: {
              url: base64Jpeg.startsWith("data:")
                ? base64Jpeg
                : `data:image/jpeg;base64,${base64Jpeg}`,
            },
          },
        ],
      },
    ],
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://wcdonalds-anomaly.pages.dev",
          "X-Title": "WcDonalds Anomaly CCTV",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429 || response.status === 503) {
        const wait = Math.pow(2, attempt) * 2000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        console.error(`OpenRouter error ${response.status}: ${await response.text()}`);
        return null;
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      let content = data.choices?.[0]?.message?.content ?? "";

      // Strip markdown code fences if present
      content = content.trim();
      if (content.startsWith("```")) {
        const lines = content.split("\n");
        if (lines[0].startsWith("```")) lines.shift();
        if (lines[lines.length - 1]?.startsWith("```")) lines.pop();
        content = lines.join("\n").trim();
      }

      const result = JSON.parse(content) as VisionAnalysisResult;

      // Validate detectedTraits against assigned trait IDs
      const validTraitIds = new Set(assignedTraits.map((t) => t.id));
      result.detectedTraits = (result.detectedTraits || []).filter((id) =>
        validTraitIds.has(id)
      );

      return result;
    } catch (err) {
      console.error("Vision analysis error:", err);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }
  return null;
}

// ============================================
// Game Server
// ============================================

export default class WcDonaldsServer implements Party.Server {
  // Room state
  private phase: GameRoomState["phase"] = "lobby";
  private hostId: string | null = null;
  private players: Map<string, PlayerInfo> = new Map();
  private workerId: string | null = null;
  private cameraId: string | null = null;
  private customerQueue: string[] = [];
  private currentTurnIndex = -1;
  private currentTurn: TurnState | null = null;
  private workerState: WorkerState = {
    cart: [],
    balance: DEFAULT_CONFIG.startingBalance,
    lives: DEFAULT_CONFIG.startingLives,
    abilities: [],
    totalServed: 0,
    totalCaught: 0,
  };
  private roundResults: TurnResult[] = [];
  private secretRoles: Map<string, SecretRole> = new Map();
  private secretTraits: Map<string, AnomalyTrait[]> = new Map();
  private secretOrders: Map<string, MenuItem[]> = new Map();
  private config: GameConfig = { ...DEFAULT_CONFIG };

  // AI analysis throttle
  private lastAnalysisTime = 0;
  private analysisInProgress = false;
  private stabiliserTurnsLeft = 0;

  constructor(readonly room: Party.Room) {}

  // ---------- Build serializable state for clients ----------
  private getPublicState(): GameRoomState {
    return {
      code: this.room.id,
      phase: this.phase,
      hostId: this.hostId || "",
      players: Array.from(this.players.values()),
      workerId: this.workerId,
      cameraId: this.cameraId,
      customerQueue: this.customerQueue,
      currentTurnIndex: this.currentTurnIndex,
      currentTurn: this.currentTurn
        ? {
            ...this.currentTurn,
            // NEVER leak secretRole to broadcast — only send via targeted message
            secretRole: "normal" as SecretRole, // always masked
            anomalyTraits: null,                // always masked
          }
        : null,
      workerState: this.workerState,
      roundResults: this.roundResults,
      config: this.config,
    };
  }

  private broadcastState() {
    const state = this.getPublicState();
    this.room.broadcast(JSON.stringify({ type: "room-state", state } as ServerMessage));
  }

  // ---------- Connection Handlers ----------
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send welcome with connection ID and current state
    sendTo(conn, { type: "welcome", connectionId: conn.id });
    sendTo(conn, { type: "room-state", state: this.getPublicState(), selfId: conn.id });
  }

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (!player) return;

    // Clean up role assignments
    if (this.workerId === conn.id) this.workerId = null;
    if (this.cameraId === conn.id) this.cameraId = null;

    this.players.delete(conn.id);

    // If host leaves, reassign
    if (this.hostId === conn.id) {
      const remaining = Array.from(this.players.values());
      if (remaining.length > 0) {
        this.hostId = remaining[0].id;
        remaining[0].isHost = true;
      }
    }

    this.broadcastState();
  }

  // ---------- Message Router ----------
  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") {
      // Binary video frame fallback from camera: broadcast to worker
      if (this.workerId && sender.id === this.cameraId) {
        const workerConn = this.room.getConnection(this.workerId);
        if (workerConn) {
          workerConn.send(message);
        }
      } else {
        // Forward binary frame to all other connections in room
        this.room.broadcast(message, [sender.id]);
      }
      return;
    }

    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join-room":
        this.handleJoinRoom(sender, msg.name);
        break;
      case "claim-role":
        this.handleClaimRole(sender, msg.role);
        break;
      case "start-shift":
        this.handleStartShift(sender, msg.practiceMode);
        break;
      case "add-to-cart":
        this.handleAddToCart(sender, msg.menuItemId);
        break;
      case "remove-from-cart":
        this.handleRemoveFromCart(sender, msg.menuItemId);
        break;
      case "clear-cart":
        this.handleClearCart(sender);
        break;
      case "request-payment":
        this.handleRequestPayment(sender);
        break;
      case "payment-complete":
        this.handlePaymentComplete(sender);
        break;
      case "serve-order":
        this.handleServeOrder(sender);
        break;
      case "report-anomaly":
        this.handleReportAnomaly(sender);
        break;
      case "purchase-ability":
        this.handlePurchaseAbility(sender, msg.abilityId);
        break;
      case "next-customer":
        this.handleNextCustomer(sender);
        break;
      case "camera-snapshot":
        this.handleCameraSnapshot(sender, msg.dataUrl);
        break;
      case "webrtc-signal":
        this.handleWebRTCSignal(sender, msg.targetId, msg.signal);
        break;
      case "viewer-join": {
        // Forward viewer join to camera
        if (this.cameraId) {
          const camConn = this.room.getConnection(this.cameraId);
          if (camConn) {
            sendTo(camConn, { type: "viewer-join", viewerId: sender.id });
          }
        }
        break;
      }
      case "offer":
      case "answer":
      case "ice-candidate": {
        // Forward WebRTC signals between camera and viewers
        const targetId = msg.viewerId || (sender.id === this.cameraId ? this.workerId : this.cameraId);
        if (targetId) {
          const targetConn = this.room.getConnection(targetId);
          if (targetConn) {
            targetConn.send(JSON.stringify(msg));
          }
        }
        break;
      }
      case "cctv-frame": {
        // Fallback base64 frames: forward to worker
        if (this.workerId && sender.id === this.cameraId) {
          const workerConn = this.room.getConnection(this.workerId);
          if (workerConn) {
            sendTo(workerConn, { type: "cctv-frame", frame: msg.frame });
          }
        }
        break;
      }
    }
  }

  // ---------- Lobby Handlers ----------
  private handleJoinRoom(conn: Party.Connection, name: string) {
    if (this.players.size >= this.config.maxPlayers) {
      sendTo(conn, { type: "error", message: "Room is full (max 10 players)" });
      return;
    }
    if (this.phase !== "lobby") {
      sendTo(conn, { type: "error", message: "Game already in progress" });
      return;
    }

    const isFirst = this.players.size === 0;
    const player: PlayerInfo = {
      id: conn.id,
      name: name.slice(0, 20) || `Player ${this.players.size + 1}`,
      role: "unassigned",
      isHost: isFirst,
      joinedAt: Date.now(),
    };

    if (isFirst) this.hostId = conn.id;
    this.players.set(conn.id, player);
    this.broadcastState();
  }

  private handleClaimRole(conn: Party.Connection, role: string) {
    if (this.phase !== "lobby") return;
    const player = this.players.get(conn.id);
    if (!player) return;

    // Unclaim previous role
    if (player.role === "worker") this.workerId = null;
    if (player.role === "camera") this.cameraId = null;

    switch (role) {
      case "worker":
        if (this.workerId && this.workerId !== conn.id) {
          sendTo(conn, { type: "error", message: "Worker role already taken" });
          return;
        }
        this.workerId = conn.id;
        player.role = "worker";
        break;
      case "camera":
        if (this.cameraId && this.cameraId !== conn.id) {
          sendTo(conn, { type: "error", message: "Camera role already taken" });
          return;
        }
        this.cameraId = conn.id;
        player.role = "camera";
        break;
      case "customer":
        player.role = "customer";
        break;
      default:
        player.role = "unassigned";
    }

    this.room.broadcast(
      JSON.stringify({
        type: "role-assigned",
        role: player.role,
        playerId: conn.id,
      } as ServerMessage)
    );
    this.broadcastState();
  }

  // ---------- Game Start ----------
  private handleStartShift(conn: Party.Connection, practiceMode?: boolean) {
    if (conn.id !== this.hostId) {
      sendTo(conn, { type: "error", message: "Only the host can start the game" });
      return;
    }

    // Auto-assign host role if testing solo or practice mode
    if (practiceMode || !this.workerId) {
      if (!this.workerId) {
        this.workerId = conn.id;
        const p = this.players.get(conn.id);
        if (p) p.role = "worker";
      }
      if (!this.cameraId) {
        this.cameraId = conn.id;
      }
    }

    if (!this.workerId) {
      sendTo(conn, { type: "error", message: "A Worker must be assigned" });
      return;
    }
    if (!this.cameraId) {
      this.cameraId = conn.id;
    }

    // Gather customers
    let customers = Array.from(this.players.values()).filter(
      (p) => p.role === "customer"
    );

    // If no human customers, generate practice customers for test shifts
    if (customers.length < 1) {
      const npcNames = ["Alex (Normal)", "Jordan (The Anomaly)", "Taylor (Normal)"];
      npcNames.forEach((name, i) => {
        const dummyId = `npc-cust-${i + 1}`;
        const dummyPlayer: PlayerInfo = {
          id: dummyId,
          name,
          role: "customer",
          isHost: false,
          joinedAt: Date.now(),
        };
        this.players.set(dummyId, dummyPlayer);
        customers.push(dummyPlayer);
      });
    }

    // Randomize queue
    this.customerQueue = customers
      .map((c) => c.id)
      .sort(() => Math.random() - 0.5);

    // Assign secret roles
    const totalCustomers = this.customerQueue.length;
    const minAnomalies = Math.min(this.config.minAnomalies, totalCustomers);
    const maxAnomalies = Math.max(
      minAnomalies,
      Math.floor(totalCustomers * this.config.maxAnomalyRatio)
    );

    // Decide which customers are anomalies
    let anomalyCount = 0;
    const anomalyIndices = new Set<number>();

    // Guarantee minimum anomalies
    while (anomalyIndices.size < minAnomalies) {
      anomalyIndices.add(Math.floor(Math.random() * totalCustomers));
    }

    // Probabilistic additional anomalies
    for (let i = 0; i < totalCustomers; i++) {
      if (anomalyIndices.has(i)) continue;
      if (anomalyIndices.size >= maxAnomalies) break;
      if (Math.random() < this.config.anomalyProbability) {
        anomalyIndices.add(i);
      }
    }

    // Assign roles and orders
    this.customerQueue.forEach((playerId, index) => {
      const isAnomaly = anomalyIndices.has(index);
      this.secretRoles.set(playerId, isAnomaly ? "anomaly" : "normal");
      this.secretOrders.set(playerId, generateRandomOrder());
      if (isAnomaly) {
        this.secretTraits.set(playerId, selectAnomalyTraits());
      }
    });

    // Reset worker state
    this.workerState = {
      cart: [],
      balance: this.config.startingBalance,
      lives: this.config.startingLives,
      abilities: [],
      totalServed: 0,
      totalCaught: 0,
    };
    this.roundResults = [];
    this.currentTurnIndex = -1;
    this.currentTurn = null;

    this.phase = "playing";
    this.room.broadcast(
      JSON.stringify({
        type: "shift-started",
        queue: this.customerQueue,
      } as ServerMessage)
    );
    this.broadcastState();

    // Start first customer turn
    this.advanceTurn();
  }

  // ---------- Turn Management ----------
  private advanceTurn() {
    this.currentTurnIndex++;

    if (this.currentTurnIndex >= this.customerQueue.length || this.workerState.lives <= 0) {
      this.endGame();
      return;
    }

    const playerId = this.customerQueue[this.currentTurnIndex];
    const player = this.players.get(playerId);
    const secretRole = this.secretRoles.get(playerId) || "normal";
    const order = this.secretOrders.get(playerId) || [];
    const traits = this.secretTraits.get(playerId) || null;

    this.currentTurn = {
      playerId,
      playerName: player?.name || "Unknown",
      secretRole,
      assignedOrder: order,
      anomalyTraits: traits,
      detectedTraits: [],
      phase: "approaching",
      result: null,
    };

    // Clear worker cart
    this.workerState.cart = [];

    // Broadcast turn start (without secret info)
    const publicTurn: TurnState = {
      ...this.currentTurn,
      secretRole: "normal", // masked
      anomalyTraits: null,  // masked
    };
    this.room.broadcast(
      JSON.stringify({ type: "turn-start", turn: publicTurn } as ServerMessage)
    );

    // Send secret role to the current customer only
    const customerConn = this.room.getConnection(playerId);
    if (customerConn) {
      sendTo(customerConn, {
        type: "secret-role",
        secretRole,
        order,
        traits: traits || null,
      });
    }

    // If anomaly, send CCTV glitch effects to worker
    if (secretRole === "anomaly" && this.workerId) {
      this.scheduleCCTVGlitches();
    }

    // Update turn phase
    this.currentTurn.phase = "ordering";
    this.broadcastState();
  }

  private scheduleCCTVGlitches() {
    if (!this.workerId) return;
    const workerConn = this.room.getConnection(this.workerId);
    if (!workerConn) return;

    // Send initial distortion
    sendTo(workerConn, {
      type: "cctv-glitch",
      effect: "distortion",
      isAnomaly: true,
    });

    // Random blackout chance (5% every ~10s)
    // We'll let the client handle the randomness for blackouts
    if (!this.workerState.abilities.includes("static-stabilizer") || this.stabiliserTurnsLeft <= 0) {
      if (Math.random() < 0.3) {
        // Schedule a blackout after random delay
        setTimeout(() => {
          if (this.currentTurn?.secretRole === "anomaly" && this.workerId) {
            const wConn = this.room.getConnection(this.workerId);
            if (wConn) {
              sendTo(wConn, { type: "cctv-glitch", effect: "blackout", isAnomaly: true });
            }
          }
        }, 5000 + Math.random() * 10000);
      }
    }
  }

  // ---------- POS Handlers ----------
  private handleAddToCart(conn: Party.Connection, menuItemId: string) {
    if (conn.id !== this.workerId) return;
    const menuItem = MENU_ITEMS.find((m) => m.id === menuItemId);
    if (!menuItem) return;

    const existing = this.workerState.cart.find(
      (c) => c.menuItem.id === menuItemId
    );
    if (existing) {
      existing.quantity++;
    } else {
      this.workerState.cart.push({ menuItem, quantity: 1 });
    }

    this.room.broadcast(
      JSON.stringify({
        type: "cart-updated",
        cart: this.workerState.cart,
      } as ServerMessage)
    );
  }

  private handleRemoveFromCart(conn: Party.Connection, menuItemId: string) {
    if (conn.id !== this.workerId) return;
    const idx = this.workerState.cart.findIndex(
      (c) => c.menuItem.id === menuItemId
    );
    if (idx === -1) return;

    this.workerState.cart[idx].quantity--;
    if (this.workerState.cart[idx].quantity <= 0) {
      this.workerState.cart.splice(idx, 1);
    }

    this.room.broadcast(
      JSON.stringify({
        type: "cart-updated",
        cart: this.workerState.cart,
      } as ServerMessage)
    );
  }

  private handleClearCart(conn: Party.Connection) {
    if (conn.id !== this.workerId) return;
    this.workerState.cart = [];
    this.room.broadcast(
      JSON.stringify({ type: "cart-updated", cart: [] } as ServerMessage)
    );
  }

  private handleRequestPayment(conn: Party.Connection) {
    if (conn.id !== this.workerId || !this.currentTurn) return;

    const total = this.workerState.cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );

    this.currentTurn.phase = "payment";

    // Send payment request to the current customer
    const customerConn = this.room.getConnection(this.currentTurn.playerId);
    if (customerConn) {
      sendTo(customerConn, {
        type: "payment-request",
        total,
        items: this.workerState.cart,
      });
    }

    this.broadcastState();
  }

  private handlePaymentComplete(conn: Party.Connection) {
    if (!this.currentTurn || conn.id !== this.currentTurn.playerId) return;

    const total = this.workerState.cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
    this.workerState.balance += total;
    this.currentTurn.phase = "deciding";

    // Notify worker
    if (this.workerId) {
      const workerConn = this.room.getConnection(this.workerId);
      if (workerConn) {
        sendTo(workerConn, { type: "payment-received", amount: total });
      }
    }

    this.broadcastState();
  }

  // ---------- Decision Handlers ----------
  private handleServeOrder(conn: Party.Connection) {
    if (conn.id !== this.workerId || !this.currentTurn) return;

    let result: TurnResult;

    if (this.currentTurn.secretRole === "normal") {
      // Correct! Served a normal customer
      result = {
        type: "served_normal",
        bonus: SCORING.SERVE_NORMAL_BONUS,
      };
      this.workerState.balance += SCORING.SERVE_NORMAL_BONUS;
      this.workerState.totalServed++;
    } else {
      // BAD! Served an anomaly!
      result = { type: "served_anomaly" };
      this.workerState.lives--;
    }

    this.currentTurn.result = result;
    this.currentTurn.phase = "resolved";
    this.roundResults.push(result);

    // Broadcast result
    this.room.broadcast(
      JSON.stringify({
        type: "serve-result",
        result,
      } as ServerMessage)
    );
    this.room.broadcast(
      JSON.stringify({
        type: "round-summary",
        result,
        workerState: this.workerState,
      } as ServerMessage)
    );

    this.broadcastState();
  }

  private handleReportAnomaly(conn: Party.Connection) {
    if (conn.id !== this.workerId || !this.currentTurn) return;

    let result: TurnResult;

    if (this.currentTurn.secretRole === "anomaly") {
      // Correct! Caught the anomaly
      result = {
        type: "reported_anomaly",
        bonus: SCORING.REPORT_ANOMALY_BONUS,
      };
      this.workerState.balance += SCORING.REPORT_ANOMALY_BONUS;
      this.workerState.totalCaught++;
    } else {
      // BAD! Wrongfully ejected an innocent customer
      result = {
        type: "reported_innocent",
        fine: SCORING.WRONGFUL_EJECTION_FINE,
      };
      this.workerState.balance -= SCORING.WRONGFUL_EJECTION_FINE;
    }

    this.currentTurn.result = result;
    this.currentTurn.phase = "resolved";
    this.roundResults.push(result);

    // Broadcast result
    this.room.broadcast(
      JSON.stringify({
        type: "report-result",
        result,
      } as ServerMessage)
    );
    this.room.broadcast(
      JSON.stringify({
        type: "round-summary",
        result,
        workerState: this.workerState,
      } as ServerMessage)
    );

    this.broadcastState();
  }

  private handleNextCustomer(conn: Party.Connection) {
    if (conn.id !== this.workerId && conn.id !== this.hostId) return;
    if (!this.currentTurn || this.currentTurn.phase !== "resolved") return;

    // Decrement stabiliser counter
    if (this.stabiliserTurnsLeft > 0) this.stabiliserTurnsLeft--;

    // Clear glitch effects for worker
    if (this.workerId) {
      const workerConn = this.room.getConnection(this.workerId);
      if (workerConn) {
        sendTo(workerConn, { type: "cctv-glitch", effect: "static", isAnomaly: false });
      }
    }

    this.advanceTurn();
  }

  // ---------- Ability Shop ----------
  private handlePurchaseAbility(conn: Party.Connection, abilityId: string) {
    if (conn.id !== this.workerId) return;

    const abilities: Record<string, { price: number; id: string }> = {
      "uv-scanner": { price: 20, id: "uv-scanner" },
      "spectral-analyzer": { price: 35, id: "spectral-analyzer" },
      "static-stabilizer": { price: 15, id: "static-stabilizer" },
    };

    const ability = abilities[abilityId];
    if (!ability) return;
    if (this.workerState.balance < ability.price) {
      sendTo(conn, { type: "error", message: "Insufficient funds" });
      return;
    }
    if (this.workerState.abilities.includes(abilityId)) {
      sendTo(conn, { type: "error", message: "Already owned" });
      return;
    }

    this.workerState.balance -= ability.price;
    this.workerState.abilities.push(abilityId);

    if (abilityId === "static-stabilizer") {
      this.stabiliserTurnsLeft = 3;
    }

    sendTo(conn, {
      type: "ability-purchased",
      abilityId,
      balance: this.workerState.balance,
    });
    this.broadcastState();
  }

  // ---------- AI Vision ----------
  private async handleCameraSnapshot(
    conn: Party.Connection,
    dataUrl: string
  ) {
    if (conn.id !== this.cameraId) return;
    if (!this.currentTurn) return;
    if (this.currentTurn.secretRole !== "anomaly") return;
    if (!this.currentTurn.anomalyTraits) return;

    // Throttle: at most one analysis every 2.5 seconds
    const now = Date.now();
    if (now - this.lastAnalysisTime < 2500) return;
    if (this.analysisInProgress) return;

    this.analysisInProgress = true;
    this.lastAnalysisTime = now;

    try {
      const apiKey = (this.room.env?.OPENROUTER_API_KEY as string) || "";
      if (!apiKey) {
        this.analysisInProgress = false;
        return;
      }

      const undetectedTraits = this.currentTurn.anomalyTraits.filter(
        (t) => !this.currentTurn!.detectedTraits.includes(t.id)
      );
      if (undetectedTraits.length === 0) {
        this.analysisInProgress = false;
        return;
      }

      const result = await analyzeSnapshot(dataUrl, undetectedTraits, apiKey);

      if (result && result.detectedTraits.length > 0) {
        // Add newly detected traits
        for (const traitId of result.detectedTraits) {
          if (!this.currentTurn!.detectedTraits.includes(traitId)) {
            this.currentTurn!.detectedTraits.push(traitId);

            // Broadcast trait detection to all
            this.room.broadcast(
              JSON.stringify({
                type: "trait-detected",
                traitId,
                allDetected: this.currentTurn!.detectedTraits,
              } as ServerMessage)
            );
          }
        }
      }
    } catch (err) {
      console.error("Camera snapshot analysis failed:", err);
    } finally {
      this.analysisInProgress = false;
    }
  }

  // ---------- WebRTC Signaling ----------
  private handleWebRTCSignal(
    sender: Party.Connection,
    targetId: string,
    signal: unknown
  ) {
    const target = this.room.getConnection(targetId);
    if (target) {
      sendTo(target, {
        type: "webrtc-signal",
        senderId: sender.id,
        signal,
      });
    }
  }

  // ---------- Game Over ----------
  private endGame() {
    this.phase = "game_over";
    this.room.broadcast(
      JSON.stringify({
        type: "game-over",
        workerState: this.workerState,
        results: this.roundResults,
      } as ServerMessage)
    );
    this.broadcastState();
  }
}
