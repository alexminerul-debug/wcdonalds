export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function vibrateTurnNotification(): void {
  if (isHapticsSupported()) {
    navigator.vibrate([200, 100, 200]);
  }
}

export function vibrateDetection(): void {
  if (isHapticsSupported()) {
    navigator.vibrate([100]);
  }
}

export function vibrateAlarm(): void {
  if (isHapticsSupported()) {
    navigator.vibrate([300, 100, 300, 100, 300]);
  }
}

export function vibratePayment(): void {
  if (isHapticsSupported()) {
    navigator.vibrate([50, 50, 50]);
  }
}
