import PartySocket from "partysocket";

export class CanvasSnapshotBroadcaster {
  private video: HTMLVideoElement;
  private socket: PartySocket;
  private fps: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private intervalId: number | null = null;
  private quality: number = 0.28;
  private isProcessing = false;
  private processStartTime = 0;
  private frameCount = 0;
  private lastFpsTime = Date.now();
  private pauseListener?: () => void;
  private visibilityListener?: () => void;

  public onFps?: (fps: number) => void;
  public onSnapshot?: (dataUrl: string) => void;

  constructor(video: HTMLVideoElement, socket: PartySocket, fps: number = 10) {
    this.video = video;
    this.socket = socket;
    this.fps = Math.max(5, Math.min(fps, 12));
    this.canvas = document.createElement("canvas");
    this.canvas.width = 320;
    this.canvas.height = 180;
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }

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
    const now = Date.now();

    // Safety watchdog: recover if a previous capture cycle hung
    if (this.isProcessing) {
      if (now - this.processStartTime > 150) {
        this.isProcessing = false;
      } else {
        return;
      }
    }

    if (this.video.paused) {
      this.video.play().catch(() => {});
    }

    if (this.video.readyState < 2 || this.video.videoWidth === 0) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // Skip frame if network buffer is backlogged (prevents queue buildup & latency)
    if (typeof this.socket.bufferedAmount === "number" && this.socket.bufferedAmount > 32 * 1024) {
      return;
    }

    this.isProcessing = true;
    this.processStartTime = now;

    try {
      const targetWidth = 320;
      const targetHeight =
        Math.round((this.video.videoHeight / this.video.videoWidth) * targetWidth) || 180;

      if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;
      }

      this.ctx?.drawImage(this.video, 0, 0, targetWidth, targetHeight);

      const dataUrl = this.canvas.toDataURL("image/jpeg", this.quality);

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
  private decodeStartTime = 0;
  private latestFrame: { frame: string; seq: number } | null = null;
  private frameSeq = 0;
  private lastRenderedSeq = 0;
  private animFrameId: number | null = null;
  private messageHandler: (event: MessageEvent) => void;
  private destroyed = false;

  public onFrameReceived?: () => void;

  constructor(canvas: HTMLCanvasElement, socket: PartySocket) {
    this.canvas = canvas;
    this.socket = socket;
    this.ctx = this.canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }

    this.activeImg = new Image();

    this.activeImg.onload = () => {
      if (this.destroyed) return;
      this.isDecoding = false;

      const w = this.activeImg.naturalWidth || 320;
      const h = this.activeImg.naturalHeight || 180;

      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;
      }

      this.ctx?.drawImage(this.activeImg, 0, 0, this.canvas.width, this.canvas.height);
      this.onFrameReceived?.();
    };

    this.activeImg.onerror = () => {
      this.isDecoding = false;
    };

    this.messageHandler = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.socket.addEventListener("message", this.messageHandler);

    // Start decoupled render loop
    this.startRenderLoop();
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
        // Use a local monotonic counter for frame ordering since camera
        // and viewer devices may have different system clocks (clock skew).
        // We NEVER compare msg.ts against local Date.now() — that was the
        // root cause of the freeze bug (any clock difference > threshold
        // caused every frame to be silently dropped).
        this.frameSeq++;
        const frameSeq = this.frameSeq;

        // Only drop frames that are older than what we've already rendered
        // (using our own monotonic sequence, not cross-device timestamps)
        if (frameSeq <= this.lastRenderedSeq) {
          return;
        }

        // Store ONLY the newest frame, superseding any un-rendered prior frame
        this.latestFrame = { frame: msg.frame, seq: frameSeq };
      }
    } catch {}
  }

  private startRenderLoop() {
    const tick = () => {
      if (this.destroyed) return;

      const now = Date.now();

      // Watchdog: reset stuck decode if image onload failed to fire within 120ms
      if (this.isDecoding && now - this.decodeStartTime > 120) {
        this.isDecoding = false;
      }

      // If ready and there's a fresh frame waiting, decode it!
      if (!this.isDecoding && this.latestFrame) {
        const toRender = this.latestFrame;
        this.latestFrame = null;
        this.lastRenderedSeq = toRender.seq;
        this.isDecoding = true;
        this.decodeStartTime = now;
        this.activeImg.src = toRender.frame;
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public destroy() {
    this.destroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    try {
      this.socket.removeEventListener("message", this.messageHandler);
    } catch {}
    this.latestFrame = null;
    this.activeImg.onload = null;
    this.activeImg.onerror = null;
  }
}
