import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

import { safeStorage } from "@/lib/storage";

interface LeaveRoomButtonProps {
  className?: string;
  roomCode?: string;
}

export function LeaveRoomButton({ className = "", roomCode }: LeaveRoomButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLeave = () => {
    if (roomCode) {
      safeStorage.removeSession(`wcdonalds_player_${roomCode}`);
    }
    navigate("/");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border border-blood/40 bg-blood/10 text-blood-bright hover:bg-blood/20 hover:border-blood transition-colors select-none ${className}`}
        title={t("leaveRoom")}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t("leaveRoom")}</span>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-abyss border border-blood/60 rounded-lg p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center gap-3 text-blood-bright">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg uppercase tracking-wider">{t("leaveRoom")}</h3>
            </div>

            <p className="text-sm text-fog leading-relaxed">
              {t("leaveConfirm")}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-bold rounded border border-smoke/40 text-bone hover:bg-void transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2 text-xs font-bold rounded bg-blood border border-blood text-bone hover:bg-blood-bright transition-colors"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
