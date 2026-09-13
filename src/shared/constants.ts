import type { MenuItem, AbilityItem, GameConfig } from "./types";

// ============================================
// Menu Items
// ============================================
export const MENU_ITEMS: MenuItem[] = [
  { id: "mcscreamer",  name: "McScreamer Burger", price: 5, emoji: "🍔" },
  { id: "shadow-fries", name: "Shadow Fries",     price: 3, emoji: "🍟" },
  { id: "cryptic-soda", name: "Cryptic Soda",     price: 2, emoji: "🥤" },
  { id: "anomaly-nugs", name: "Anomaly Nuggets",  price: 4, emoji: "🍗" },
  { id: "gloom-shake",  name: "Gloom Shake",      price: 4, emoji: "🥛" },
];

// ============================================
// Ability Shop
// ============================================
export const ABILITY_ITEMS: AbilityItem[] = [
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
];

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

// ============================================
// PartyKit Connection Config
// ============================================
export const PARTYKIT_HOST: string =
  (import.meta as any).env?.VITE_PARTYKIT_HOST ||
  (typeof window !== "undefined" && (window as any).__PARTYKIT_HOST__) ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "wcdonalds-anomaly.username.partykit.dev"
    : "localhost:1999");

// ============================================
// Random Order Generator
// ============================================
export function generateRandomOrder(): MenuItem[] {
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 items
  const shuffled = [...MENU_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================
// Utility
// ============================================
export function getCartTotal(cart: { menuItem: MenuItem; quantity: number }[]): number {
  return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
}
