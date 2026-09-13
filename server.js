import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

const PORT = process.env.PORT || 1999;

// ============================================
// Constants
// ============================================
const MENU_ITEMS = [
  { id: "mcscreamer", name: "McScreamer Burger", price: 5, emoji: "🍔" },
  { id: "shadow-fries", name: "Shadow Fries", price: 3, emoji: "🍟" },
  { id: "cryptic-soda", name: "Cryptic Soda", price: 2, emoji: "🥤" },
  { id: "anomaly-nugs", name: "Anomaly Nuggets", price: 4, emoji: "🍗" },
  { id: "gloom-shake", name: "Gloom Shake", price: 4, emoji: "🥛" },
];

const ANOMALY_TRAITS = [
  { id: "no-blink", display: "Never blink while ordering — keep your eyes wide open the entire time", category: "facial" },
  { id: "unnatural-grin", display: "Maintain an unnaturally wide grin when staring at the camera", category: "facial" },
  { id: "dead-stare", display: "Stare directly at the camera with a completely blank, emotionless expression", category: "facial" },
  { id: "slow-blink", display: "Blink extremely slowly — each blink should take 2-3 full seconds", category: "facial" },
  { id: "head-tilt-left", display: "Tilt your head 45° to the left when mentioning fries", category: "postural" },
  { id: "head-tilt-right", display: "Slowly tilt your head to the right during the entire order", category: "postural" },
  { id: "look-ceiling", display: "Slowly look up at the ceiling mid-sentence and hold the gaze for 3 seconds", category: "postural" },
  { id: "lean-forward", display: "Lean uncomfortably close toward the counter/camera", category: "postural" },
  { id: "sway-side", display: "Slowly sway your body side to side while speaking", category: "postural" },
  { id: "tap-counter", display: "Tap the counter rhythmically three times in a row", category: "gestural" },
  { id: "point-camera", display: "Slowly raise your hand and point directly at the camera", category: "gestural" },
  { id: "wave-slow", display: "Give a very slow, creepy wave at the camera mid-order", category: "gestural" },
  { id: "hands-clasped", display: "Keep both hands clasped together tightly in front of you", category: "gestural" },
  { id: "freeze", display: "Remain completely frozen and motionless for 5 full seconds mid-order", category: "behavioral" },
  { id: "turn-away", display: "Suddenly turn your head to look behind you as if someone called your name", category: "behavioral" },
  { id: "cover-mouth", display: "Cover your mouth with your hand while speaking your order", category: "behavioral" },
];

