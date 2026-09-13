import PartySocket from "partysocket";

export class CanvasSnapshotBroadcaster {
  private video: HTMLVideoElement;
  private socket: PartySocket;
  private fps: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private intervalId: number | null = null;
  private quality: number = 0.35;
  private isProcessing = false;
  private frameCount = 0;
  private lastFpsTime = Date.now();
  private pauseListener?: () => void;
  private visibilityListener?: () => void;

  public onFps?: (fps: number) => void;
  public onSnapshot?: (dataUrl: string) => void;

  constructor(video: HTMLVideoElement, socket: PartySocket, fps: number = 10) {
    this.video = video;
    this.socket = socket;
    this.fps = fps;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 320;
    this.canvas.height = 180;
    this.ctx = this.canvas.getContext("2d", { alpha: false });

    // Auto-resume camera if paused by mobile browser
    this.pauseListener = () => {
      this.video.play().catch(() => {});
    };
    this.video.addEventListener("pause", this.pauseListener);

    this.visibilityListener = () => {
      if (document.visibilityState === "visible") {
        this.video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", this.visibilityListener);
  }

  public updateSocket(socket: PartySocket) {
    this.socket = socket;
  }

  public start() {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(this.captureAndSend.bind(this), 1000 / this.fps);
  }

  private captureAndSend() {
    if (this.isProcessing) return;

    if (this.video.paused) {
      this.video.play().catch(() => {});
    }

    if (this.video.readyState < 2 || this.video.videoWidth === 0) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // Skip frame if buffer is backlogged, but do not halt stream
    if (typeof this.socket.bufferedAmount === "number" && this.socket.bufferedAmount > 64 * 1024) {
      return;
    }

    this.isProcessing = true;

    try {
      // 320x180 (16:9 standard): ultra-lightweight (~3-4 KB per frame), instant encode and transmission
      const targetWidth = 320;
      const targetHeight =
        Math.round((this.video.videoHeight / this.video.videoWidth) * targetWidth) || 180;

      if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
      }

      this.ctx?.drawImage(this.video, 0, 0, targetWidth, targetHeight);

      const dataUrl = this.canvas.toDataURL("image/jpeg", this.quality);
      const now = Date.now();

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "cctv-frame", frame: dataUrl, ts: now }));
      }

      this.frameCount++;
      if (now - this.lastFpsTime >= 1000) {
        this.onFps?.(this.frameCount);
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      // Periodically trigger snapshot for AI analysis (every ~3 seconds)
      if (this.onSnapshot && this.frameCount % (this.fps * 3) === 0) {
        this.onSnapshot(dataUrl);
      }
    } catch {
      // Ignore frame encoding exceptions
    } finally {
      this.isProcessing = false;
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.pauseListener) {
      this.video.removeEventListener("pause", this.pauseListener);
    }
    if (this.visibilityListener) {
      document.removeEventListener("visibilitychange", this.visibilityListener);
    }
  }
}

export class CanvasSnapshotViewer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private socket: PartySocket;
  private activeImg: HTMLImageElement;
  private isDecoding = false;
  private pendingFrame: string | null = null;
  private lastRenderedTs = 0;
  private messageHandler: (event: MessageEvent) => void;

  public onFrameReceived?: () => void;

  constructor(canvas: HTMLCanvasElement, socket: PartySocket) {
    this.canvas = canvas;
    this.socket = socket;
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.activeImg = new Image();

    this.activeImg.onload = () => {
      const w = this.activeImg.naturalWidth || 320;
      const h = this.activeImg.naturalHeight || 180;

      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }

      this.ctx?.drawImage(this.activeImg, 0, 0);
      this.onFrameReceived?.();

      // If a newer frame arrived while decoding, immediately decode it!
      if (this.pendingFrame) {
        const next = this.pendingFrame;
        this.pendingFrame = null;
        this.activeImg.src = next;
      } else {
        this.isDecoding = false;
      }
    };

    this.activeImg.onerror = () => {
      this.isDecoding = false;
      if (this.pendingFrame) {
        const next = this.pendingFrame;
        this.pendingFrame = null;
        this.isDecoding = true;
        this.activeImg.src = next;
      }
    };

    this.messageHandler = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.socket.addEventListener("message", this.messageHandler);
  }

  public updateSocket(socket: PartySocket) {
    if (this.socket === socket) return;
    try {
      this.socket.removeEventListener("message", this.messageHandler);
    } catch {}
    this.socket = socket;
    this.socket.addEventListener("message", this.messageHandler);
  }

  private handleMessage(event: MessageEvent) {
    if (typeof event.data !== "string") return;
    if (!event.data.includes('"cctv-frame"')) return;

    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "cctv-frame" && msg.frame) {
        // Drop stale or delayed frames from TCP transit backlog
        if (msg.ts && msg.ts < this.lastRenderedTs) {
          return;
        }
        if (msg.ts) {
          this.lastRenderedTs = msg.ts;
        }

        if (!this.isDecoding) {
          this.isDecoding = true;
          this.activeImg.src = msg.frame;
        } else {
          // Keep newest frame to decode next as soon as previous frame completes
          this.pendingFrame = msg.frame;
        }
      }
    } catch {}
  }

  public destroy() {
    try {
      this.socket.removeEventListener("message", this.messageHandler);
    } catch {}
  }
}
