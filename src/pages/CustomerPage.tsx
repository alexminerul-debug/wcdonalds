import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameState } from "@/hooks/useGameState";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { vibrateTurnNotification, vibratePayment } from "@/lib/effects/haptics";
import { MENU_ITEMS, SCORING } from "@/shared/constants";

import { QueueWaiting } from "@/components/customer/QueueWaiting";
import { SecretRoleCard } from "@/components/customer/SecretRoleCard";
import { OrderDisplay } from "@/components/customer/OrderDisplay";
import { AnomalyObjectives } from "@/components/customer/AnomalyObjectives";
import { SlideToPayModal } from "@/components/customer/SlideToPayModal";
import { DetectedScreen } from "@/components/customer/DetectedScreen";
import { VictoryScreen } from "@/components/customer/VictoryScreen";
import { GlitchText } from "@/components/ui/GlitchText";

export default function CustomerPage() {
  const { code } = useParams<{ code: string }>();
  const [showRoleCard, setShowRoleCard] = useState(false);
  const [showMenuPreview, setShowMenuPreview] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [prevTurnIndex, setPrevTurnIndex] = useState(-1);

  const { socket, sendMessage, connectionStatus } = useGameSocket(code || "");
  const {
    gameState,
    myRole,
    myId,
    isMyTurn,
    currentTurn,
    secretRole,
    secretOrder,
    secretTraits,
    detectedTraits,
    paymentRequest,
    lastResult,
  } = useGameState(socket);

  // Ensure Customer registers identity and claims role on mount/reconnect
  useEffect(() => {
    if (connectionStatus === "connected") {
      const savedName =
        (typeof window !== "undefined" &&
          sessionStorage.getItem("wcd_player_name")) ||
        "Customer";
      sendMessage({ type: "join-room", name: savedName });
      sendMessage({ type: "claim-role", role: "customer" });
    }
  }, [connectionStatus, sendMessage]);

  // When a new turn starts for this player, show role card
  useEffect(() => {
    if (
      isMyTurn &&
      gameState &&
      gameState.currentTurnIndex !== prevTurnIndex
    ) {
      setPrevTurnIndex(gameState.currentTurnIndex);
      setShowRoleCard(true);
      setResultDismissed(false);
      vibrateTurnNotification();
      try {
        SoundEngine.getInstance().playChime();
      } catch {}
    }
  }, [isMyTurn, gameState?.currentTurnIndex, prevTurnIndex]);

  // Vibrate on payment request
  useEffect(() => {
    if (paymentRequest) {
      vibratePayment();
    }
  }, [paymentRequest]);

  const handlePaymentComplete = () => {
    sendMessage({ type: "payment-complete" });
  };

  if (connectionStatus !== "connected" || !gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-abyss text-bone font-mono">
        <GlitchText
          text={
            connectionStatus === "connecting" ? "CONNECTING..." : "DISCONNECTED"
          }
        />
      </div>
    );
  }

  const queueIndex = (gameState?.customerQueue || []).indexOf(myId);
  const queuePosition = queueIndex >= 0 ? queueIndex + 1 : 1;
  const totalQueue = Math.max((gameState?.customerQueue || []).length, 1);
  const isAnomaly = secretRole === "anomaly";

  // Fallback order so screen is never blank if server order hasn't arrived yet
  const itemsToDisplay =
    secretOrder && secretOrder.length > 0
      ? secretOrder
      : [MENU_ITEMS[0], MENU_ITEMS[1]];

  // ---- GAME OVER ----
  if (gameState.phase === "game_over") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-abyss p-6 text-center">
        <h1 className="text-3xl font-mono text-blood-bright mb-4">
          <GlitchText text="SHIFT ENDED" />
        </h1>
        <p className="font-mono text-fog">The night is over.</p>
      </div>
    );
  }

  // ---- RESULT SCREENS (current turn resolved and it was this player) ----
  if (
    lastResult &&
    currentTurn?.playerId === myId &&
    currentTurn?.phase === "resolved" &&
    !resultDismissed
  ) {
    switch (lastResult.type) {
      case "served_anomaly":
        return (
          <VictoryScreen
            terrorPoints={SCORING.ANOMALY_WIN_TERROR_POINTS}
            onDismiss={() => setResultDismissed(true)}
          />
        );
      case "reported_anomaly":
        return <DetectedScreen onDismiss={() => setResultDismissed(true)} />;
      case "served_normal":
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-abyss p-6 text-center">
            <h1 className="text-3xl font-mono text-safe mb-4">
              ORDER COMPLETE
            </h1>
            <p className="font-mono text-fog">
              Thank you for visiting WcDonald's.
            </p>
          </div>
        );
      case "reported_innocent":
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-abyss p-6 text-center">
            <h1 className="text-3xl font-mono text-blood-bright mb-4">
              WRONGFULLY EJECTED
            </h1>
            <p className="font-mono text-fog">
              You were innocent. The Worker has been fined.
            </p>
          </div>
        );
    }
  }

  // ---- ACTIVE TURN ----
  if (isMyTurn) {
    return (
      <div className="min-h-screen bg-abyss text-bone relative">
        {/* Connection dot */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <div className="w-2 h-2 rounded-full bg-safe" />
          <span className="text-[10px] font-mono text-fog uppercase">
            live
          </span>
        </div>

        {/* Role reveal overlay */}
        {showRoleCard && (
          <SecretRoleCard
            role={secretRole || "normal"}
            onDismiss={() => setShowRoleCard(false)}
          />
        )}

        {/* Main content (after role card dismissed) */}
        {!showRoleCard && (
          <div className="p-6 pb-24 min-h-screen space-y-6">
            <OrderDisplay items={itemsToDisplay} isAnomaly={isAnomaly} />

            {isAnomaly && (
              <AnomalyObjectives
                traits={
                  secretTraits && secretTraits.length > 0
                    ? secretTraits
                    : [
                        {
                          id: "unnatural-grin",
                          display:
                            "Maintain an unnaturally wide grin when staring at the camera",
                          category: "facial",
                          aiPrompt: "Unnatural grin",
                        },
                      ]
                }
                detectedTraits={detectedTraits}
              />
            )}

            {!isAnomaly && (
              <div className="text-center py-6">
                <p className="text-fog text-sm font-mono">
                  Act completely normal. Nothing to hide.
                </p>
                <p className="text-fog/40 text-xs font-mono mt-2">
                  Waiting for Worker to ring up your order...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment modal */}
        {paymentRequest && (
          <SlideToPayModal
            total={paymentRequest.total}
            items={paymentRequest.items}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    );
  }

  // ---- WAITING IN QUEUE ----
  return (
    <div className="min-h-screen bg-abyss">
      <QueueWaiting
        position={queuePosition}
        totalInQueue={totalQueue}
        onPreviewMenu={() => setShowMenuPreview(true)}
      />

      {/* Menu Preview Modal */}
      {showMenuPreview && (
        <div className="fixed inset-0 z-50 bg-abyss p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-fog/20 pb-4">
            <h2 className="text-xl font-mono text-bone">WcDonald's Menu</h2>
            <button
              onClick={() => setShowMenuPreview(false)}
              className="text-blood-bright font-mono uppercase text-sm"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {MENU_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-void border border-fog/10 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="font-mono text-bone">{item.name}</span>
                </div>
                <span className="font-mono text-amber-glow">
                  ${item.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