function generateRandomOrder() {
  const count = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...MENU_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function selectAnomalyTraits() {
  const count = 1 + Math.floor(Math.random() * 2);
  const shuffled = [...ANOMALY_TRAITS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================
// Game Room State Machine
// ============================================
class GameRoom {
  constructor(code) {
    this.code = code;
    this.connections = new Map(); // id -> ws
    this.phase = "lobby";
    this.hostId = null;
    this.players = new Map(); // id -> PlayerInfo
    this.workerId = null;
    this.cameraId = null;
    this.customerQueue = [];
    this.currentTurnIndex = -1;
    this.currentTurn = null;
    this.workerState = {
      cart: [],
      balance: 0,
      lives: 3,
      abilities: [],
      totalServed: 0,
      totalCaught: 0,
    };
    this.roundResults = [];
    this.secretRoles = new Map();
    this.secretTraits = new Map();
    this.secretOrders = new Map();
    this.disconnectTimers = new Map();
    this.currentNight = 1;
    this.maxNights = 5;
    this.nightTime = "12:00 AM";
    this.turnSecrets = [];
  }

  getPublicState() {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId || "",
      players: Array.from(this.players.values()),
      workerId: this.workerId,
      cameraId: this.cameraId,
      customerQueue: this.customerQueue || [],
      currentTurnIndex: this.currentTurnIndex,
      currentTurn: this.currentTurn,
      workerState: this.workerState,
      roundResults: this.roundResults || [],
      config: { maxPlayers: 10, anomalyProbability: 0.35, minAnomalies: 1, maxAnomalyRatio: 0.5, turnTimeLimit: 0, startingLives: 3, startingBalance: 0 },
      currentNight: this.currentNight || 1,
      maxNights: this.maxNights || 5,
      nightTime: this.nightTime || "12:00 AM",
    };
  }

  broadcast(data, withoutId = null) {
    const raw = typeof data === "string" ? data : JSON.stringify(data);
    for (const [id, ws] of this.connections.entries()) {
      if (id !== withoutId && ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  }

  broadcastState() {
    const state = this.getPublicState();
    this.broadcast({ type: "room-state", state });
  }

  addConnection(id, ws) {
    // Clear any pending disconnect timer for this player ID
    if (this.disconnectTimers.has(id)) {
      clearTimeout(this.disconnectTimers.get(id));
      this.disconnectTimers.delete(id);
    }

    this.connections.set(id, ws);

    // If reconnecting player had a role, restore it
    const existing = this.players.get(id);
    if (existing) {
      if (existing.role === "worker") this.workerId = id;
      if (existing.role === "camera") this.cameraId = id;
    }

    // Send welcome and state
    ws.send(JSON.stringify({ type: "welcome", connectionId: id }));
    ws.send(JSON.stringify({ type: "room-state", state: this.getPublicState(), selfId: id }));

    // If shift is active, send secret role info immediately
    if (this.phase === "playing") {
      const secretRole = this.secretRoles.get(id) || (this.currentTurn?.playerId === id ? this.secretRoles.get(this.currentTurn.playerId) : "normal");
      const order = this.secretOrders.get(id) || (this.currentTurn?.playerId === id ? this.secretOrders.get(this.currentTurn.playerId) : generateRandomOrder());
      const traits = this.secretTraits.get(id) || (this.currentTurn?.playerId === id ? this.secretTraits.get(this.currentTurn.playerId) : null);

      ws.send(JSON.stringify({
        type: "secret-role",
        secretRole: secretRole || "normal",
        order: order || generateRandomOrder(),
        traits: traits || null,
      }));
    }

    ws.on("message", (raw) => this.handleMessage(id, raw));
    ws.on("close", () => this.removeConnection(id));
  }

  removeConnection(id) {
    this.connections.delete(id);

    // Grace timer: don't immediately wipe out player during page transitions or temporary drops
    const timer = setTimeout(() => {
      if (!this.connections.has(id)) {
        if (this.workerId === id) this.workerId = null;
        if (this.cameraId === id) this.cameraId = null;
        this.players.delete(id);

        if (this.hostId === id) {
          const remaining = Array.from(this.players.values());
          if (remaining.length > 0) {
            this.hostId = remaining[0].id;
            remaining[0].isHost = true;
          }
        }

        this.broadcastState();
      }
      this.disconnectTimers.delete(id);
    }, 25000);

    this.disconnectTimers.set(id, timer);
  }

  handleMessage(id, raw) {
    const ws = this.connections.get(id);
    if (!ws) return;

    if (typeof raw !== "string" && !Buffer.isBuffer(raw)) return;

    // Handle binary video fallback stream
    if (Buffer.isBuffer(raw) && raw.length > 0 && raw[0] !== 123 /* not '{' */) {
      if (this.workerId) {
        const workerWs = this.connections.get(this.workerId);
        if (workerWs && workerWs.readyState === WebSocket.OPEN) {
          workerWs.send(raw);
        }
      }
      for (const [connId, clientWs] of this.connections.entries()) {
        if (connId !== id && connId !== this.workerId && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(raw);
        }
      }
      return;
    }

    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "join-room": {
        const isFirst = this.players.size === 0;
        const player = {
          id,
          name: (msg.name || "Player").slice(0, 20),
          role: "unassigned",
          isHost: isFirst,
          joinedAt: Date.now(),
        };
        if (isFirst) this.hostId = id;
        this.players.set(id, player);
        this.broadcastState();
        break;
      }

      case "claim-role": {
        let player = this.players.get(id);
        if (!player) {
          player = {
            id,
            name: msg.role === "worker" ? "Worker" : msg.role === "camera" ? "CCTV Camera" : "Customer",
            role: "unassigned",
            isHost: this.players.size === 0,
            joinedAt: Date.now(),
          };
          this.players.set(id, player);
          if (this.players.size === 1) this.hostId = id;
        }

        if (player.role === "worker") this.workerId = null;
        if (player.role === "camera") this.cameraId = null;

        if (msg.role === "worker") {
          this.workerId = id;
          player.role = "worker";
        } else if (msg.role === "camera") {
          this.cameraId = id;
          player.role = "camera";
        } else if (msg.role === "customer") {
          player.role = "customer";
          if (!this.customerQueue.includes(id)) {
            this.customerQueue.push(id);
          }
          if (this.phase === "playing") {
            if (!this.secretRoles.has(id)) {
              this.secretRoles.set(id, "normal");
              this.secretOrders.set(id, generateRandomOrder());
            }
            const clientWs = this.connections.get(id);
            if (clientWs && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "secret-role",
                secretRole: this.secretRoles.get(id) || "normal",
                order: this.secretOrders.get(id) || generateRandomOrder(),
                traits: this.secretTraits.get(id) || null,
              }));
            }
          }
        } else {
          player.role = "unassigned";
        }

        this.broadcast({ type: "role-assigned", role: player.role, playerId: id });
        this.broadcastState();
        break;
      }

      case "start-shift": {
        if (id !== this.hostId) return;

        // Auto assign practice roles if testing solo
        if (msg.practiceMode || !this.workerId) {
          if (!this.workerId) {
            this.workerId = id;
            const p = this.players.get(id);
            if (p) p.role = "worker";
          }
          if (!this.cameraId) this.cameraId = id;
        }

        this.workerState = { cart: [], balance: 0, lives: 3, abilities: [], totalServed: 0, totalCaught: 0 };
        this.startNight(1);
        break;
      }

      case "start-next-night": {
        if (this.phase === "night_complete" && this.currentNight < this.maxNights) {
          this.startNight(this.currentNight + 1);
        }
        break;
      }

      case "add-to-cart": {
        const item = MENU_ITEMS.find((m) => m.id === msg.menuItemId);
        if (!item) return;
        const existing = this.workerState.cart.find((c) => c.menuItem.id === item.id);
        if (existing) existing.quantity++;
        else this.workerState.cart.push({ menuItem: item, quantity: 1 });
        this.broadcast({ type: "cart-updated", cart: this.workerState.cart });
        this.broadcastState();
        break;
      }

      case "remove-from-cart": {
        const idx = this.workerState.cart.findIndex((c) => c.menuItem.id === msg.menuItemId);
        if (idx !== -1) {
          if (this.workerState.cart[idx].quantity > 1) this.workerState.cart[idx].quantity--;
          else this.workerState.cart.splice(idx, 1);
        }
        this.broadcast({ type: "cart-updated", cart: this.workerState.cart });
        this.broadcastState();
        break;
      }

      case "clear-cart": {
        this.workerState.cart = [];
        this.broadcast({ type: "cart-updated", cart: [] });
        this.broadcastState();
        break;
      }

      case "request-payment": {
        const total = this.workerState.cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
        this.broadcast({ type: "payment-request", total, items: this.workerState.cart });
        break;
      }

      case "payment-complete": {
        const total = this.workerState.cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
        this.workerState.balance += total;
        this.broadcast({ type: "payment-received", amount: total });
        this.broadcastState();
        break;
      }

      case "serve-order": {
        if (!this.currentTurn) return;
        const isAnomaly = this.secretRoles.get(this.currentTurn.playerId) === "anomaly";
        const result = isAnomaly
          ? { type: "served_anomaly", pointsAwarded: -20, penalty: 20, message: "YOU SERVED AN ANOMALY!", isAnomaly: true }
          : { type: "served_normal", pointsAwarded: 15, message: "Order served accurately to normal customer.", isAnomaly: false };

        if (isAnomaly) this.workerState.lives--;
        else this.workerState.totalServed++;

        this.currentTurn.phase = "resolved";
        this.currentTurn.result = result;
        this.workerState.cart = [];
        this.broadcast({ type: "serve-result", result });
        this.broadcastState();

        setTimeout(() => {
          if (this.currentTurn && this.currentTurn.phase === "resolved") {
            this.advanceTurn();
          }
        }, 3000);
        break;
      }

      case "report-anomaly": {
        if (!this.currentTurn) return;
        const isAnomaly = this.secretRoles.get(this.currentTurn.playerId) === "anomaly";
        const result = isAnomaly
          ? { type: "reported_anomaly", pointsAwarded: 25, message: "ANOMALY IDENTIFIED! Neutralized successfully.", isAnomaly: true }
          : { type: "reported_innocent", pointsAwarded: -15, penalty: 15, message: "Wrongful accusation! Innocent customer ejected.", isAnomaly: false };

        if (isAnomaly) this.workerState.totalCaught++;
        else this.workerState.lives--;

        this.currentTurn.phase = "resolved";
        this.currentTurn.result = result;
        this.workerState.cart = [];
        this.broadcast({ type: "report-result", result });
        this.broadcastState();

        setTimeout(() => {
          if (this.currentTurn && this.currentTurn.phase === "resolved") {
            this.advanceTurn();
          }
        }, 3000);
        break;
      }

      case "next-customer": {
        this.advanceTurn();
        break;
      }

      // WebRTC and fallback routing
      case "camera-ready": {
        this.cameraId = id;
        this.broadcast({ type: "camera-ready" });
        break;
      }

      case "viewer-join": {
        if (this.cameraId) {
          const cam = this.connections.get(this.cameraId);
          if (cam && cam.readyState === WebSocket.OPEN) {
            cam.send(JSON.stringify({ type: "viewer-join", viewerId: msg.viewerId || id }));
          }
        }
        break;
      }

      case "offer":
      case "answer":
      case "ice-candidate": {
        const targetId = msg.viewerId || (id === this.cameraId ? this.workerId : this.cameraId);
        if (targetId) {
          const target = this.connections.get(targetId);
          if (target && target.readyState === WebSocket.OPEN) {
            target.send(JSON.stringify(msg));
          }
        }
        break;
      }

      case "cctv-frame": {
        if (this.workerId) {
          const worker = this.connections.get(this.workerId);
          if (worker && worker.readyState === WebSocket.OPEN) {
            worker.send(JSON.stringify({ type: "cctv-frame", frame: msg.frame }));
          }
        }
        for (const [connId, client] of this.connections.entries()) {
          if (connId !== id && connId !== this.workerId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "cctv-frame", frame: msg.frame }));
          }
        }
        break;
      }

      case "camera-snapshot": {
        if (!this.currentTurn || this.currentTurn.secretRole !== "anomaly") break;
        if (!this.currentTurn.anomalyTraits) break;

        const turn = this.currentTurn;
        turn.detectedTraits = turn.detectedTraits || [];
        const undetectedTraits = turn.anomalyTraits.filter(
          (t) => !turn.detectedTraits.includes(t.id)
        );
        if (undetectedTraits.length === 0) break;

        const now = Date.now();
        if (this.lastAnalysisTime && now - this.lastAnalysisTime < 2500) break;
        this.lastAnalysisTime = now;

        // Detect next assigned anomaly trait
        const nextTrait = undetectedTraits[0];
        turn.detectedTraits.push(nextTrait.id);

        this.broadcast({
          type: "trait-detected",
          traitId: nextTrait.id,
          allDetected: turn.detectedTraits,
        });
        break;
      }
    }
  }

  startNight(nightNumber) {
    this.currentNight = nightNumber;
    this.phase = "playing";
    this.currentTurnIndex = -1;
    this.nightTime = "12:00 AM";

    // Gather all real human customers in the room (anyone who is not worker and not camera)
    let humanCustomers = Array.from(this.players.values()).filter(
      (p) => p.id !== this.workerId && p.id !== this.cameraId
    );

    // Ensure all non-worker non-camera human players have role customer
    humanCustomers.forEach((c) => {
      c.role = "customer";
    });

    let customerPool = [];
    if (humanCustomers.length > 0) {
      // Repeat customers so there are multiple visits per night:
      // If 1 customer: 3 visits in Night 1-2, 4 visits in Night 3-4, 5 visits in Night 5
      // If 2 customers: 4 visits total (2 each)
      // If 3+ customers: each visits at least once, plus repeat visits
      const targetOrders =
        this.currentNight <= 2
          ? Math.max(3, humanCustomers.length)
          : this.currentNight <= 4
          ? Math.max(4, humanCustomers.length)
          : Math.max(5, humanCustomers.length);

      while (customerPool.length < targetOrders) {
        const shuffled = [...humanCustomers].sort(() => Math.random() - 0.5);
        for (const c of shuffled) {
          customerPool.push(c.id);
          if (customerPool.length >= targetOrders) break;
        }
      }
    } else {
      // Solo test mode with NPCs
      const npcs = ["Alex (Normal)", "Jordan (The Anomaly)", "Taylor (Normal)"];
      npcs.forEach((name, i) => {
        const dummyId = `npc-${i + 1}`;
        const dummyPlayer = {
          id: dummyId,
          name,
          role: "customer",
          isHost: false,
          joinedAt: Date.now(),
        };
        this.players.set(dummyId, dummyPlayer);
      });
      customerPool = ["npc-1", "npc-2", "npc-3"];
    }

    this.customerQueue = customerPool;

    // Determine anomaly count for this night (escalating difficulty!)
    const numAnomalies =
      this.currentNight === 1
        ? 1
        : this.currentNight <= 2
        ? 1
        : this.currentNight <= 4
        ? Math.min(2, Math.floor(customerPool.length / 2))
        : Math.min(3, Math.ceil(customerPool.length / 2));

    const anomalyIndices = new Set();
    while (anomalyIndices.size < numAnomalies) {
      anomalyIndices.add(Math.floor(Math.random() * customerPool.length));
    }

    this.turnSecrets = [];
    for (let i = 0; i < customerPool.length; i++) {
      const isAnomaly = anomalyIndices.has(i);
      const secretRole = isAnomaly ? "anomaly" : "normal";
      const order = generateRandomOrder();
      const traits = isAnomaly ? selectAnomalyTraits() : null;
      this.turnSecrets.push({ secretRole, order, traits });
    }

    this.broadcast({
      type: "shift-started",
      queue: this.customerQueue,
      night: this.currentNight,
    });
    this.advanceTurn();
  }

  advanceTurn() {
    this.currentTurnIndex++;

    // Check if worker died
    if (this.workerState.lives <= 0) {
      this.phase = "game_over";
      this.currentTurn = null;
      this.broadcast({
        type: "game-over",
        workerState: this.workerState,
        results: this.roundResults,
        victory: false,
      });
      this.broadcastState();
      return;
    }

    // Check if shift is finished
    if (this.currentTurnIndex >= this.customerQueue.length) {
      this.nightTime = "6:00 AM";

      if (this.currentNight >= this.maxNights) {
        // VICTORY: Survived all 5 nights!
        this.phase = "game_over";
        this.currentTurn = null;
        this.broadcast({
          type: "game-over",
          workerState: this.workerState,
          results: this.roundResults,
          victory: true,
        });
        this.broadcastState();
        return;
      }

      // Night survived! Advance to next night!
      this.phase = "night_complete";
      this.currentTurn = null;
      const completedNight = this.currentNight;
      const nextNight = this.currentNight + 1;
      this.broadcast({
        type: "night-complete",
        night: completedNight,
        nextNight,
      });
      this.broadcastState();

      // Automatically transition to next night after 4.5 seconds
      setTimeout(() => {
        if (this.phase === "night_complete") {
          this.startNight(nextNight);
        }
      }, 4500);
      return;
    }

    // Active customer turn
    const playerId = this.customerQueue[this.currentTurnIndex];
    const player = this.players.get(playerId);
    const turnSecret = this.turnSecrets[this.currentTurnIndex] || {
      secretRole: "normal",
      order: generateRandomOrder(),
      traits: null,
    };

    const times = ["12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM"];
    this.nightTime = times[Math.min(this.currentTurnIndex, times.length - 1)];

    this.currentTurn = {
      playerId,
      playerName: player ? player.name : "Customer",
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

    this.broadcast({ type: "turn-start", turn: this.currentTurn });

    // Send secret role to current customer
    const custWs = this.connections.get(playerId);
    if (custWs && custWs.readyState === WebSocket.OPEN) {
      custWs.send(
        JSON.stringify({
          type: "secret-role",
          secretRole: turnSecret.secretRole,
          order: turnSecret.order,
          traits: turnSecret.traits,
        })
      );
    }

    // Update secret role maps for reconnects
    this.secretRoles.set(playerId, turnSecret.secretRole);
    this.secretOrders.set(playerId, turnSecret.order);
    this.secretTraits.set(playerId, turnSecret.traits);

    // Trigger CCTV glitch if anomaly
    if (turnSecret.secretRole === "anomaly") {
      setTimeout(() => {
        this.broadcast({
          type: "cctv-glitch",
          effect: "distortion",
          isAnomaly: true,
        });
      }, 3500);
    }

    this.broadcastState();
  }
}

// ============================================
// HTTP & WebSocket Server Setup
// ============================================
const rooms = new Map(); // code -> GameRoom

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", game: "WcDonald's: The Anomaly", rooms: rooms.size }));
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  // Match /party/WCD-XXXX or /parties/main/WCD-XXXX
  const match = url.pathname.match(/\/(?:party|parties\/main)\/([^/]+)/);
  const roomCode = match ? match[1] : url.searchParams.get("room") || "WCD-ROOM";
  const connId = url.searchParams.get("_pk") || url.searchParams.get("id") || randomUUID();

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, roomCode, connId);
  });
});

wss.on("connection", (ws, req, roomCode, customConnId) => {
  let room = rooms.get(roomCode);
  if (!room) {
    room = new GameRoom(roomCode);
    rooms.set(roomCode, room);
  }

  const connId = customConnId || randomUUID();
  room.addConnection(connId, ws);

  ws.on("close", () => {
    if (room.connections.size === 0) {
      setTimeout(() => {
        if (room.connections.size === 0) {
          rooms.delete(roomCode);
        }
      }, 60000);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🍔 WcDonald's Game Server listening on port ${PORT}`);
});
