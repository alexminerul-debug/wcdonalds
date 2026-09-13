import PartySocket from "partysocket";
import { ViewerReceiver } from "./viewer";
import { CanvasSnapshotViewer } from "./fallback";

export type StreamMode = "webrtc" | "canvas" | "disconnected";

export class HybridStreamManager {
  private socket: PartySocket;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private viewerId: string;
  private mode: StreamMode = "disconnected";
  private webrtcViewer: ViewerReceiver | null = null;
  private canvasViewer: CanvasSnapshotViewer | null = null;
  public onModeChange?: (mode: StreamMode) => void;
  private timeoutId: number | null = null;

  constructor(socket: PartySocket, videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement, viewerId: string) {
    this.socket = socket;
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.viewerId = viewerId;
  }

  private webrtcConnected = false;

  public start() {
    // Start canvas fallback receiver immediately so any arriving frames display with zero delay
    this.canvasViewer = new CanvasSnapshotViewer(this.canvasElement, this.socket);
    this.canvasViewer.onFrameReceived = () => {
      if (!this.webrtcConnected && this.mode !== "canvas") {
        this.setMode("canvas");
      }
    };

    this.attemptWebRTC();
  }

  private attemptWebRTC() {
    this.webrtcViewer = new ViewerReceiver(this.socket, this.videoElement, this.viewerId);
    
    this.webrtcViewer.onConnectionStateChange = (state) => {
      if (state === "connected") {
        this.webrtcConnected = true;
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        this.setMode("webrtc");
      } else if (state === "failed" || state === "disconnected") {
        this.webrtcConnected = false;
        this.switchToFallback();
      }
    };

    this.timeoutId = window.setTimeout(() => {
      if (!this.webrtcConnected) {
        this.switchToFallback();
      }
    }, 4000);
  }

  private switchToFallback() {
    this.webrtcConnected = false;
    if (this.webrtcViewer) {
      this.webrtcViewer.disconnect();
      this.webrtcViewer = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.setMode("canvas");
    if (!this.canvasViewer) {
      this.canvasViewer = new CanvasSnapshotViewer(this.canvasElement, this.socket);
    }
  }

  public stop() {
    if (this.webrtcViewer) {
      this.webrtcViewer.disconnect();
      this.webrtcViewer = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.setMode("disconnected");
  }

  private setMode(mode: StreamMode) {
    this.mode = mode;
    if (this.onModeChange) {
      this.onModeChange(mode);
    }
    if (mode === "webrtc") {
      this.videoElement.style.display = "block";
      this.canvasElement.style.display = "none";
    } else if (mode === "canvas") {
      this.videoElement.style.display = "none";
      this.canvasElement.style.display = "block";
    } else {
      this.videoElement.style.display = "none";
      this.canvasElement.style.display = "none";
    }
  }

  public getMode(): StreamMode {
    return this.mode;
  }
}
