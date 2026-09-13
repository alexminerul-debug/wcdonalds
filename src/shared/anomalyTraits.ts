import type { AnomalyTrait } from "./types";

// ============================================
// Master Anomaly Trait Pool
//
// Each trait has:
//  - id:         Unique identifier for matching
//  - display:    Instruction shown to the Anomaly customer
//  - aiPrompt:   Sent to vision model for detection
//  - category:   Classification for Anomaly Codex
//  - difficulty: "easy" | "medium" | "hard"
//  - tip:        Worker observation tip
// ============================================

export const ANOMALY_TRAITS: AnomalyTrait[] = [
  // ---- EASY BEGINNER TRAITS ----
  {
    id: "tongue-out",
    display: "Stick your tongue out slightly or bite your tongue while placing your order",
    aiPrompt: "The person has their tongue sticking out of their mouth or is biting their tongue visibly",
    category: "facial",
    difficulty: "easy",
    tip: "Look closely at their mouth: tongue is clearly protruding or bitten.",
  },
  {
    id: "wink-loop",
    display: "Wink repeatedly with one eye while speaking to the worker",
    aiPrompt: "The person is winking with one eye closed while the other remains open",
    category: "facial",
    difficulty: "easy",
    tip: "One eyelid stays shut or winks repeatedly.",
  },
  {
    id: "scratch-nose",
    display: "Scratch or pinch your nose repeatedly while ordering",
    aiPrompt: "The person is scratching, pinching, or rubbing their nose with their fingers",
    category: "gestural",
    difficulty: "easy",
    tip: "Fingers continuously touch or pinch the nose bridge.",
  },
  {
    id: "cover-one-eye",
    display: "Cover one eye completely with your hand while looking at the camera",
    aiPrompt: "The person has one hand covering one of their eyes completely like a pirate",
    category: "gestural",
    difficulty: "easy",
    tip: "One eye is blocked by a palm or finger.",
  },
  {
    id: "nod-rapid",
    display: "Nod your head up and down continuously like a bobblehead",
    aiPrompt: "The person is nodding their head vigorously up and down in an unnatural continuous motion",
    category: "postural",
    difficulty: "easy",
    tip: "Head is bouncing up and down constantly.",
  },
  {
    id: "head-shake-no",
    display: "Shake your head left to right as if saying 'no' while ordering your food",
    aiPrompt: "The person is shaking their head from side to side in a 'no' gesture continuously",
    category: "postural",
    difficulty: "easy",
    tip: "Subtle or obvious horizontal head shaking.",
  },
  {
    id: "peace-sign",
    display: "Hold up a peace / V sign with your fingers near your face",
    aiPrompt: "The person is displaying a peace sign (two fingers in a V-shape) near their face or chest",
    category: "gestural",
    difficulty: "easy",
    tip: "Two fingers held in a V sign clearly in view.",
  },
  {
    id: "thumbs-up",
    display: "Give a steady thumbs-up toward the camera lens during the order",
    aiPrompt: "The person is giving a thumbs-up gesture with their thumb extended upward toward the camera",
    category: "gestural",
    difficulty: "easy",
    tip: "A clenched fist with thumb pointing upward.",
  },
  {
    id: "scratch-head",
    display: "Scratch the top of your head with your fingertips",
    aiPrompt: "The person is scratching the top of their head or hair with their fingers",
    category: "gestural",
    difficulty: "easy",
    tip: "Hand is hovering above or scratching hair/scalp.",
  },
  {
    id: "hand-on-cheek",
    display: "Rest your cheek against your open palm or fist while looking forward",
    aiPrompt: "The person is resting their head or cheek in their hand",
    category: "postural",
    difficulty: "easy",
    tip: "Head is supported by hand on cheek or chin.",
  },

  // ---- MEDIUM TRAITS ----
  {
    id: "no-blink",
    display: "Never blink while ordering — keep your eyes wide open the entire time",
    aiPrompt: "The person's eyes appear unnaturally wide open without blinking, staring intensely",
    category: "facial",
    difficulty: "medium",
    tip: "Eyes remain wide and unblinking throughout the entire interaction.",
  },
  {
    id: "unnatural-grin",
    display: "Maintain an unnaturally wide grin when staring at the camera",
    aiPrompt: "The person has an exaggerated, unnaturally wide smile or grin that looks forced and creepy",
    category: "facial",
    difficulty: "medium",
    tip: "Forced, rigid smile showing teeth without warmth.",
  },
  {
    id: "dead-stare",
    display: "Stare directly at the camera with a completely blank, emotionless expression",
    aiPrompt: "The person is staring directly at the camera with a flat, blank, emotionless expression — no smile, no frown",
    category: "facial",
    difficulty: "medium",
    tip: "Zero facial movement, cold stare into the CCTV lens.",
  },
  {
    id: "slow-blink",
    display: "Blink extremely slowly — each blink should take 2-3 full seconds",
    aiPrompt: "The person's eyes are half-closed or closing very slowly, as if blinking in extreme slow motion",
    category: "facial",
    difficulty: "medium",
    tip: "Eyelids close in slow motion and remain shut for seconds.",
  },
  {
    id: "head-tilt-left",
    display: "Tilt your head 45° to the left when mentioning fries",
    aiPrompt: "The person's head is significantly tilted to their left side at approximately 45 degrees",
    category: "postural",
    difficulty: "medium",
    tip: "Head tilted sharply sideways towards the left shoulder.",
  },
  {
    id: "head-tilt-right",
    display: "Slowly tilt your head to the right during the entire order",
    aiPrompt: "The person's head is noticeably tilted to their right side",
    category: "postural",
    difficulty: "medium",
    tip: "Rightward head canting during conversation.",
  },
  {
    id: "point-camera",
    display: "Slowly raise your hand and point directly at the camera",
    aiPrompt: "The person is pointing their finger directly toward the camera or viewer",
    category: "gestural",
    difficulty: "medium",
    tip: "Index finger aimed directly at the surveillance lens.",
  },
  {
    id: "wave-slow",
    display: "Give a very slow, creepy wave at the camera mid-order",
    aiPrompt: "The person is performing a slow, deliberate wave gesture with their hand raised",
    category: "gestural",
    difficulty: "medium",
    tip: "Hand wafting back and forth in hypnotic slow motion.",
  },
  {
    id: "cover-mouth",
    display: "Cover your mouth with your hand while speaking your order",
    aiPrompt: "The person has their hand covering or partially covering their mouth while appearing to speak",
    category: "behavioral",
    difficulty: "medium",
    tip: "Palm hiding mouth movements.",
  },

  // ---- HARD / SUBTLE TRAITS ----
  {
    id: "look-ceiling",
    display: "Slowly look up at the ceiling mid-sentence and hold the gaze for 3 seconds",
    aiPrompt: "The person is looking upward toward the ceiling with their head tilted back",
    category: "postural",
    difficulty: "hard",
    tip: "Sudden gaze upward away from counter, head tilted toward roof.",
  },
  {
    id: "lean-forward",
    display: "Lean uncomfortably close toward the counter/camera",
    aiPrompt: "The person is leaning forward significantly, appearing very close to the camera, invading personal space",
    category: "postural",
    difficulty: "hard",
    tip: "Torso creeps forward, filling more of the monitor frame.",
  },
  {
    id: "sway-side",
    display: "Slowly sway your body side to side while speaking",
    aiPrompt: "The person appears to be swaying or rocking their body from side to side unnaturally",
    category: "postural",
    difficulty: "hard",
    tip: "Rhythmic pendulum rocking of the upper body.",
  },
  {
    id: "tap-counter",
    display: "Tap the counter rhythmically three times in a row",
    aiPrompt: "The person's hand is tapping or knocking on a surface rhythmically, making a deliberate tapping gesture",
    category: "gestural",
    difficulty: "hard",
    tip: "Fingers tapping 3 times on counter surface.",
  },
  {
    id: "hands-clasped",
    display: "Keep both hands clasped together tightly in front of you the entire time",
    aiPrompt: "The person has both hands clasped or pressed together tightly in front of their body",
    category: "gestural",
    difficulty: "hard",
    tip: "Both hands locked together in tight prayer or white-knuckle grip.",
  },
  {
    id: "freeze",
    display: "Remain completely frozen and motionless for 5 full seconds mid-order",
    aiPrompt: "The person appears completely frozen, rigid, and motionless — not moving at all, like a statue",
    category: "behavioral",
    difficulty: "hard",
    tip: "Absolute immobility — check for lack of breathing or blinking.",
  },
  {
    id: "turn-away",
    display: "Suddenly turn your head to look behind you as if someone called your name",
    aiPrompt: "The person has turned their head or body to look behind them or to the side suddenly",
    category: "behavioral",
    difficulty: "hard",
    tip: "Sudden full head rotation towards empty background.",
  },
];

// ============================================
// Trait Selection for a Round
// ============================================

/** Select traits for an Anomaly player, balancing easy and harder traits */
export function selectAnomalyTraits(isHardMode: boolean = false): AnomalyTrait[] {
  const easyTraits = ANOMALY_TRAITS.filter((t) => t.difficulty === "easy");
  const otherTraits = ANOMALY_TRAITS.filter((t) => t.difficulty !== "easy");

  // In standard nights, ensure at least one easy trait so players can spot it!
  const count = 2 + Math.floor(Math.random() * 2); // 2-3 traits
  const selected: AnomalyTrait[] = [];

  if (!isHardMode && easyTraits.length > 0) {
    const randomEasy = easyTraits[Math.floor(Math.random() * easyTraits.length)];
    selected.push(randomEasy);
  }

  const pool = [...(isHardMode ? otherTraits : ANOMALY_TRAITS)].sort(() => Math.random() - 0.5);
  for (const t of pool) {
    if (selected.length >= count) break;
    if (!selected.find((s) => s.id === t.id)) {
      selected.push(t);
    }
  }

  return selected;
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
