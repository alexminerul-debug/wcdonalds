import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameState } from "@/hooks/useGameState";
import { SoundEngine } from "@/lib/audio/soundEngine";
import { vibrateTurnNotification, vibratePayment } from "@/lib/effects/haptics";
import { MENU_ITEMS, SCORING } from "@/shared/constants";
import { useTranslation } from "@/lib/i18n";
import { safeStorage } from "@/lib/storage";

import { QueueWaiting } from "@/components/customer/QueueWaiting";
import { SecretRoleCard } from "@/components/customer/SecretRoleCard";
import { OrderDisplay } from "@/components/customer/OrderDisplay";
import { AnomalyObjectives } from "@/components/customer/AnomalyObjectives";
import { SlideToPayModal } from "@/components/customer/SlideToPayModal";
import { DetectedScreen } from "@/components/customer/DetectedScreen";
import { VictoryScreen } from "@/components/customer/VictoryScreen";
import { GlitchText } from "@/components/ui/GlitchText";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { LeaveRoomButton } from "@/components/common/LeaveRoomButton";
import { Moon, Clock, Skull, CheckCircle, ArrowRight } from "lucide-react";

export default function CustomerPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
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
      const savedName = safeStorage.getSession("wcd_player_name") || "Customer";
      sendMessage({ type: "join-room", name: savedName });
      sendMessage({ type: "claim-role", role: "customer" });
    }
  }, [connectionStatus, sendMessage]);

  // Robust Turn Matching: if there is only 1 customer in the room, they are always active when an order is up
  const humanCustomers = (gameState?.players || []).filter((p) => p.role === "customer");
  const isOnlyCustomer = humanCustomers.length <= 1;
  const isCurrentTurnPlayer = Boolean(currentTurn && myId && currentTurn.playerId === myId);
  const isOnlyCustomerTurn = Boolean(isOnlyCustomer && currentTurn);
  const isMyActiveTurn = isMyTurn || isCurrentTurnPlayer || isOnlyCustomerTurn;

  const isPaymentPhase = currentTurn?.phase === "payment";
  const activePayment =
    paymentRequest ||
    currentTurn?.paymentRequest ||
    (isPaymentPhase
      ? {
          total:
            (currentTurn?.assignedOrder || []).reduce(
              (sum, item) => sum + (item.price || 5),
              0
            ) || 5.0,
          items: (currentTurn?.assignedOrder || []).map((item) => ({
            menuItem: item,
            quantity: 1,
          })),
        }
      : null);

  // If a payment request was received OR current turn is in payment phase,
  // show payment modal to the customer immediately
  const shouldShowPayment = Boolean(
    activePayment && (paymentRequest || isPaymentPhase)
  );

  // When payment is requested, immediately dismiss any blocking screens/overlays
  useEffect(() => {
    if (shouldShowPayment) {
      setResultDismissed(true);
      setShowRoleCard(false);
      setShowMenuPreview(false);
    }
  }, [shouldShowPayment]);

  // When a new turn starts for this player, show role card
  useEffect(() => {
    if (
      isMyActiveTurn &&
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
  }, [isMyActiveTurn, gameState?.currentTurnIndex, prevTurnIndex]);

  // Auto-dismiss result screen after 3.5s so customer is never stuck
  useEffect(() => {
    if (lastResult && currentTurn?.phase === "resolved" && !resultDismissed) {
      const timer = setTimeout(() => {
        setResultDismissed(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [lastResult, currentTurn?.phase, resultDismissed]);

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-abyss text-bone font-mono p-4">
        <GlitchText
          text={
            connectionStatus === "connecting" ? t("connecting") : t("disconnected")
          }
        />
        <div className="mt-6 flex items-center gap-3">
          <LanguageSelector />
          <LeaveRoomButton roomCode={code} />
        </div>
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

  // ---- NIGHT COMPLETE (6:00 AM) ----
  if (gameState.phase === "night_complete") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-abyss p-6 text-center select-none font-mono animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-safe/20 border-2 border-safe flex items-center justify-center mb-6 animate-pulse">
          <Clock className="w-8 h-8 text-safe" />
        </div>
        <div className="text-safe text-sm tracking-widest uppercase mb-2">6:00 AM</div>
        <h1 className="text-3xl md:text-5xl font-bold text-bone mb-4 glitch-text" data-text={`${t("night")} ${gameState.currentNight || 1} ${t("nightSurvived")}`}>
          {t("night")} {gameState.currentNight || 1} {t("nightSurvived")}
        </h1>
        <p className="text-fog text-sm max-w-sm mb-6">
          The sun rises over WcDonald's. Preparing next shift...
        </p>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <LeaveRoomButton roomCode={code} />
        </div>
      </div>
    );
  }

  // ---- GAME OVER / VICTORY ----
  if (gameState.phase === "game_over") {
    const isVictory = (gameState as any).victory === true;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-abyss p-6 text-center select-none font-mono">
        {isVictory ? (
          <>
            <div className="w-20 h-20 rounded-full border-4 border-amber-glow flex items-center justify-center mb-6 bg-amber-glow/20 animate-bounce">
              <Moon className="w-10 h-10 text-amber-glow" />
            </div>
            <h1 className="text-3xl md:text-5xl font-mono text-amber-glow mb-4 glitch-text" data-text={t("allNightsSurvived")}>
              {t("allNightsSurvived")}
            </h1>
            <p className="font-mono text-bone text-base max-w-sm mb-4">
              {t("employeeOfMonth")}
            </p>
            <p className="font-mono text-fog text-xs max-w-xs mb-8">
              All anomalies survived across 5 full shifts.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full border-4 border-blood flex items-center justify-center mb-6 bg-blood/20 animate-pulse">
              <Skull className="w-10 h-10 text-blood" />
            </div>
            <h1 className="text-3xl md:text-4xl font-mono text-blood-bright mb-4 glitch-text" data-text={t("shiftTerminated")}>
              {t("shiftTerminated")}
            </h1>
            <p className="font-mono text-fog text-sm max-w-xs mb-8">
              {t("shiftTerminatedDesc")}
            </p>
          </>
        )}
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <LeaveRoomButton roomCode={code} />
        </div>
      </div>
    );
  }

  // ---- RESULT SCREENS (current turn resolved and it was this player) ----
  if (
    !shouldShowPayment &&
    lastResult &&
    (currentTurn?.playerId === myId || isOnlyCustomer) &&
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
          <div className="flex flex-col items-center justify-center min-h-screen bg-abyss p-6 text-center select-none font-mono animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-safe/20 border-2 border-safe flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-safe animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-safe mb-3">
              {t("orderComplete")}
            </h1>
            <p className="text-fog text-sm mb-8">
              {t("thankYou")}
            </p>
            <button
              type="button"
              onClick={() => setResultDismissed(true)}
              className="px-6 py-3 bg-safe text-abyss font-bold rounded-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              <span>{t("nextInLine")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      case "reported_innocent":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-abyss p-6 text-center select-none font-mono animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-blood/20 border-2 border-blood flex items-center justify-center mb-6">
              <Skull className="w-8 h-8 text-blood animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-blood-bright mb-3">
              {t("wrongfullyEjected")}
            </h1>
            <p className="text-fog text-sm mb-8">
              {t("innocentFined")}
            </p>
            <button
              type="button"
              onClick={() => setResultDismissed(true)}
              className="px-6 py-3 bg-void border border-smoke/40 text-bone font-bold rounded-lg flex items-center gap-2 hover:border-amber-glow active:scale-95 transition-all text-sm"
            >
              <span>{t("nextInLine")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
    }
  }

  // ---- ACTIVE TURN ----
  if (isMyActiveTurn) {
    return (
      <div className="min-h-screen bg-abyss text-bone relative pb-10">
        {/* Top Header Bar with Night/Time, Language & Leave */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 bg-abyss/95 border-b border-smoke/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-mono text-xs text-amber-glow bg-void/80 px-2 py-1 border border-smoke/30 rounded">
            <span>{t("night")} {gameState?.currentNight || 1}/5</span>
            <span className="text-smoke">|</span>
            <span className="text-bone">{gameState?.nightTime || "12:00 AM"}</span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <LeaveRoomButton roomCode={code} />
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <span className="text-[10px] font-mono text-fog uppercase hidden xs:inline">
                {t("live")}
              </span>
            </div>
          </div>
        </header>

        {/* Role reveal overlay */}
        {showRoleCard && (
          <SecretRoleCard
            role={secretRole || "normal"}
            onDismiss={() => setShowRoleCard(false)}
          />
        )}

        {/* Main content (after role card dismissed) */}
        {!showRoleCard && (
          <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
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
              <div className="text-center py-6 bg-void/40 border border-smoke/20 rounded-lg p-4">
                <p className="text-fog text-sm font-mono">
                  {t("secretRoleNormalDesc")}
                </p>
                <p className="text-fog/50 text-xs font-mono mt-2">
                  {t("waitingCustomer")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment modal */}
        {shouldShowPayment && activePayment && (
          <SlideToPayModal
            total={activePayment.total}
            items={activePayment.items}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    );
  }

  // ---- WAITING IN QUEUE ----
  return (
    <div className="min-h-screen bg-abyss flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 bg-abyss/95 border-b border-smoke/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-mono text-xs text-amber-glow bg-void/80 px-2 py-1 border border-smoke/30 rounded">
          <span>{t("night")} {gameState?.currentNight || 1}/5</span>
          <span className="text-smoke">|</span>
          <span className="text-bone">{gameState?.nightTime || "12:00 AM"}</span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <LeaveRoomButton roomCode={code} />
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center">
        <QueueWaiting
          position={queuePosition}
          totalInQueue={totalQueue}
          onPreviewMenu={() => setShowMenuPreview(true)}
        />
      </div>

      {/* Menu Preview Modal */}
      {showMenuPreview && (
        <div className="fixed inset-0 z-50 bg-abyss p-6 flex flex-col font-mono">
          <div className="flex justify-between items-center mb-6 border-b border-fog/20 pb-4">
            <h2 className="text-xl text-bone">WcDonald's Menu</h2>
            <button
              onClick={() => setShowMenuPreview(false)}
              className="text-blood-bright uppercase text-sm font-bold"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {MENU_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-void border border-smoke/30 px-4 py-3 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-bone text-sm">{item.name}</span>
                </div>
                <span className="text-amber-glow font-bold text-sm">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment modal (guaranteed to render even if customer was in queue view) */}
      {shouldShowPayment && activePayment && (
        <SlideToPayModal
          total={activePayment.total}
          items={activePayment.items}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
