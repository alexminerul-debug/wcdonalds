import type { AnomalyTrait } from "./types";

// ============================================
// Master Anomaly Trait Pool
//
// Each trait has:
//  - id:       Unique identifier for matching
//  - display:  Human-readable instruction shown to the Anomaly player
//  - aiPrompt: Description sent to OpenRouter vision model for detection
//  - category: Classification for the Worker's Anomaly Codex
// ============================================

export const ANOMALY_TRAITS: AnomalyTrait[] = [
  // ---- FACIAL ----
  {
    id: "no-blink",
    display: "Never blink while ordering — keep your eyes wide open the entire time",
    aiPrompt: "The person's eyes appear unnaturally wide open without blinking, staring intensely",
    category: "facial",
  },
  {
    id: "unnatural-grin",
    display: "Maintain an unnaturally wide grin when staring at the camera",
    aiPrompt: "The person has an exaggerated, unnaturally wide smile or grin that looks forced and creepy",
    category: "facial",
  },
  {
    id: "dead-stare",
    display: "Stare directly at the camera with a completely blank, emotionless expression",
    aiPrompt: "The person is staring directly at the camera with a flat, blank, emotionless expression — no smile, no frown",
    category: "facial",
  },
  {
    id: "slow-blink",
    display: "Blink extremely slowly — each blink should take 2-3 full seconds",
    aiPrompt: "The person's eyes are half-closed or closing very slowly, as if blinking in extreme slow motion",
    category: "facial",
  },

  // ---- POSTURAL ----
  {
    id: "head-tilt-left",
    display: "Tilt your head 45° to the left when mentioning fries",
    aiPrompt: "The person's head is significantly tilted to their left side at approximately 45 degrees",
    category: "postural",
  },
  {
    id: "head-tilt-right",
    display: "Slowly tilt your head to the right during the entire order",
    aiPrompt: "The person's head is noticeably tilted to their right side",
    category: "postural",
  },
  {
    id: "look-ceiling",
    display: "Slowly look up at the ceiling mid-sentence and hold the gaze for 3 seconds",
    aiPrompt: "The person is looking upward toward the ceiling with their head tilted back",
    category: "postural",
  },
  {
    id: "lean-forward",
    display: "Lean uncomfortably close toward the counter/camera",
    aiPrompt: "The person is leaning forward significantly, appearing very close to the camera, invading personal space",
    category: "postural",
  },
  {
    id: "sway-side",
    display: "Slowly sway your body side to side while speaking",
    aiPrompt: "The person appears to be swaying or rocking their body from side to side unnaturally",
    category: "postural",
  },

  // ---- GESTURAL ----
  {
    id: "tap-counter",
    display: "Tap the counter rhythmically three times in a row",
    aiPrompt: "The person's hand is tapping or knocking on a surface rhythmically, making a deliberate tapping gesture",
    category: "gestural",
  },
  {
    id: "point-camera",
    display: "Slowly raise your hand and point directly at the camera",
    aiPrompt: "The person is pointing their finger directly toward the camera or viewer",
    category: "gestural",
  },
  {
    id: "wave-slow",
    display: "Give a very slow, creepy wave at the camera mid-order",
    aiPrompt: "The person is performing a slow, deliberate wave gesture with their hand raised",
    category: "gestural",
  },
  {
    id: "hands-clasped",
    display: "Keep both hands clasped together tightly in front of you the entire time",
    aiPrompt: "The person has both hands clasped or pressed together tightly in front of their body",
    category: "gestural",
  },

  // ---- BEHAVIORAL ----
  {
    id: "freeze",
    display: "Remain completely frozen and motionless for 5 full seconds mid-order",
    aiPrompt: "The person appears completely frozen, rigid, and motionless — not moving at all, like a statue",
    category: "behavioral",
  },
  {
    id: "turn-away",
    display: "Suddenly turn your head to look behind you as if someone called your name",
    aiPrompt: "The person has turned their head or body to look behind them or to the side suddenly",
    category: "behavioral",
  },
  {
    id: "cover-mouth",
    display: "Cover your mouth with your hand while speaking your order",
    aiPrompt: "The person has their hand covering or partially covering their mouth while appearing to speak",
    category: "behavioral",
  },
];

// ============================================
// Trait Selection for a Round
// ============================================

/** Randomly select 2-3 traits for an Anomaly player */
export function selectAnomalyTraits(count: number = 0): AnomalyTrait[] {
  const num = count || (2 + Math.floor(Math.random() * 2)); // 2-3
  const shuffled = [...ANOMALY_TRAITS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, num);
}

/** Get traits grouped by category for the Anomaly Codex */
export function getTraitsByCategory(): Record<string, AnomalyTrait[]> {
  const groups: Record<string, AnomalyTrait[]> = {};
  for (const trait of ANOMALY_TRAITS) {
    if (!groups[trait.category]) groups[trait.category] = [];
    groups[trait.category].push(trait);
  }
  return groups;
}
