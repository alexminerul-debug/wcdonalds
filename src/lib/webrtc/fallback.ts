import PartySocket from "partysocket";

export class CanvasSnapshotBroadcaster {
  private video: HTMLVideoElement;
  private socket: PartySocket;
  private fps: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private intervalId: number | null = null;
  private quality: number = 0.65;

  constructor(video: HTMLVideoElement, socket: PartySocket, fps: number = 10) {
    this.video = video;
    this.socket = socket;
    this.quality = 0.55;
    this.fps = fps;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: false });
  }

  private isProcessing = false;

  public start() {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(this.captureAndSend.bind(this), 1000 / this.fps);
  }

  private captureAndSend() {
    if (this.isProcessing) return;
    if (this.video.readyState < 2 || this.video.videoWidth === 0) return;
    if (this.socket.readyState !== WebSocket.OPEN) return;

    // Check socket backpressure: skip frame if buffer is backlogged (> 64KB)
    if (this.socket.bufferedAmount > 64 * 1024) {
      return;
    }

    this.isProcessing = true;

    try {
      // Downscale to 420px width for efficient low-latency stream
      const targetWidth = 420;
      const targetHeight =
        Math.round((this.video.videoHeight / this.video.videoWidth) * targetWidth) || 240;

      if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
      }

      this.ctx?.drawImage(this.video, 0, 0, targetWidth, targetHeight);

      // 1. Send base64 frame for universal web compatibility
      const dataUrl = this.canvas.toDataURL("image/jpeg", 0.55);
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "cctv-frame", frame: dataUrl }));
      }

      // 2. Also send binary frame
      const timestamp = Date.now();
      this.canvas.toBlob(
        (blob) => {
          if (!blob || this.socket.readyState !== WebSocket.OPEN) return;
          blob.arrayBuffer().then((buffer) => {
            if (this.socket.bufferedAmount > 64 * 1024) return;
            const payload = new Uint8Array(8 + buffer.byteLength);
            const dataView = new DataView(payload.buffer);
            dataView.setFloat64(0, timestamp, true);
            payload.set(new Uint8Array(buffer), 8);
            if (this.socket.readyState === WebSocket.OPEN) {
              this.socket.send(payload);
            }
          });
        },
        "image/jpeg",
        0.55
      );
    } catch (err) {
      // Ignore frame encode errors
    } finally {
      this.isProcessing = false;
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export class CanvasSnapshotViewer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private socket: PartySocket;
  private lastTimestamp: number = 0;
  public onLatency?: (latency: number) => void;
  public onFrameReceived?: () => void;

  constructor(canvas: HTMLCanvasElement, socket: PartySocket) {
    this.canvas = canvas;
    this.socket = socket;
    // @ts-ignore
    this.ctx = this.canvas.getContext("2d", { alpha: false, desynchronized: true });
    this.socket.addEventListener("message", this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent) {
    // Handle JSON string cctv-frame
    if (typeof event.data === "string") {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "cctv-frame" && msg.frame) {
          const img = new Image();
          img.onload = () => {
            if (this.canvas.width !== img.width || this.canvas.height !== img.height) {
              this.canvas.width = img.width;
              this.canvas.height = img.height;
            }
            this.ctx?.drawImage(img, 0, 0);
            this.onFrameReceived?.();
          };
          img.src = msg.frame;
        }
      } catch {}
      return;
    }

    if (!(event.data instanceof Blob) && !(event.data instanceof ArrayBuffer)) return;
    
    let buffer: ArrayBuffer;
    if (event.data instanceof Blob) {
      buffer = await event.data.arrayBuffer();
    } else {
      buffer = event.data;
    }

    if (buffer.byteLength < 8) return;

    const dataView = new DataView(buffer);
    const timestamp = dataView.getFloat64(0, true);

    if (timestamp < this.lastTimestamp) return; // Drop stale frames
    this.lastTimestamp = timestamp;

    if (this.onLatency) {
      this.onLatency(Date.now() - timestamp);
    }

    const imageBuffer = buffer.slice(8);
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    try {
      const bitmap = await createImageBitmap(blob);
      if (this.canvas.width !== bitmap.width || this.canvas.height !== bitmap.height) {
        this.canvas.width = bitmap.width;
        this.canvas.height = bitmap.height;
      }
      this.ctx?.drawImage(bitmap, 0, 0);
      bitmap.close();
      this.onFrameReceived?.();
    } catch (e) {
      console.error("Bitmap error", e);
    }
  }
}
