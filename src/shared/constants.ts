import type { MenuItem, AbilityItem, GameConfig } from "./types";

// ============================================
// Menu Items (Expanded Authentic Fast-Food Menu)
// ============================================
export const MENU_ITEMS: MenuItem[] = [
  // Burgers
  { id: "big-wc",          name: "Big Wc Double Burger",     price: 6, emoji: "🍔", category: "burgers", description: "Two 100% mystery patties, special sauce, lettuce, cheese, pickles." },
  { id: "quarter-anomaly", name: "Quarter Pounder Anomaly",  price: 6, emoji: "🍔", category: "burgers", description: "Fresh unearthly beef, slivered onions, two slices of American cheese." },
  { id: "mcscreamer",      name: "McScreamer Burger",        price: 5, emoji: "🍔", category: "burgers", description: "Classic spicy haunted burger with jalapeño screaming sauce." },
  { id: "filet-o-fear",    name: "Filet-O-Fear Fish",        price: 5, emoji: "🐟", category: "burgers", description: "Wild-caught abyssal cod with tart-acid sauce on a steamed bun." },
  { id: "shadow-cheese",   name: "Double Shadow Burger",     price: 4, emoji: "🍔", category: "burgers", description: "Melted void cheddar on twin seared phantom beef patties." },

  // Chicken
  { id: "anomaly-nugs",    name: "Anomaly Nuggets (6pc)",    price: 4, emoji: "🍗", category: "chicken", description: "Tender white meat breaded in crispy eldritch seasoning." },
  { id: "ghost-tenders",   name: "Ghost Pepper Tenders",     price: 5, emoji: "🌶️", category: "chicken", description: "Extremely spicy battered strips that burn like brimstone." },
  { id: "cursed-mcchicken",name: "Cursed McChicken",         price: 4, emoji: "🥪", category: "chicken", description: "Crispy chicken patty topped with shredded iceberg and void mayo." },

  // Sides
  { id: "shadow-fries",    name: "Large Shadow Fries",       price: 3, emoji: "🍟", category: "sides",   description: "World-famous fries cooked in dark oil, golden and steaming." },
  { id: "sorrow-rings",    name: "Onion Rings of Sorrow",    price: 3, emoji: "🧅", category: "sides",   description: "Deep-fried thick cut sweet onions battered in agony." },
  { id: "hash-brown",      name: "Hash Brown of the Damned", price: 2, emoji: "🥔", category: "sides",   description: "Shredded potato patty fried to a blistered crunch." },

  // Beverages
  { id: "cryptic-soda",    name: "Cryptic Fountain Soda",    price: 2, emoji: "🥤", category: "drinks",  description: "Fizzy black-currant soda served ice cold in a wax cup." },
  { id: "gloom-shake",     name: "Gloom Milkshake",          price: 4, emoji: "🥛", category: "drinks",  description: "Thick soft-serve blend with purple dark-matter syrup." },
  { id: "grimace-potion",  name: "Grimace's Secret Potion",  price: 4, emoji: "🧪", category: "drinks",  description: "Mysterious purple elixir that whispers when you sip." },
  { id: "abyss-coffee",    name: "Dark Abyss Roast Coffee",  price: 2, emoji: "☕", category: "drinks",  description: "Freshly brewed boiling pitch-black coffee to stay awake." },

  // Desserts
  { id: "doom-pie",        name: "Baked Apple Pie of Doom",  price: 2, emoji: "🥧", category: "desserts",description: "Turnover pie with bubbling molten apple filling in crispy crust." },
  { id: "void-mcflurry",   name: "Void Oreo McFlurry",       price: 4, emoji: "🍨", category: "desserts",description: "Crushed cookies churned into thick cold dairy darkness." },
];

// ============================================
// Ability Shop (Black Market)
// ============================================
export const ABILITY_ITEMS: AbilityItem[] = [
  {
    id: "extra-life",
    name: "Sanity Restoration (+1 Heart)",
    description: "Emergency adrenaline injection. Restores 1 lost heart/life (max 5 lives).",
    price: 100,
    emoji: "❤️",
  },
  {
    id: "hack-customer",
    name: "Hack Customer (Terminal Breach)",
    description: "Forces a cyber-breach on customer's phone! Worker mirrors customer's screen for 3s to inspect hidden traits.",
    price: 50,
    emoji: "💻",
  },
  {
    id: "uv-scanner",
    name: "UV Scanner Filter",
    description: "Reveals glowing markers on the CCTV feed when anomaly traits are active.",
    price: 20,
    emoji: "🔦",
  },
  {
    id: "spectral-analyzer",
    name: "Microphone Spectral Analyzer",
    description: "Audio tone detector that visualizes voice anomalies on screen.",
    price: 35,
    emoji: "🎙️",
  },
  {
    id: "static-stabilizer",
    name: "Static Stabilizer",
    description: "Prevents complete CCTV blackouts for 3 turns.",
    price: 15,
    emoji: "📡",
    duration: 3,
  },
  {
    id: "neural-enhancer",
    name: "Neural Anomaly Predictor",
    description: "Neural net implant that highlights high-risk body zones directly in CCTV view.",
    price: 60,
    emoji: "🧠",
  },
  {
    id: "polygraph-tape",
    name: "Vocal Stress Polygraph",
    description: "Real-time biometric stress readout measuring customer acoustic jitter.",
    price: 45,
    emoji: "📈",
  },
  {
    id: "xray-monocle",
    name: "Abyssal X-Ray Monocle",
    description: "High-contrast night-vision booster revealing skeletal posture shifts.",
    price: 40,
    emoji: "👁️",
  },
];

