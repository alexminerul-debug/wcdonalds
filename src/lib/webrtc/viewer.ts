import PartySocket from "partysocket";

export class ViewerReceiver {
  private socket: PartySocket;
  private peerConnection: RTCPeerConnection | null = null;
  private videoElement: HTMLVideoElement;
  private viewerId: string;
  private iceCandidatesBuffer: RTCIceCandidateInit[] = [];
  public onConnectionStateChange?: (state: string) => void;

  constructor(socket: PartySocket, videoElement: HTMLVideoElement, viewerId: string) {
    this.socket = socket;
    this.videoElement = videoElement;
    this.viewerId = viewerId;
    this.socket.addEventListener("message", this.handleMessage.bind(this));
    this.init();
  }

  private init() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
    this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

    this.peerConnection.ontrack = (event) => {
      if (this.videoElement.srcObject !== event.streams[0]) {
        this.videoElement.srcObject = event.streams[0];
        // @ts-ignore
        if (typeof this.videoElement.playoutDelayHint !== "undefined") {
          // @ts-ignore
          this.videoElement.playoutDelayHint = 0;
        }
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.send(JSON.stringify({
          type: "ice-candidate",
          viewerId: this.viewerId,
          candidate: event.candidate
        }));
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection?.connectionState || "closed");
      }
    };

    this.socket.send(JSON.stringify({
      type: "viewer-join",
      viewerId: this.viewerId
    }));
  }

  private async handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data.viewerId !== this.viewerId) return;

      if (data.type === "offer") {
        await this.handleOffer(data.sdp);
      } else if (data.type === "ice-candidate") {
        await this.handleIceCandidate(data.candidate);
      }
    } catch (e) {
      // Ignored
    }
  }

  private async handleOffer(sdp: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    
    for (const candidate of this.iceCandidatesBuffer) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.iceCandidatesBuffer = [];

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.socket.send(JSON.stringify({
      type: "answer",
      viewerId: this.viewerId,
      sdp: this.peerConnection.localDescription
    }));
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;
    if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      this.iceCandidatesBuffer.push(candidate);
    }
  }

  public disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.videoElement.srcObject = null;
  }
}
