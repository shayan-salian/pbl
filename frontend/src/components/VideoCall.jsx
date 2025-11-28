import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const CALL_STATUS = {
  IDLE: "Idle",
  CALLING: "Calling",
  RINGING: "Ringing",
  CONNECTED: "Connected",
  ENDED: "Ended",
  ERROR: "Error",
};

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoCall({ requestId, user }) {
  const [socket, setSocket] = useState(null);
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isCaller, setIsCaller] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const hasVideoSocketRef = useRef(false);


  useEffect(() => {
    if (!hasVideoSocketRef.current) {
    connectSocket();
    hasVideoSocketRef.current = true;
  }

  return () => {
    cleanupCall();
    if (socket) {
      socket.disconnect();
    }
  };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const connectSocket = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    console.log("[VideoCall] token from cookie:", token);

    if (!token) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_BASE}/chat`, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("[VideoCall] socket connected");
      newSocket.emit("join", { requestId });
    });

    // Incoming offer
    newSocket.on("webrtc:offer", async ({ fromUserId, offer }) => {
      if (fromUserId === user?._id) return; // ignore own
      setIsCaller(false);
      setCallStatus(CALL_STATUS.RINGING);
      try {
        await ensurePeerConnection();
        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await startLocalMedia();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit("webrtc:answer", { requestId, answer });
        // don't force CONNECTED here; wait for remote track
      } catch (err) {
        console.error("Error handling offer:", err);
        setError("Failed to answer call");
        setCallStatus(CALL_STATUS.ERROR);
      }
    });

    // Incoming answer
    newSocket.on("webrtc:answer", async ({ fromUserId, answer }) => {
      if (fromUserId === user?._id) return;
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // don't force CONNECTED here; wait for remote track
      } catch (err) {
        console.error("Error handling answer:", err);
        setError("Failed to establish call");
        setCallStatus(CALL_STATUS.ERROR);
      }
    });

    // Incoming ICE candidate
    newSocket.on("webrtc:ice-candidate", async ({ fromUserId, candidate }) => {
      if (fromUserId === user?._id) return;
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    // Hangup signal
    newSocket.on("webrtc:call:hangup", () => {
      cleanupCall();
      setCallStatus(CALL_STATUS.ENDED);
    });

    newSocket.on("error", (err) => {
      console.error("Video socket error:", err);
    });

    setSocket(newSocket);
  };

  const ensurePeerConnection = async () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc:ice-candidate", {
          requestId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      // remote media has arrived: this is a successful connection
      setError("");
      setCallStatus(CALL_STATUS.CONNECTED);
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        cleanupCall();
        setCallStatus(CALL_STATUS.ENDED);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startLocalMedia = async () => {
    try {
      if (localStreamRef.current) return localStreamRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = peerConnectionRef.current;
      if (pc) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      setError("Camera/mic permission denied or unavailable.");
      setCallStatus(CALL_STATUS.ERROR);
      throw err;
    }
  };

  const startCall = async () => {
    console.log("[VideoCall] startCall clicked");
    if (!socket) {
      console.log("[VideoCall] no socket yet");
      return;
    }

    setError("");
    setIsCaller(true);
    setCallStatus(CALL_STATUS.CALLING);
    try {
      await ensurePeerConnection();
      await startLocalMedia();
      const pc = peerConnectionRef.current;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", { requestId, offer });
    } catch (err) {
      console.error("Error starting call:", err);
      setError("Failed to start call");
      setCallStatus(CALL_STATUS.ERROR);
    }
  };

  const hangUp = () => {
    if (socket) {
      socket.emit("webrtc:call:hangup", { requestId });
    }
    cleanupCall();
    setCallStatus(CALL_STATUS.ENDED);
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsMuted(false);
    setVideoEnabled(true);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((t) => {
      t.enabled = !t.enabled;
      setIsMuted(!t.enabled);
    });
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((t) => {
      t.enabled = !t.enabled;
      setVideoEnabled(!t.enabled);
    });
  };

  const canStartCall =
    callStatus === CALL_STATUS.IDLE ||
    callStatus === CALL_STATUS.ENDED ||
    callStatus === CALL_STATUS.ERROR;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-slate-100">
            Video call
          </h3>
          <span className="text-[11px] text-slate-400">
            Status: {callStatus}
          </span>
        </div>
        <div className="flex gap-2">
          {canStartCall ? (
            <button
              onClick={startCall}
              className="btn-primary text-[11px] px-3 py-1.5"
            >
              Start / Join call
            </button>
          ) : (
            <button
              onClick={hangUp}
              className="btn-secondary text-[11px] px-3 py-1.5"
            >
              Hang up
            </button>
          )}
        </div>
      </div>

      {callStatus === CALL_STATUS.ERROR && error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[11px] text-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* Remote video */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          {callStatus !== CALL_STATUS.CONNECTED && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
              Waiting for peer to join…
            </div>
          )}
        </div>

        {/* Local video + controls */}
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!localStreamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
                Your preview will appear here
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={toggleMute}
              className="btn-secondary px-3 py-1.5"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className="btn-secondary px-3 py-1.5"
            >
              {videoEnabled ? "Turn camera off" : "Turn camera on"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
