import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

const PORT = process.env.PORT || 1999;

// ============================================
// Constants
// ============================================
const MENU_ITEMS = [
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

const ANOMALY_TRAITS = [
  // Easy
  { id: "tongue-out", display: "Stick your tongue out slightly or bite your tongue while placing your order", category: "facial", difficulty: "easy" },
  { id: "wink-loop", display: "Wink repeatedly with one eye while speaking to the worker", category: "facial", difficulty: "easy" },
  { id: "scratch-nose", display: "Scratch or pinch your nose repeatedly while ordering", category: "gestural", difficulty: "easy" },
  { id: "cover-one-eye", display: "Cover one eye completely with your hand while looking at the camera", category: "gestural", difficulty: "easy" },
  { id: "nod-rapid", display: "Nod your head up and down continuously like a bobblehead", category: "postural", difficulty: "easy" },
  { id: "head-shake-no", display: "Shake your head left to right as if saying 'no' while ordering your food", category: "postural", difficulty: "easy" },
  { id: "peace-sign", display: "Hold up a peace / V sign with your fingers near your face", category: "gestural", difficulty: "easy" },
  { id: "thumbs-up", display: "Give a steady thumbs-up toward the camera lens during the order", category: "gestural", difficulty: "easy" },
  { id: "scratch-head", display: "Scratch the top of your head with your fingertips", category: "gestural", difficulty: "easy" },
  { id: "hand-on-cheek", display: "Rest your cheek against your open palm or fist while looking forward", category: "postural", difficulty: "easy" },

  // Medium
  { id: "no-blink", display: "Never blink while ordering — keep your eyes wide open the entire time", category: "facial", difficulty: "medium" },
  { id: "unnatural-grin", display: "Maintain an unnaturally wide grin when staring at the camera", category: "facial", difficulty: "medium" },
  { id: "dead-stare", display: "Stare directly at the camera with a completely blank, emotionless expression", category: "facial", difficulty: "medium" },
  { id: "slow-blink", display: "Blink extremely slowly — each blink should take 2-3 full seconds", category: "facial", difficulty: "medium" },
  { id: "head-tilt-left", display: "Tilt your head 45° to the left when mentioning fries", category: "postural", difficulty: "medium" },
  { id: "head-tilt-right", display: "Slowly tilt your head to the right during the entire order", category: "postural", difficulty: "medium" },
  { id: "point-camera", display: "Slowly raise your hand and point directly at the camera", category: "gestural", difficulty: "medium" },
  { id: "wave-slow", display: "Give a very slow, creepy wave at the camera mid-order", category: "gestural", difficulty: "medium" },
  { id: "cover-mouth", display: "Cover your mouth with your hand while speaking your order", category: "behavioral", difficulty: "medium" },

  // Hard
  { id: "look-ceiling", display: "Slowly look up at the ceiling mid-sentence and hold the gaze for 3 seconds", category: "postural", difficulty: "hard" },
  { id: "lean-forward", display: "Lean uncomfortably close toward the counter/camera", category: "postural", difficulty: "hard" },
  { id: "sway-side", display: "Slowly sway your body side to side while speaking", category: "postural", difficulty: "hard" },
  { id: "tap-counter", display: "Tap the counter rhythmically three times in a row", category: "gestural", difficulty: "hard" },
  { id: "hands-clasped", display: "Keep both hands clasped together tightly in front of you", category: "gestural", difficulty: "hard" },
  { id: "freeze", display: "Remain completely frozen and motionless for 5 full seconds mid-order", category: "behavioral", difficulty: "hard" },
  { id: "turn-away", display: "Suddenly turn your head to look behind you as if someone called your name", category: "behavioral", difficulty: "hard" },
];

function generateRandomOrder() {
  const mains = MENU_ITEMS.filter((i) => i.category === "burgers" || i.category === "chicken");
  const sides = MENU_ITEMS.filter((i) => i.category === "sides");
  const drinks = MENU_ITEMS.filter((i) => i.category === "drinks");
  const desserts = MENU_ITEMS.filter((i) => i.category === "desserts");

  const roll = Math.random();
  const order = [];

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

function selectAnomalyTraits(isHardMode = false) {
  const easyTraits = ANOMALY_TRAITS.filter((t) => t.difficulty === "easy");
  const otherTraits = ANOMALY_TRAITS.filter((t) => t.difficulty !== "easy");
  const count = 2 + Math.floor(Math.random() * 2);
  const selected = [];

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
    this.lastAiSnapshotTime = 0;
    this.workerState = {
      cart: [],
      balance: 250,
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
    this.isBloodMoon = false;
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
      config: { maxPlayers: 10, anomalyProbability: 0.35, minAnomalies: 1, maxAnomalyRatio: 0.5, turnTimeLimit: 0, startingLives: 3, startingBalance: 250 },
      currentNight: this.currentNight || 1,
      maxNights: this.maxNights || 5,
      nightTime: this.nightTime || "12:00 AM",
      isBloodMoon: Boolean(this.isBloodMoon),
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
      let workerWs = this.workerId ? this.connections.get(this.workerId) : null;
      if (!workerWs || workerWs.readyState !== WebSocket.OPEN) {
        for (const [connId, clientWs] of this.connections.entries()) {
          const player = this.players.get(connId);
          if (player && player.role === "worker" && clientWs.readyState === WebSocket.OPEN) {
            this.workerId = connId;
            workerWs = clientWs;
            break;
          }
        }
      }
      if (workerWs && workerWs.readyState === WebSocket.OPEN) {
        workerWs.send(raw);
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

        this.workerState = { cart: [], balance: this.workerState.balance > 0 ? this.workerState.balance : 250, lives: 3, abilities: [], totalServed: 0, totalCaught: 0 };
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
        this.workerId = id;
        const workerPlayer = this.players.get(id);
        if (workerPlayer) workerPlayer.role = "worker";

        // If turn has not started or was resolved, advance or initialize immediately
        if (!this.currentTurn || this.currentTurn.phase === "resolved") {
          if (this.phase !== "playing") {
            this.startNight(1);
          } else {
            this.advanceTurn();
          }
          if (!this.currentTurn) {
            const cust = Array.from(this.players.values()).find((p) => p.role === "customer");
            this.currentTurn = {
              playerId: cust?.id || "customer-1",
              playerName: cust?.name || "Customer",
              secretRole: "normal",
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

        if (msg.cart && Array.isArray(msg.cart) && msg.cart.length > 0) {
          this.workerState.cart = msg.cart;
        }

        let total = this.workerState.cart.reduce((s, i) => s + (i.menuItem?.price || 0) * (i.quantity || 1), 0);
        if (total <= 0 || this.workerState.cart.length === 0) {
          const fallback = (this.currentTurn?.assignedOrder || []).map((item) => ({
            menuItem: item,
            quantity: 1,
          }));
          if (fallback.length > 0) {
            this.workerState.cart = fallback;
            total = fallback.reduce((s, i) => s + i.menuItem.price, 0);
          } else {
            total = 5.0;
            this.workerState.cart = [{ menuItem: MENU_ITEMS[0], quantity: 1 }];
          }
        }

        this.currentTurn.phase = "payment";
        this.currentTurn.paymentRequest = { total, items: [...this.workerState.cart] };
        this.broadcast({ type: "payment-request", total, items: this.workerState.cart });
        this.broadcastState();
        break;
      }

      case "payment-complete": {
        if (!this.currentTurn || this.currentTurn.phase !== "payment") break;
        const total =
          this.currentTurn.paymentRequest?.total ||
          this.workerState.cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
        this.workerState.balance += total;
        this.currentTurn.phase = "deciding";
        this.currentTurn.paymentRequest = null;
        this.broadcast({ type: "payment-received", amount: total });
        this.broadcastState();
        break;
      }

      case "serve-order": {
        if (!this.currentTurn) return;
        const isAnomaly = this.secretRoles.get(this.currentTurn.playerId) === "anomaly";
        const multiplier = this.isBloodMoon ? 2 : 1;
        const result = isAnomaly
          ? { type: "served_anomaly", pointsAwarded: -20, penalty: 20, message: "YOU SERVED AN ANOMALY!", isAnomaly: true }
          : { type: "served_normal", pointsAwarded: 15 * multiplier, message: `Order served accurately! (+${15 * multiplier} coins)`, isAnomaly: false };

        if (isAnomaly) this.workerState.lives--;
        else {
          this.workerState.totalServed++;
          this.workerState.balance += 15 * multiplier;
        }

        this.currentTurn.phase = "resolved";
        this.currentTurn.result = result;
        this.currentTurn.paymentRequest = null;
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
        const multiplier = this.isBloodMoon ? 2 : 1;
        const result = isAnomaly
          ? { type: "reported_anomaly", pointsAwarded: 25 * multiplier, message: `ANOMALY IDENTIFIED! (+${25 * multiplier} coins)`, isAnomaly: true }
          : { type: "reported_innocent", pointsAwarded: -15, penalty: 15, message: "Wrongful accusation! Innocent customer ejected.", isAnomaly: false };

        if (isAnomaly) {
          this.workerState.totalCaught++;
          this.workerState.balance += 25 * multiplier;
        } else {
          this.workerState.lives--;
        }

        this.currentTurn.phase = "resolved";
        this.currentTurn.result = result;
        this.currentTurn.paymentRequest = null;
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

      case "purchase-ability": {
        const abilityId = msg.abilityId;
        const prices = {
          "extra-life": 100,
          "hack-customer": 50,
          "uv-scanner": 20,
          "spectral-analyzer": 35,
          "static-stabilizer": 15,
          "neural-enhancer": 60,
          "polygraph-tape": 45,
          "xray-monocle": 40,
        };
        const price = prices[abilityId];
        if (price === undefined) break;

        if (this.workerState.balance < price) {
          const ws = this.connections.get(id);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "error", message: "Insufficient funds" }));
          }
          break;
        }

        if (abilityId === "extra-life") {
          if (this.workerState.lives >= 5) {
            const ws = this.connections.get(id);
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "error", message: "Maximum hearts (5) already reached" }));
            }
            break;
          }
          this.workerState.balance -= price;
          this.workerState.lives = (this.workerState.lives || 3) + 1;
        } else if (abilityId === "hack-customer") {
          // Can be purchased repeatedly per turn or when needed!
          this.workerState.balance -= price;
          if (!this.workerState.abilities.includes("hack-customer")) {
            this.workerState.abilities.push("hack-customer");
          }
          // Immediately trigger the hack breach!
          this.triggerHackCustomer();
        } else {
          if (this.workerState.abilities.includes(abilityId)) {
            const ws = this.connections.get(id);
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "error", message: "Ability already owned" }));
            }
            break;
          }
          this.workerState.balance -= price;
          this.workerState.abilities.push(abilityId);
        }

        this.broadcast({
          type: "ability-purchased",
          abilityId,
          balance: this.workerState.balance,
        });
        this.broadcastState();
        break;
      }

      case "trigger-hack-customer": {
        this.triggerHackCustomer();
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
        let sent = false;
        const frameData = JSON.stringify({ type: "cctv-frame", frame: msg.frame, ts: msg.ts || Date.now() });

        for (const [connId, client] of this.connections.entries()) {
          const player = this.players.get(connId);
          if ((player?.role === "worker" || connId === this.workerId) && client.readyState === WebSocket.OPEN) {
            client.send(frameData);
            sent = true;
          }
        }

        if (!sent && this.hostId) {
          const hostClient = this.connections.get(this.hostId);
          if (hostClient && hostClient.readyState === WebSocket.OPEN) {
            hostClient.send(frameData);
          }
        }

        // Also feed cctv frame to AI detection engine if anomaly turn is active (every 3.0s)
        if (this.phase === "playing" && this.currentTurn && this.currentTurn.secretRole === "anomaly" && this.currentTurn.anomalyTraits) {
          const now = Date.now();
          if (now - this.lastAiSnapshotTime >= 3000) {
            this.lastAiSnapshotTime = now;
            const turn = this.currentTurn;
            turn.detectedTraits = turn.detectedTraits || [];
            const undetectedTraits = turn.anomalyTraits.filter(
              (t) => !turn.detectedTraits.includes(t.id)
            );
            if (undetectedTraits.length > 0) {
              const traitToDetect = undetectedTraits[0];
              turn.detectedTraits.push(traitToDetect.id);
              this.broadcast({
                type: "trait-detected",
                traitId: traitToDetect.id,
                confidence: 0.88,
              });
            }
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

  triggerHackCustomer() {
    const customerId = this.currentTurn?.playerId;
    const traits = this.currentTurn?.anomalyTraits || (customerId ? this.secretTraits.get(customerId) : null) || null;
    const secretRole = (customerId ? this.secretRoles.get(customerId) : this.currentTurn?.secretRole) || "normal";

    this.broadcast({
      type: "hack-customer-alert",
      durationMs: 3000,
      customerId: customerId || "",
      traits,
      secretRole,
    });
  }

  startNight(nightNumber) {
    this.currentNight = nightNumber;
    this.phase = "playing";
    this.currentTurnIndex = -1;
    this.nightTime = "12:00 AM";

    // 30% chance for a Red Night Moon (Blood Moon)
    this.isBloodMoon = Math.random() < 0.30;

    // Gather all real human customers in the room (anyone who is not worker and not camera)
    let humanCustomers = Array.from(this.players.values()).filter(
      (p) => p.id !== this.workerId && p.id !== this.cameraId
    );

    // Ensure all non-worker non-camera human players have role customer
    humanCustomers.forEach((c) => {
      c.role = "customer";
    });

    let customerPool = [];
    // If Blood Moon, double customer volume (2x customers!)
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
      const npcs = this.isBloodMoon
        ? ["Alex (Normal)", "Jordan (The Anomaly)", "Taylor (Normal)", "Morgan (The Anomaly)", "Casey (Normal)", "Sam (The Anomaly)"]
        : ["Alex (Normal)", "Jordan (The Anomaly)", "Taylor (Normal)"];
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
      customerPool = npcs.map((_, i) => `npc-${i + 1}`);
    }

    this.customerQueue = customerPool;

    // Determine anomaly count (Blood Moon = 65% anomalies, Normal = standard scaling)
    const numAnomalies = this.isBloodMoon
      ? Math.max(2, Math.floor(customerPool.length * 0.65))
      : this.currentNight === 1
      ? 1
      : this.currentNight <= 2
      ? 1
      : this.currentNight <= 4
      ? Math.min(2, Math.floor(customerPool.length / 2))
      : Math.min(3, Math.ceil(customerPool.length / 2));

    const anomalyIndices = new Set();
    while (anomalyIndices.size < numAnomalies && anomalyIndices.size < customerPool.length) {
      anomalyIndices.add(Math.floor(Math.random() * customerPool.length));
    }

    this.turnSecrets = [];
    for (let i = 0; i < customerPool.length; i++) {
      const isAnomaly = anomalyIndices.has(i);
      const secretRole = isAnomaly ? "anomaly" : "normal";
      const order = generateRandomOrder();
      // On Blood Moon, select harder anomaly traits!
      const traits = isAnomaly ? selectAnomalyTraits(this.isBloodMoon) : null;
      this.turnSecrets.push({ secretRole, order, traits });
    }

    this.broadcast({
      type: "shift-started",
      queue: this.customerQueue,
      night: this.currentNight,
      isBloodMoon: this.isBloodMoon,
    });
    this.advanceTurn();
  }

  advanceTurn() {
    this.currentTurnIndex++;

    // Clear previous glitch intervals if any
    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }

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

    // Trigger frequent CCTV glitches during anomaly turn and blood moon
    if (turnSecret.secretRole === "anomaly" || this.isBloodMoon) {
      // Immediate glitch after 1.5s
      setTimeout(() => {
        if (this.currentTurn?.playerId === playerId && this.currentTurn.phase !== "resolved") {
          this.broadcast({
            type: "cctv-glitch",
            effect: turnSecret.secretRole === "anomaly" ? "distortion" : "static",
            isAnomaly: turnSecret.secretRole === "anomaly",
          });
        }
      }, 1500);

      // Recurring glitches every 6.5s while customer is active
      this.glitchInterval = setInterval(() => {
        if (this.currentTurn?.playerId === playerId && this.currentTurn.phase !== "resolved") {
          const effects = ["static", "distortion", "blackout"];
          const effect = effects[Math.floor(Math.random() * effects.length)];
          this.broadcast({
            type: "cctv-glitch",
            effect,
            isAnomaly: turnSecret.secretRole === "anomaly",
          });
        } else {
          clearInterval(this.glitchInterval);
          this.glitchInterval = null;
        }
      }, 6500);
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
  // Match /party/WCD-XXXX or /parties/<partyName>/WCD-XXXX or /parties/main/WCD-XXXX
  const match = url.pathname.match(/\/(?:party|parties\/[^/]+)\/([^/]+)/);
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
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

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

// Periodic heartbeat every 20s to prevent cloud proxies from dropping idle WebSockets
const heartbeatInterval = setInterval(() => {
  for (const room of rooms.values()) {
    for (const [id, ws] of room.connections.entries()) {
      if (ws.isAlive === false) {
        try { ws.terminate(); } catch {}
        room.removeConnection(id);
      } else {
        ws.isAlive = false;
        try { ws.ping(); } catch {}
      }
    }
  }
}, 20000);
heartbeatInterval.unref();

server.listen(PORT, () => {
  console.log(`🍔 WcDonald's Game Server listening on port ${PORT}`);
});
