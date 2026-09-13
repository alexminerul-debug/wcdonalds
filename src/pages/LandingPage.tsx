import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomCode } from "@/shared/constants";
import { Skull, LogIn, Plus } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    const code = generateRoomCode();
    navigate(`/room/${code}`);
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a room code");
      return;
    }
    if (!/^WCD-\d{4}$/.test(code)) {
      setError("Invalid code format (e.g. WCD-4821)");
      return;
    }
    setError("");
    navigate(`/room/${code}`);
  };

  return (
    <div className="min-h-screen bg-abyss flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background noise */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43NSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')]" />

      {/* Title */}
      <div className="relative mb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-blood-bright glitch-text tracking-widest">
          WcDonald's
        </h1>
        <div className="mt-2 text-lg md:text-xl text-fog tracking-[0.5em] uppercase">
          The Anomaly
        </div>
        <Skull className="mx-auto mt-4 w-10 h-10 text-blood opacity-60" />
      </div>

      {/* Create Room */}
      <button
        onClick={handleCreate}
        className="w-full max-w-xs flex items-center justify-center gap-3 bg-blood/20 border border-blood text-blood-bright
                   px-8 py-4 text-lg uppercase tracking-wider font-bold
                   hover:bg-blood/40 hover:shadow-[0_0_30px_rgba(220,20,60,0.3)] transition-all duration-300
                   active:scale-95"
      >
        <Plus className="w-5 h-5" />
        Create Room
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-xs my-8">
        <div className="flex-1 h-px bg-fog/30" />
        <span className="text-fog text-xs uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-fog/30" />
      </div>

      {/* Join Room */}
      <div className="w-full max-w-xs space-y-3">
        <input
          type="text"
          placeholder="WCD-XXXX"
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          maxLength={8}
          className="w-full bg-void border border-fog/30 text-bone text-center text-2xl tracking-[0.3em]
                     px-6 py-4 uppercase placeholder:text-fog/40 placeholder:tracking-[0.3em]
                     focus:outline-none focus:border-amber-glow focus:shadow-[0_0_20px_rgba(255,102,0,0.15)]
                     transition-all"
        />
        <button
          onClick={handleJoin}
          className="w-full flex items-center justify-center gap-3 bg-ash border border-fog/30 text-bone
                     px-8 py-4 text-lg uppercase tracking-wider font-bold
                     hover:bg-fog/20 hover:border-amber-glow transition-all duration-300
                     active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          Join Room
        </button>
        {error && (
          <p className="text-blood-bright text-sm text-center">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-fog/30 text-xs tracking-widest uppercase">
        A Real-Life Party Game
      </div>
    </div>
  );
}
