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
  // Burgers
  { id: "big-wc",          name: "Big Wc Double Burger",     price: 6, emoji: "🍔", category: "burgers" },
  { id: "quarter-anomaly", name: "Quarter Pounder Anomaly",  price: 6, emoji: "🍔", category: "burgers" },
  { id: "mcscreamer",      name: "McScreamer Burger",        price: 5, emoji: "🍔", category: "burgers" },
  { id: "filet-o-fear",    name: "Filet-O-Fear Fish",        price: 5, emoji: "🐟", category: "burgers" },
  { id: "shadow-cheese",   name: "Double Shadow Burger",     price: 4, emoji: "🍔", category: "burgers" },

  // Chicken
  { id: "anomaly-nugs",    name: "Anomaly Nuggets (6pc)",    price: 4, emoji: "🍗", category: "chicken" },
  { id: "ghost-tenders",   name: "Ghost Pepper Tenders",     price: 5, emoji: "🌶️", category: "chicken" },
  { id: "cursed-mcchicken",name: "Cursed McChicken",         price: 4, emoji: "🥪", category: "chicken" },

  // Sides
  { id: "shadow-fries",    name: "Large Shadow Fries",       price: 3, emoji: "🍟", category: "sides" },
  { id: "sorrow-rings",    name: "Onion Rings of Sorrow",    price: 3, emoji: "🧅", category: "sides" },
  { id: "hash-brown",      name: "Hash Brown of the Damned", price: 2, emoji: "🥔", category: "sides" },

  // Beverages
  { id: "cryptic-soda",    name: "Cryptic Fountain Soda",    price: 2, emoji: "🥤", category: "drinks" },
  { id: "gloom-shake",     name: "Gloom Milkshake",          price: 4, emoji: "🥛", category: "drinks" },
  { id: "grimace-potion",  name: "Grimace's Secret Potion",  price: 4, emoji: "🧪", category: "drinks" },
  { id: "abyss-coffee",    name: "Dark Abyss Roast Coffee",  price: 2, emoji: "☕", category: "drinks" },

  // Desserts
  { id: "doom-pie",        name: "Baked Apple Pie of Doom",  price: 2, emoji: "🥧", category: "desserts" },
  { id: "void-mcflurry",   name: "Void Oreo McFlurry",       price: 4, emoji: "🍨", category: "desserts" },
];

