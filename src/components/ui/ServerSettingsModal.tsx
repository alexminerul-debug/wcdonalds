import { useState, useEffect } from "react";
import { Server, Check, X, RefreshCw } from "lucide-react";
import { getPartyKitHost, setPartyKitHost } from "@/shared/constants";

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newHost: string) => void;
}

export function ServerSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: ServerSettingsModalProps) {
  const [hostInput, setHostInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHostInput(getPartyKitHost());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    let clean = hostInput.trim();
    // Strip http:// or https:// or ws:// or wss:// if user pasted a full URL
    clean = clean.replace(/^(https?|wss?):\/\//, "").replace(/\/$/, "");
    if (!clean) clean = "localhost:1999";

    setPartyKitHost(clean);
    onSaved?.(clean);
    onClose();
    // Reload to re-initialize socket with new host
    window.location.reload();
  };

  const handleResetLocal = () => {
    setHostInput("localhost:1999");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-void border border-fog/40 p-6 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-fog/20 pb-3">
          <div className="flex items-center gap-2 text-bone font-bold text-sm">
            <Server className="w-4 h-4 text-amber-glow" />
            <span>GAME SERVER (PARTYKIT)</span>
          </div>
          <button
            onClick={onClose}
            className="text-fog hover:text-bone transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-fog leading-relaxed">
          The real-time game server coordinates players, roles, and turns.
        </p>

        <div className="space-y-2">
          <label className="text-xs uppercase text-bone tracking-wider">
            Server Host URL / IP:
          </label>
          <input
            type="text"
            value={hostInput}
            onChange={(e) => setHostInput(e.target.value)}
            placeholder="e.g. localhost:1999 or xxx.trycloudflare.com"
            className="w-full bg-abyss border border-fog/30 text-bone px-3 py-2 text-sm
                       focus:outline-none focus:border-amber-glow transition-all"
          />
        </div>

        {/* Quick presets */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetLocal}
            className="text-[11px] px-2 py-1 bg-ash border border-fog/20 text-fog hover:text-bone transition-colors cursor-pointer"
          >
            Local (localhost:1999)
          </button>
        </div>

        {/* Free Cloudflare tunnel instructions */}
        <div className="bg-abyss/80 border border-fog/20 p-3 text-[11px] text-fog/80 space-y-1">
          <span className="text-amber-glow font-bold block">
            💡 Quick free public server:
          </span>
          <p>
            In your Mac terminal, run:
          </p>
          <code className="block bg-black p-1 text-bone select-all text-[10px]">
            npx cloudflared tunnel --url http://localhost:1999
          </code>
          <p className="text-[10px] text-fog/60">
            Copy the <span className="text-eerie">https://xxx.trycloudflare.com</span> link it prints and paste it above!
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-fog/30 text-fog hover:text-bone text-xs uppercase transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 bg-amber-glow/20 border border-amber-glow text-amber-glow hover:bg-amber-glow/30 text-xs uppercase font-bold transition-all cursor-pointer"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
