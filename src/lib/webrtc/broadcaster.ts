import PartySocket from "partysocket";

export class BroadcasterStreamer {
  private socket: PartySocket;
  private connections: Map<string, RTCPeerConnection> = new Map();
  private stream: MediaStream | null = null;
  private iceCandidatesBuffer: Map<string, RTCIceCandidateInit[]> = new Map();

  constructor(socket: PartySocket) {
    this.socket = socket;
    this.socket.addEventListener("message", this.handleMessage.bind(this));
  }

  public async startCamera(videoElement?: HTMLVideoElement) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      if (videoElement) {
        videoElement.srcObject = this.stream;
        videoElement.play().catch(console.error);
      }
    } catch (error) {
      console.error("Camera error:", error);
      throw error;
    }
  }

  private async handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "viewer-join") {
        await this.handleViewerJoin(data.viewerId);
      } else if (data.type === "answer") {
        await this.handleAnswer(data.viewerId, data.sdp);
      } else if (data.type === "ice-candidate") {
        await this.handleIceCandidate(data.viewerId, data.candidate);
      }
    } catch (e) {
      // Ignored non-json
    }
  }

  private async handleViewerJoin(viewerId: string) {
    if (this.connections.has(viewerId)) {
      this.cleanupConnection(viewerId);
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    this.connections.set(viewerId, peerConnection);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.send(JSON.stringify({
          type: "ice-candidate",
          viewerId,
          candidate: event.candidate
        }));
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed" ||
        peerConnection.connectionState === "disconnected"
      ) {
        this.cleanupConnection(viewerId);
      }
    };

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        const sender = peerConnection.addTrack(track, this.stream!);
        if (track.kind === "video") {
          const params = sender.getParameters();
          if (!params.encodings) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = 1500000;
          sender.setParameters(params).catch(console.error);
        }
      });
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.socket.send(JSON.stringify({
      type: "offer",
      viewerId,
      sdp: peerConnection.localDescription
    }));
  }

  private async handleAnswer(viewerId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.connections.get(viewerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const buffer = this.iceCandidatesBuffer.get(viewerId) || [];
      for (const candidate of buffer) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.iceCandidatesBuffer.delete(viewerId);
    }
  }

  private async handleIceCandidate(viewerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.connections.get(viewerId);
    if (pc) {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        const buffer = this.iceCandidatesBuffer.get(viewerId) || [];
        buffer.push(candidate);
        this.iceCandidatesBuffer.set(viewerId, buffer);
      }
    }
  }

  private cleanupConnection(viewerId: string) {
    const pc = this.connections.get(viewerId);
    if (pc) {
      pc.close();
      this.connections.delete(viewerId);
      this.iceCandidatesBuffer.delete(viewerId);
    }
  }

  public stop() {
    this.connections.forEach((pc) => pc.close());
    this.connections.clear();
    this.iceCandidatesBuffer.clear();
    
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }
}