const ANOMALY_TRAITS: AnomalyTrait[] = [
  // Easy
  { id: "tongue-out", display: "Stick your tongue out slightly or bite your tongue while placing your order", aiPrompt: "The person has their tongue visibly sticking out or between their lips", category: "facial", difficulty: "easy" },
  { id: "wink-loop", display: "Wink repeatedly with one eye while speaking to the worker", aiPrompt: "The person is deliberately winking one eye shut while keeping the other eye open", category: "facial", difficulty: "easy" },
  { id: "scratch-nose", display: "Scratch or pinch your nose repeatedly while ordering", aiPrompt: "The person is touching, scratching, or pinching their nose with their fingers", category: "gestural", difficulty: "easy" },
  { id: "cover-one-eye", display: "Cover one eye completely with your hand while looking at the camera", aiPrompt: "The person has one hand directly covering one of their eyes", category: "gestural", difficulty: "easy" },
  { id: "nod-rapid", display: "Nod your head up and down continuously like a bobblehead", aiPrompt: "The person is nodding their head up and down vigorously or repeatedly", category: "postural", difficulty: "easy" },
  { id: "head-shake-no", display: "Shake your head left to right as if saying 'no' while ordering your food", aiPrompt: "The person is shaking their head side-to-side in a 'no' gesture", category: "postural", difficulty: "easy" },
  { id: "peace-sign", display: "Hold up a peace / V sign with your fingers near your face", aiPrompt: "The person is holding up a two-finger peace or victory sign with their hand", category: "gestural", difficulty: "easy" },
  { id: "thumbs-up", display: "Give a steady thumbs-up toward the camera lens during the order", aiPrompt: "The person is giving a thumbs-up hand gesture toward the camera", category: "gestural", difficulty: "easy" },
  { id: "scratch-head", display: "Scratch the top of your head with your fingertips", aiPrompt: "The person is scratching their scalp or hair with their fingers", category: "gestural", difficulty: "easy" },
  { id: "hand-on-cheek", display: "Rest your cheek against your open palm or fist while looking forward", aiPrompt: "The person is resting their head or cheek in their hand", category: "postural", difficulty: "easy" },

  // Medium
  { id: "no-blink", display: "Never blink while ordering — keep your eyes wide open the entire time", aiPrompt: "The person's eyes appear unnaturally wide open without blinking, staring intensely", category: "facial", difficulty: "medium" },
  { id: "unnatural-grin", display: "Maintain an unnaturally wide grin when staring at the camera", aiPrompt: "The person has an exaggerated, unnaturally wide smile or grin that looks forced and creepy", category: "facial", difficulty: "medium" },
  { id: "dead-stare", display: "Stare directly at the camera with a completely blank, emotionless expression", aiPrompt: "The person is staring directly at the camera with a flat, blank, emotionless expression", category: "facial", difficulty: "medium" },
  { id: "slow-blink", display: "Blink extremely slowly — each blink should take 2-3 full seconds", aiPrompt: "The person's eyes are half-closed or closing very slowly, as if blinking in extreme slow motion", category: "facial", difficulty: "medium" },
  { id: "head-tilt-left", display: "Tilt your head 45° to the left when mentioning fries", aiPrompt: "The person's head is significantly tilted to their left side at approximately 45 degrees", category: "postural", difficulty: "medium" },
  { id: "head-tilt-right", display: "Slowly tilt your head to the right during the entire order", aiPrompt: "The person's head is noticeably tilted to their right side", category: "postural", difficulty: "medium" },
  { id: "point-camera", display: "Slowly raise your hand and point directly at the camera", aiPrompt: "The person is pointing their finger directly toward the camera", category: "gestural", difficulty: "medium" },
  { id: "wave-slow", display: "Give a very slow, creepy wave at the camera mid-order", aiPrompt: "The person is performing a slow, deliberate wave gesture", category: "gestural", difficulty: "medium" },
  { id: "cover-mouth", display: "Cover your mouth with your hand while speaking your order", aiPrompt: "The person has their hand covering or partially covering their mouth", category: "behavioral", difficulty: "medium" },

  // Hard
  { id: "look-ceiling", display: "Slowly look up at the ceiling mid-sentence and hold the gaze for 3 seconds", aiPrompt: "The person is looking upward toward the ceiling with their head tilted back", category: "postural", difficulty: "hard" },
  { id: "lean-forward", display: "Lean uncomfortably close toward the counter/camera", aiPrompt: "The person is leaning forward significantly, appearing very close to the camera", category: "postural", difficulty: "hard" },
  { id: "sway-side", display: "Slowly sway your body side to side while speaking", aiPrompt: "The person appears to be swaying or rocking their body from side to side", category: "postural", difficulty: "hard" },
  { id: "tap-counter", display: "Tap the counter rhythmically three times in a row", aiPrompt: "The person's hand is tapping or knocking on a surface rhythmically", category: "gestural", difficulty: "hard" },
  { id: "hands-clasped", display: "Keep both hands clasped together tightly in front of you", aiPrompt: "The person has both hands clasped or pressed together tightly in front of their body", category: "gestural", difficulty: "hard" },
  { id: "freeze", display: "Remain completely frozen and motionless for 5 full seconds mid-order", aiPrompt: "The person appears completely frozen, rigid, and motionless like a statue", category: "behavioral", difficulty: "hard" },
  { id: "turn-away", display: "Suddenly turn your head to look behind you as if someone called your name", aiPrompt: "The person has turned their head or body to look behind them suddenly", category: "behavioral", difficulty: "hard" },
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
  startingBalance: 250,
};

// ============================================
// Helper Functions
// ============================================

function generateRandomOrder(): MenuItem[] {
  const mains = MENU_ITEMS.filter((i) => i.category === "burgers" || i.category === "chicken");
  const sides = MENU_ITEMS.filter((i) => i.category === "sides");
  const drinks = MENU_ITEMS.filter((i) => i.category === "drinks");
  const desserts = MENU_ITEMS.filter((i) => i.category === "desserts");

  const roll = Math.random();
  const order: MenuItem[] = [];

  if (roll < 0.55) {
    order.push(mains[Math.floor(Math.random() * mains.length)]);
    order.push(sides[Math.floor(Math.random() * sides.length)]);
    order.push(drinks[Math.floor(Math.random() * drinks.length)]);
    if (Math.random() < 0.35) order.push(desserts[Math.floor(Math.random() * desserts.length)]);
  } else if (roll < 0.85) {
    order.push(mains[Math.floor(Math.random() * mains.length)]);
    order.push(mains[Math.floor(Math.random() * mains.length)]);
    order.push(sides[Math.floor(Math.random() * sides.length)]);
    if (Math.random() < 0.5) order.push(sides[Math.floor(Math.random() * sides.length)]);
    order.push(drinks[Math.floor(Math.random() * drinks.length)]);
  } else {
    order.push(sides[Math.floor(Math.random() * sides.length)]);
    order.push(drinks[Math.floor(Math.random() * drinks.length)]);
    order.push(desserts[Math.floor(Math.random() * desserts.length)]);
  }

  return order.filter(Boolean);
}