export const BLOOD_MOON_CHANCE = 0.30; // 30% chance for a Red Night Moon

// ============================================
// Game Config Defaults
// ============================================
export const DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 10,
  anomalyProbability: 0.35,
  minAnomalies: 1,
  maxAnomalyRatio: 0.5,
  turnTimeLimit: 0,       // 0 = no limit
  startingLives: 3,
  startingBalance: 0,
};

// ============================================
// Scoring Constants
// ============================================
export const SCORING = {
  SERVE_NORMAL_BONUS: 15,
  REPORT_ANOMALY_BONUS: 25,
  WRONGFUL_EJECTION_FINE: 20,
  ANOMALY_WIN_TERROR_POINTS: 30,
} as const;

// ============================================
// Game Room Code Generator
// ============================================
export function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `WCD-${num}`;
}

import { safeStorage } from "../lib/storage";

// ============================================
// PartyKit Connection Config
// ============================================
export function getPartyKitHost(): string {
  if (typeof window !== "undefined") {
    const saved = safeStorage.getItem("wcd_party_host");
    if (saved) {
      return saved.replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
    }

    // Check query param e.g. ?server=xxx
    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get("server");
    if (serverParam) {
      const clean = serverParam.replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
      safeStorage.setItem("wcd_party_host", clean);
      return clean;
    }

    if ((window as any).__PARTYKIT_HOST__) {
      return String((window as any).__PARTYKIT_HOST__).replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
    }

    // Local IP on Wi-Fi (e.g. 192.168.x.x)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)) {
      return `${window.location.hostname}:1999`;
    }

    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "localhost:1999";
    }
  }

  const envHost = (import.meta as any).env?.VITE_PARTYKIT_HOST;
  if (envHost) {
    return String(envHost).replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
  }

  return "wcdonalds-production-3e0b.up.railway.app";
}

export function setPartyKitHost(host: string): void {
  const clean = host.replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
  safeStorage.setItem("wcd_party_host", clean);
}

export const PARTYKIT_HOST: string = getPartyKitHost();

// ============================================
// Random Order Generator (Realistic Combos)
// ============================================
export function generateRandomOrder(): MenuItem[] {
  const mains = MENU_ITEMS.filter((i) => i.category === "burgers" || i.category === "chicken");
  const sides = MENU_ITEMS.filter((i) => i.category === "sides");
  const drinks = MENU_ITEMS.filter((i) => i.category === "drinks");
  const desserts = MENU_ITEMS.filter((i) => i.category === "desserts");

  const roll = Math.random();
  const order: MenuItem[] = [];

  if (roll < 0.55) {
    // Classic Combo Meal: 1 Main + 1 Side + 1 Drink (+ 35% chance dessert)
    order.push(mains[Math.floor(Math.random() * mains.length)]);
    order.push(sides[Math.floor(Math.random() * sides.length)]);
    order.push(drinks[Math.floor(Math.random() * drinks.length)]);
    if (Math.random() < 0.35) {
      order.push(desserts[Math.floor(Math.random() * desserts.length)]);
    }
  } else if (roll < 0.85) {
    // Feast Order: 2 Mains + 1-2 Sides + 1 Drink
    order.push(mains[Math.floor(Math.random() * mains.length)]);
    order.push(mains[Math.floor(Math.random() * mains.length)]);
    order.push(sides[Math.floor(Math.random() * sides.length)]);
    if (Math.random() < 0.5) {
      order.push(sides[Math.floor(Math.random() * sides.length)]);
    }
    order.push(drinks[Math.floor(Math.random() * drinks.length)]);
  } else {
    // Late Night Snack: 1 Side + 1 Drink + 1 Dessert
    order.push(sides[Math.floor(Math.random() * sides.length)]);
    order.push(drinks[Math.floor(Math.random() * drinks.length)]);
    order.push(desserts[Math.floor(Math.random() * desserts.length)]);
  }

  return order.filter(Boolean);
}

// ============================================
// Utility
// ============================================
export function getCartTotal(cart: { menuItem: MenuItem; quantity: number }[]): number {
  return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
}
