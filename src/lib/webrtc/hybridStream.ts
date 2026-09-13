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

  public start() {
    this.attemptWebRTC();
  }

  private attemptWebRTC() {
    this.setMode("webrtc");
    this.webrtcViewer = new ViewerReceiver(this.socket, this.videoElement, this.viewerId);
    
    this.webrtcViewer.onConnectionStateChange = (state) => {
      if (state === "failed" || state === "disconnected") {
        this.switchToFallback();
      } else if (state === "connected") {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
      }
    };

    this.timeoutId = window.setTimeout(() => {
      console.warn("WebRTC connection timed out, switching to fallback");
      this.switchToFallback();
    }, 6000);
  }

  private switchToFallback() {
    if (this.webrtcViewer) {
      this.webrtcViewer.disconnect();
      this.webrtcViewer = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.setMode("canvas");
    this.canvasViewer = new CanvasSnapshotViewer(this.canvasElement, this.socket);
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