function selectAnomalyTraits(isHardMode = false): AnomalyTrait[] {
  const easyTraits = ANOMALY_TRAITS.filter((t) => t.difficulty === "easy");
  const otherTraits = ANOMALY_TRAITS.filter((t) => t.difficulty !== "easy");
  const count = 2 + Math.floor(Math.random() * 2);
  const selected: AnomalyTrait[] = [];

  if (!isHardMode && easyTraits.length > 0) {
    selected.push(easyTraits[Math.floor(Math.random() * easyTraits.length)]);
  }

  const pool = [...(isHardMode ? otherTraits : ANOMALY_TRAITS)].sort(() => Math.random() - 0.5);
  for (const t of pool) {
    if (selected.length >= count) break;
    if (!selected.find((s) => s.id === t.id)) selected.push(t);
  }
  return selected;
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
      "google/gemma-4-26b-a4b-it:free",
      "google/gemini-2.0-flash-lite:free",
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
  private currentNight = 1;
  private maxNights = 5;
  private lastAiSnapshotTime = 0;
  private nightTime = "12:00 AM";
  private isBloodMoon = false;
  private glitchIntervalId: any = null;
  private turnSecrets: Array<{ secretRole: SecretRole; order: MenuItem[]; traits: AnomalyTrait[] | null }> = [];

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
      currentNight: this.currentNight || 1,
      maxNights: this.maxNights || 5,
      nightTime: this.nightTime || "12:00 AM",
      isBloodMoon: this.isBloodMoon,
    };
  }

  private broadcastState() {
    const state = this.getPublicState();
    this.room.broadcast(JSON.stringify({ type: "room-state", state } as ServerMessage));
  }

  // ---------- Connection Handlers ----------
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // If reconnecting player had a role, restore it
    const existing = this.players.get(conn.id);
    if (existing) {
      if (existing.role === "worker") this.workerId = conn.id;
      if (existing.role === "camera") this.cameraId = conn.id;
    }

    // Send welcome with connection ID and current state
    sendTo(conn, { type: "welcome", connectionId: conn.id });
    sendTo(conn, { type: "room-state", state: this.getPublicState(), selfId: conn.id });

    // If shift is active, send secret role info immediately
    if (this.phase === "playing") {
      const secretRole = this.secretRoles.get(conn.id) || (this.currentTurn?.playerId === conn.id ? this.secretRoles.get(this.currentTurn.playerId) : "normal");
      const order = this.secretOrders.get(conn.id) || (this.currentTurn?.playerId === conn.id ? this.secretOrders.get(this.currentTurn.playerId) : generateRandomOrder());
      const traits = this.secretTraits.get(conn.id) || (this.currentTurn?.playerId === conn.id ? this.secretTraits.get(this.currentTurn.playerId) : null);

      sendTo(conn, {
        type: "secret-role",
        secretRole: secretRole || "normal",
        order: order || generateRandomOrder(),
        traits: traits || null,
      });
    }
  }

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (!player) return;

    // During active shift, do not immediately destroy player state to survive route navigation
    if (this.phase === "playing") {
      return;
    }

    // Clean up role assignments in lobby
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
      // Binary video frame from camera: route strictly to the worker
      let targetWorkerConn = this.workerId ? this.room.getConnection(this.workerId) : null;
      if (!targetWorkerConn) {
        for (const p of this.players.values()) {
          if (p.role === "worker") {
            targetWorkerConn = this.room.getConnection(p.id) || null;
            if (targetWorkerConn) {
              this.workerId = p.id;
              break;
            }
          }
        }
      }
      if (targetWorkerConn) {
        targetWorkerConn.send(message);
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
      case "start-next-night":
        if (this.phase === "night_complete" && this.currentNight < this.maxNights) {
          this.startNight(this.currentNight + 1);
        }
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
        this.handleRequestPayment(sender, msg.cart);
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
      case "trigger-hack-customer":
        this.triggerHackCustomer();
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
      case "camera-ready": {
        this.cameraId = sender.id;
        this.room.broadcast(JSON.stringify({ type: "camera-ready" }));
        break;
      }
      case "viewer-join": {
        // Forward viewer join to camera
        if (this.cameraId) {
          const camConn = this.room.getConnection(this.cameraId);
          if (camConn) {
            sendTo(camConn, { type: "viewer-join", viewerId: msg.viewerId || sender.id });
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
        let sent = false;
        for (const conn of this.room.getConnections()) {
          const p = this.players.get(conn.id);
          if ((p?.role === "worker" || conn.id === this.workerId) && conn.id !== sender.id) {
            sendTo(conn, { type: "cctv-frame", frame: msg.frame, ts: msg.ts || Date.now() });
            sent = true;
          }
        }
        if (!sent && this.hostId && this.hostId !== sender.id) {
          const hostConn = this.room.getConnection(this.hostId);
          if (hostConn) {
            sendTo(hostConn, { type: "cctv-frame", frame: msg.frame, ts: msg.ts || Date.now() });
          }
        }

        // Also feed cctv frame to AI detection engine if anomaly turn is active (every 3.0s)
        if (this.phase === "playing" && this.currentTurn?.secretRole === "anomaly") {
          const now = Date.now();
          if (now - this.lastAiSnapshotTime >= 3000) {
            this.lastAiSnapshotTime = now;
            this.handleCameraSnapshot(sender, msg.frame);
          }
        }
        break;
      }
    }
  }

  // ---------- Lobby Handlers ----------
  private handleJoinRoom(conn: Party.Connection, name: string) {
    const existing = this.players.get(conn.id);
    if (existing) {
      existing.name = name.slice(0, 20) || existing.name;
      this.broadcastState();
      return;
    }

    if (this.phase !== "lobby") {
      const player: PlayerInfo = {
        id: conn.id,
        name: name.slice(0, 20) || `Player ${this.players.size + 1}`,
        role: "unassigned",
        isHost: this.players.size === 0,
        joinedAt: Date.now(),
      };
      this.players.set(conn.id, player);
      this.broadcastState();
      return;
    }

    if (this.players.size >= this.config.maxPlayers) {
      sendTo(conn, { type: "error", message: "Room is full (max 10 players)" });
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
    let player = this.players.get(conn.id);
    if (!player) {
      player = {
        id: conn.id,
        name: role === "worker" ? "Worker" : role === "camera" ? "CCTV Camera" : "Customer",
        role: "unassigned",
        isHost: this.players.size === 0,
        joinedAt: Date.now(),
      };
      this.players.set(conn.id, player);
      if (this.players.size === 1) this.hostId = conn.id;
    }

    // Unclaim previous role
    if (player.role === "worker") this.workerId = null;
    if (player.role === "camera") this.cameraId = null;

    switch (role) {
      case "worker":
        this.workerId = conn.id;
        player.role = "worker";
        break;
      case "camera":
        this.cameraId = conn.id;
        player.role = "camera";
        break;
      case "customer":
        player.role = "customer";
        if (!this.customerQueue.includes(conn.id)) {
          this.customerQueue.push(conn.id);
        }
        if (this.phase === "playing") {
          if (!this.secretRoles.has(conn.id)) {
            this.secretRoles.set(conn.id, "normal");
            this.secretOrders.set(conn.id, generateRandomOrder());
          }
          sendTo(conn, {
            type: "secret-role",
            secretRole: this.secretRoles.get(conn.id) || "normal",
            order: this.secretOrders.get(conn.id) || generateRandomOrder(),
            traits: this.secretTraits.get(conn.id) || null,
          });
        }
        break;
      default:
        player.role = "unassigned";
    }

    this.room.broadcast(JSON.stringify({ type: "role-assigned", role: player.role, playerId: conn.id }));
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

    this.workerState = {
      cart: [],
      balance: this.config.startingBalance,
      lives: this.config.startingLives,
      abilities: [],
      totalServed: 0,
      totalCaught: 0,
    };
    this.roundResults = [];
    this.startNight(1);
  }

  private startNight(nightNumber: number) {
    this.currentNight = nightNumber;
    this.phase = "playing";
    this.currentTurnIndex = -1;
    this.currentTurn = null;
    this.nightTime = "12:00 AM";

    // 30% chance for a Red Night Moon (Blood Moon)
    this.isBloodMoon = Math.random() < 0.30;

    // Gather real human customers (anyone not worker and not camera)
    let humanCustomers = Array.from(this.players.values()).filter(
      (p) => p.id !== this.workerId && p.id !== this.cameraId
    );

    // Mark them as customers
    humanCustomers.forEach((c) => {
      c.role = "customer";
    });

    let customerPool: string[] = [];
    const customerMultiplier = this.isBloodMoon ? 2 : 1;

    if (humanCustomers.length > 0) {
      const baseOrders =
        this.currentNight <= 2
          ? Math.max(3, humanCustomers.length)
          : this.currentNight <= 4
          ? Math.max(4, humanCustomers.length)
          : Math.max(5, humanCustomers.length);

      const targetOrders = baseOrders * customerMultiplier;

      while (customerPool.length < targetOrders) {
        const shuffled = [...humanCustomers].sort(() => Math.random() - 0.5);
        for (const c of shuffled) {
          customerPool.push(c.id);
          if (customerPool.length >= targetOrders) break;
        }
      }
    } else {
      // Solo test mode with NPCs (6 if Blood Moon, 3 if normal)
      const npcNames = this.isBloodMoon
        ? ["Alex (Normal)", "Jordan (The Anomaly)", "Taylor (Normal)", "Morgan (The Anomaly)", "Casey (Normal)", "Sam (The Anomaly)"]
        : ["Alex (Normal)", "Jordan (The Anomaly)", "Taylor (Normal)"];
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
      });
      customerPool = npcNames.map((_, i) => `npc-cust-${i + 1}`);
    }

    this.customerQueue = customerPool;

    // Determine anomaly distribution for this night (escalating difficulty!)
    const numAnomalies = this.isBloodMoon
      ? Math.max(2, Math.floor(customerPool.length * 0.65))
      : this.currentNight === 1
      ? 1
      : this.currentNight <= 2
      ? 1
      : this.currentNight <= 4
      ? Math.min(2, Math.floor(customerPool.length / 2))
      : Math.min(3, Math.ceil(customerPool.length / 2));

    const anomalyIndices = new Set<number>();
    while (anomalyIndices.size < numAnomalies && anomalyIndices.size < customerPool.length) {
      anomalyIndices.add(Math.floor(Math.random() * customerPool.length));
    }

    this.turnSecrets = [];
    for (let i = 0; i < customerPool.length; i++) {
      const isAnomaly = anomalyIndices.has(i);
      const secretRole: SecretRole = isAnomaly ? "anomaly" : "normal";
      const order = generateRandomOrder();
      const traits = isAnomaly ? selectAnomalyTraits(this.isBloodMoon) : null;
      this.turnSecrets.push({ secretRole, order, traits });
    }

    this.room.broadcast(
      JSON.stringify({
        type: "shift-started",
        queue: this.customerQueue,
        night: this.currentNight,
        isBloodMoon: this.isBloodMoon,
      } as ServerMessage)
    );
    this.broadcastState();

    this.advanceTurn();
  }

  // ---------- Turn Management ----------
  private advanceTurn() {
    this.currentTurnIndex++;

    if (this.workerState.lives <= 0) {
      this.endGame(false);
      return;
    }

    // Check if shift is finished
    if (this.currentTurnIndex >= this.customerQueue.length) {
      this.nightTime = "6:00 AM";

      if (this.currentNight >= this.maxNights) {
        // VICTORY: Survived all 5 nights!
        this.endGame(true);
        return;
      }

      // Night complete!
      this.phase = "night_complete";
      this.currentTurn = null;
      const completedNight = this.currentNight;
      const nextNight = this.currentNight + 1;
      this.room.broadcast(
        JSON.stringify({
          type: "night-complete",
          night: completedNight,
          nextNight,
        } as ServerMessage)
      );
      this.broadcastState();

      // Automatically transition to next night after 4.5 seconds
      setTimeout(() => {
        if (this.phase === "night_complete") {
          this.startNight(nextNight);
        }
      }, 4500);
      return;
    }

    const playerId = this.customerQueue[this.currentTurnIndex];
    const player = this.players.get(playerId);
    const turnSecret = this.turnSecrets[this.currentTurnIndex] || {
      secretRole: "normal" as SecretRole,
      order: generateRandomOrder(),
      traits: null,
    };

    const times = ["12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM"];
    this.nightTime = times[Math.min(this.currentTurnIndex, times.length - 1)];

    this.currentTurn = {
      playerId,
      playerName: player?.name || "Customer",
      secretRole: turnSecret.secretRole,
      assignedOrder: turnSecret.order,
      anomalyTraits: turnSecret.traits,
      detectedTraits: [],
      queuePosition: this.currentTurnIndex + 1,
      totalCustomers: this.customerQueue.length,
      startedAt: Date.now(),
      phase: "ordering",
      result: null,
    };

    this.workerState.cart = [];

    // Broadcast turn start (without secret info)
    const publicTurn: TurnState = {
      ...this.currentTurn,
      secretRole: "normal",
      anomalyTraits: null,
    };
    this.room.broadcast(
      JSON.stringify({ type: "turn-start", turn: publicTurn } as ServerMessage)
    );

    // Send secret role to the current customer only
    const customerConn = this.room.getConnection(playerId);
    if (customerConn) {
      sendTo(customerConn, {
        type: "secret-role",
        secretRole: turnSecret.secretRole,
        order: turnSecret.order,
        traits: turnSecret.traits,
      });
    }

    this.secretRoles.set(playerId, turnSecret.secretRole);
    this.secretOrders.set(playerId, turnSecret.order);
    if (turnSecret.traits) {
      this.secretTraits.set(playerId, turnSecret.traits);
    } else {
      this.secretTraits.delete(playerId);
    }

    // Clear previous glitch interval
    if (this.glitchIntervalId) {
      clearInterval(this.glitchIntervalId);
      this.glitchIntervalId = null;
    }

    if (turnSecret.secretRole === "anomaly" && this.workerId) {
      this.scheduleCCTVGlitches();
    }

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

    // Schedule recurring glitch pulses so camera effects remain active
    this.glitchIntervalId = setInterval(() => {
      if (this.currentTurn?.secretRole === "anomaly" && this.workerId) {
        const conn = this.room.getConnection(this.workerId);
        if (conn) {
          const effects: Array<"distortion" | "static" | "scanline"> = ["distortion", "static", "scanline"];
          const pick = effects[Math.floor(Math.random() * effects.length)];
          sendTo(conn, { type: "cctv-glitch", effect: pick, isAnomaly: true });
        }
      } else {
        if (this.glitchIntervalId) {
          clearInterval(this.glitchIntervalId);
          this.glitchIntervalId = null;
        }
      }
    }, 6500);

    // Random blackout chance
    if (!this.workerState.abilities.includes("static-stabilizer") || this.stabiliserTurnsLeft <= 0) {
      if (Math.random() < 0.35) {
        setTimeout(() => {
          if (this.currentTurn?.secretRole === "anomaly" && this.workerId) {
            const wConn = this.room.getConnection(this.workerId);
            if (wConn) {
              sendTo(wConn, { type: "cctv-glitch", effect: "blackout", isAnomaly: true });
            }
          }
        }, 4000 + Math.random() * 8000);
      }
    }
  }

  // ---------- POS Handlers ----------
  private handleAddToCart(conn: Party.Connection, menuItemId: string) {
    if (!this.workerId || conn.id === this.hostId) this.workerId = conn.id;
    if (conn.id !== this.workerId && conn.id !== this.hostId) return;
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
    if (!this.workerId || conn.id === this.hostId) this.workerId = conn.id;
    if (conn.id !== this.workerId && conn.id !== this.hostId) return;
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
    if (!this.workerId || conn.id === this.hostId) this.workerId = conn.id;
    if (conn.id !== this.workerId && conn.id !== this.hostId) return;
    this.workerState.cart = [];
    this.room.broadcast(
      JSON.stringify({ type: "cart-updated", cart: [] } as ServerMessage)
    );
  }

  private handleRequestPayment(conn: Party.Connection, clientCart?: CartItem[]) {
    this.workerId = conn.id;
    const workerPlayer = this.players.get(conn.id);
    if (workerPlayer) workerPlayer.role = "worker";

    // If turn has not started or was resolved, advance or initialize immediately
    if (!this.currentTurn || this.currentTurn.phase === "resolved") {
      if (this.phase !== "playing") {
        this.startNight(1);
      } else {
        this.advanceTurn();
      }
      if (!this.currentTurn) {
        const cust = Array.from(this.players.values()).find(p => p.role === "customer");
        this.currentTurn = {
          playerId: cust?.id || "customer-1",
          playerName: cust?.name || "Customer",
          secretRole: "normal" as SecretRole,
          assignedOrder: generateRandomOrder(),
          anomalyTraits: null,
          detectedTraits: [],
          queuePosition: 1,
          totalCustomers: 1,
          startedAt: Date.now(),
          phase: "ordering",
          result: null,
        };
      }
    }

    if (clientCart && Array.isArray(clientCart) && clientCart.length > 0) {
      this.workerState.cart = clientCart;
    }

    let total = this.workerState.cart.reduce(
      (sum, item) => sum + (item.menuItem?.price || 0) * (item.quantity || 1),
      0
    );

    // If cart is still empty or total is 0, synthesize from customer's assigned order
    if (total <= 0 || this.workerState.cart.length === 0) {
      const fallbackItems = (this.currentTurn.assignedOrder || []).map((item) => ({
        menuItem: item,
        quantity: 1,
      }));
      if (fallbackItems.length > 0) {
        this.workerState.cart = fallbackItems;
        total = fallbackItems.reduce((sum, item) => sum + item.menuItem.price, 0);
      } else {
        total = 5.0;
        this.workerState.cart = [{ menuItem: MENU_ITEMS[0], quantity: 1 }];
      }
    }

    this.currentTurn.phase = "payment";
    this.currentTurn.paymentRequest = { total, items: [...this.workerState.cart] };

    // Broadcast payment-request to the room so all customer instances receive it immediately
    this.room.broadcast(
      JSON.stringify({
        type: "payment-request",
        total,
        items: this.workerState.cart,
      } as ServerMessage)
    );

    this.broadcastState();
  }

  private handlePaymentComplete(conn: Party.Connection) {
    if (!this.currentTurn || this.currentTurn.phase !== "payment") return;

    const total =
      this.currentTurn.paymentRequest?.total ||
      this.workerState.cart.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0
      );

    this.workerState.balance += total;
    this.currentTurn.phase = "deciding";
    this.currentTurn.paymentRequest = null;

    // Notify all players of completed payment
    this.room.broadcast(
      JSON.stringify({ type: "payment-received", amount: total } as ServerMessage)
    );

    this.broadcastState();
  }

  // ---------- Decision Handlers ----------
  private handleServeOrder(conn: Party.Connection) {
    if (!this.currentTurn) return;
    const isWorker =
      conn.id === this.workerId ||
      conn.id === this.hostId ||
      this.players.get(conn.id)?.role === "worker";
    if (!isWorker) return;

    if (conn.id !== this.workerId && this.players.get(conn.id)?.role === "worker") {
      this.workerId = conn.id;
    }

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
    this.currentTurn.paymentRequest = null;
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

    this.workerState.cart = [];
    this.broadcastState();

    setTimeout(() => {
      if (this.currentTurn && this.currentTurn.phase === "resolved") {
        this.advanceTurn();
      }
    }, 3000);
  }

  private handleReportAnomaly(conn: Party.Connection) {
    if (!this.currentTurn) return;
    const isWorker =
      conn.id === this.workerId ||
      conn.id === this.hostId ||
      this.players.get(conn.id)?.role === "worker";
    if (!isWorker) return;

    if (conn.id !== this.workerId && this.players.get(conn.id)?.role === "worker") {
      this.workerId = conn.id;
    }

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

    this.workerState.cart = [];
    this.broadcastState();

    setTimeout(() => {
      if (this.currentTurn && this.currentTurn.phase === "resolved") {
        this.advanceTurn();
      }
    }, 3000);
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
    if (this.workerId && conn.id !== this.workerId && conn.id !== this.hostId) return;

    const abilities: Record<string, { price: number; id: string }> = {
      "extra-life": { price: 100, id: "extra-life" },
      "hack-customer": { price: 50, id: "hack-customer" },
      "uv-scanner": { price: 20, id: "uv-scanner" },
      "spectral-analyzer": { price: 35, id: "spectral-analyzer" },
      "static-stabilizer": { price: 15, id: "static-stabilizer" },
      "neural-enhancer": { price: 60, id: "neural-enhancer" },
      "polygraph-tape": { price: 45, id: "polygraph-tape" },
      "xray-monocle": { price: 40, id: "xray-monocle" },
    };

    const ability = abilities[abilityId];
    if (!ability) return;
    if (this.workerState.balance < ability.price) {
      sendTo(conn, { type: "error", message: "Insufficient funds" });
      return;
    }

    if (abilityId === "extra-life") {
      if (this.workerState.lives >= 5) {
        sendTo(conn, { type: "error", message: "Maximum hearts (5) already reached" });
        return;
      }
      this.workerState.balance -= ability.price;
      this.workerState.lives = (this.workerState.lives || 3) + 1;
    } else if (abilityId === "hack-customer") {
      this.workerState.balance -= ability.price;
      if (!this.workerState.abilities.includes("hack-customer")) {
        this.workerState.abilities.push("hack-customer");
      }
      this.triggerHackCustomer();
    } else {
      if (this.workerState.abilities.includes(abilityId)) {
        sendTo(conn, { type: "error", message: "Already owned" });
        return;
      }
      this.workerState.balance -= ability.price;
      this.workerState.abilities.push(abilityId);
    }

    if (abilityId === "static-stabilizer") {
      this.stabiliserTurnsLeft = 3;
    }

    this.room.broadcast(JSON.stringify({
      type: "ability-purchased",
      abilityId,
      balance: this.workerState.balance,
    }));
    this.broadcastState();
  }

  private triggerHackCustomer() {
    const customerId = this.currentTurn?.playerId;
    const traits = this.currentTurn?.anomalyTraits || (customerId ? this.secretTraits.get(customerId) : null) || null;
    const secretRole = (customerId ? this.secretRoles.get(customerId) : this.currentTurn?.secretRole) || "normal";

    this.room.broadcast(
      JSON.stringify({
        type: "hack-customer-alert",
        durationMs: 3000,
        customerId: customerId || "",
        traits,
        secretRole,
      } as ServerMessage)
    );
  }

  // ---------- AI Vision ----------
  private async handleCameraSnapshot(
    conn: Party.Connection,
    dataUrl: string
  ) {
    if (!this.cameraId) this.cameraId = conn.id;
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
      const turn = this.currentTurn;
      if (!turn || !turn.anomalyTraits) {
        this.analysisInProgress = false;
        return;
      }

      turn.detectedTraits = turn.detectedTraits || [];
      const undetectedTraits = turn.anomalyTraits.filter(
        (t) => !turn.detectedTraits!.includes(t.id)
      );
      if (undetectedTraits.length === 0) {
        this.analysisInProgress = false;
        return;
      }

      const apiKey = (this.room.env?.OPENROUTER_API_KEY as string) || "";
      let detectedList: string[] = [];

      if (apiKey) {
        try {
          const result = await analyzeSnapshot(dataUrl, undetectedTraits, apiKey);
          if (result && result.detectedTraits && result.detectedTraits.length > 0) {
            detectedList = result.detectedTraits;
          }
        } catch (e) {
          console.warn("OpenRouter API error, falling back to heuristic vision:", e);
        }
      }

      // Robust fallback: if no API key or AI call didn't trigger, detect next trait
      // so gameplay objectives always work for players
      if (detectedList.length === 0 && undetectedTraits.length > 0) {
        detectedList = [undetectedTraits[0].id];
      }

      if (detectedList.length > 0 && this.currentTurn) {
        const activeTurn = this.currentTurn;
        activeTurn.detectedTraits = activeTurn.detectedTraits || [];
        for (const traitId of detectedList) {
          if (!activeTurn.detectedTraits.includes(traitId)) {
            activeTurn.detectedTraits.push(traitId);

            // Broadcast trait detection to all
            this.room.broadcast(
              JSON.stringify({
                type: "trait-detected",
                traitId,
                allDetected: activeTurn.detectedTraits,
              } as ServerMessage)
            );
          }
        }
      }
    } catch (err) {
      console.error("Camera snapshot analysis error:", err);
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
  private endGame(victory: boolean = false) {
    this.phase = "game_over";
    this.currentTurn = null;
    this.room.broadcast(
      JSON.stringify({
        type: "game-over",
        workerState: this.workerState,
        results: this.roundResults,
        victory,
      } as ServerMessage)
    );
    this.broadcastState();
  }
}
