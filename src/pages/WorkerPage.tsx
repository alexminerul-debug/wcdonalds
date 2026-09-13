import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useGameState } from '@/hooks/useGameState';
import { useWebRTC } from '@/hooks/useWebRTC';
import { POSRegister } from '@/components/worker/POSRegister';
import { CCTVFeed } from '@/components/worker/CCTVFeed';
import { AnomalyCodex } from '@/components/worker/AnomalyCodex';
import { AbilityShop } from '@/components/worker/AbilityShop';
import { DecisionPanel } from '@/components/worker/DecisionPanel';
import { JumpscareOverlay } from '@/components/worker/JumpscareOverlay';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { LeaveRoomButton } from '@/components/common/LeaveRoomButton';
import { NightCutsceneModal } from '@/components/common/NightCutsceneModal';
import { Heart, Moon, Skull, Volume2, VolumeX } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from '@/lib/i18n';
import { safeStorage } from '@/lib/storage';
import { SoundEngine } from '@/lib/audio/soundEngine';
import { WorkerHackTerminalModal } from '@/components/common/WorkerHackTerminalModal';
import { WorkerPuzzleModal } from '@/components/worker/WorkerPuzzleModal';

export default function WorkerPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const { socket, sendMessage } = useGameSocket(code || '');
  const { gameState, currentTurn, cctvGlitch, workerState, cartItems, hackAlert } = useGameState(socket);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { connectionMode, startViewing } = useWebRTC('viewer', socket, videoRef, canvasRef);
  
  const [activeTab, setActiveTab] = useState<'pos' | 'cctv' | 'codex' | 'shop'>('pos');
  const [nightVisionOn, setNightVisionOn] = useState(false);
  const [showJumpscare, setShowJumpscare] = useState(false);
  const [showNightCutscene, setShowNightCutscene] = useState(false);
  const [lastCutsceneNight, setLastCutsceneNight] = useState<number | null>(null);
  const [showHackModal, setShowHackModal] = useState(false);
  const [activePuzzle, setActivePuzzle] = useState<{ pendingAction: 'serve' | 'report' } | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Auto-register as Worker on mount / connect
  useEffect(() => {
    if (socket) {
      const savedName = safeStorage.getSession('wcd_player_name') || 'Worker';
      sendMessage({ type: 'join-room', name: savedName });
      sendMessage({ type: 'claim-role', role: 'worker' });
    }
  }, [socket, sendMessage]);

  useEffect(() => {
    if (socket) {
      startViewing();
      sendMessage({ type: 'viewer-join', viewerId: socket.id || '' });
    }
  }, [socket, startViewing, sendMessage]);

  // Re-bind camera feed on cameraId change or when switching to CCTV tab
  useEffect(() => {
    if (gameState?.cameraId || activeTab === 'cctv') {
      startViewing();
    }
  }, [gameState?.cameraId, activeTab, startViewing]);

  useEffect(() => {
    if (!socket) return;
    const handleCameraReady = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'camera-ready') {
            startViewing();
          }
        }
      } catch {}
    };
    socket.addEventListener('message', handleCameraReady);
    return () => socket.removeEventListener('message', handleCameraReady);
  }, [socket, startViewing]);

  useEffect(() => {
    if (currentTurn?.result?.type === 'served_anomaly') {
      setShowJumpscare(true);
    }
  }, [currentTurn?.result]);

  // Listen for hackAlert to display Worker Terminal Mirror
  useEffect(() => {
    if (hackAlert) {
      setShowHackModal(true);
    }
  }, [hackAlert]);

  // Start background atmospheric audio on first interaction
  useEffect(() => {
    if (!isMuted && gameState?.phase === 'playing') {
      try {
        SoundEngine.getInstance().startAtmosphereMusic();
      } catch {}
    } else {
      try {
        SoundEngine.getInstance().stopAtmosphereMusic();
      } catch {}
    }
    return () => {
      try {
        SoundEngine.getInstance().stopAtmosphereMusic();
      } catch {}
    };
  }, [isMuted, gameState?.phase]);

  // 35% chance to trigger an emergency security override puzzle when reporting/serving
  const handleServe = () => {
    // If lives are low (<= 2) or random 35% hazard occurs, trigger puzzle override
    const shouldTriggerPuzzle = Math.random() < 0.35 && !activePuzzle;
    if (shouldTriggerPuzzle) {
      setActivePuzzle({ pendingAction: 'serve' });
    } else {
      sendMessage({ type: 'serve-order' });
    }
  };

  const handleReport = () => {
    const shouldTriggerPuzzle = Math.random() < 0.35 && !activePuzzle;
    if (shouldTriggerPuzzle) {
      setActivePuzzle({ pendingAction: 'report' });
    } else {
      sendMessage({ type: 'report-anomaly' });
    }
  };

  const handlePuzzleSuccess = () => {
    const action = activePuzzle?.pendingAction;
    setActivePuzzle(null);
    if (action === 'serve') {
      sendMessage({ type: 'serve-order' });
    } else if (action === 'report') {
      sendMessage({ type: 'report-anomaly' });
    }
  };

  const handlePuzzleFail = () => {
    const action = activePuzzle?.pendingAction;
    setActivePuzzle(null);
    // On fail, send action anyway, and worker loses a life
    if (action === 'serve') {
      sendMessage({ type: 'serve-order' });
    } else if (action === 'report') {
      sendMessage({ type: 'report-anomaly' });
    }
  };

  const handlePurchaseAbility = (abilityId: string) => {
    sendMessage({ type: 'purchase-ability', abilityId });
  };

  const isDecisionDisabled = !currentTurn || currentTurn.phase === 'resolved';
  const hasUvScanner = workerState?.abilities.includes('uv-scanner') || false;
  const hasStabilizer = workerState?.abilities.includes('static-stabilizer') || false;

  // Trigger 12:00 AM cutscene when night starts
  useEffect(() => {
    if (gameState?.phase === 'playing' && gameState.currentNight && gameState.currentNight !== lastCutsceneNight) {
      setLastCutsceneNight(gameState.currentNight);
      setShowNightCutscene(true);
    }
  }, [gameState?.phase, gameState?.currentNight, lastCutsceneNight]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col font-mono text-bone overflow-hidden selection:bg-blood/30">
      <JumpscareOverlay active={showJumpscare} onDismiss={() => setShowJumpscare(false)} />

      {/* Emergency Worker Security Puzzle Event */}
      {activePuzzle && (
        <WorkerPuzzleModal
          onSuccess={handlePuzzleSuccess}
          onFail={handlePuzzleFail}
        />
      )}

      {/* Hack Customer Terminal Mirror Modal */}
      {showHackModal && (
        <WorkerHackTerminalModal
          durationMs={hackAlert?.durationMs || 3000}
          traits={hackAlert?.traits || null}
          secretRole={hackAlert?.secretRole || "normal"}
          onDismiss={() => setShowHackModal(false)}
        />
      )}

      {showNightCutscene && (
        <NightCutsceneModal
          nightNumber={gameState?.currentNight || 1}
          isBloodMoon={gameState?.isBloodMoon}
          onDismiss={() => setShowNightCutscene(false)}
        />
      )}

      {/* Top HUD */}
      <header className="bg-abyss border-b border-smoke/30 p-2 md:p-3 flex justify-between items-center z-10 shrink-0 shadow-md">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-amber-glow font-bold tracking-widest text-xs md:text-sm flex items-center gap-1.5 bg-void/60 px-2 py-1 border border-smoke/30 rounded">
            <Moon className="w-3.5 h-3.5 text-amber-glow animate-pulse" />
            <span>{t("night")} {gameState?.currentNight || 1}/5</span>
            <span className="text-smoke">|</span>
            <span className="text-bone">{gameState?.nightTime || "12:00 AM"}</span>
          </div>

          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={i} 
                className={clsx("w-3.5 h-3.5 md:w-4 md:h-4", i < (workerState?.lives || 0) ? "text-blood fill-blood" : "text-ash/30")} 
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 text-xs">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded border border-smoke/30 bg-void text-ash hover:text-bone transition-colors"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-blood" /> : <Volume2 className="w-4 h-4 text-safe animate-pulse" />}
          </button>
          <div className="text-safe bg-safe/10 px-2 py-1 rounded border border-safe/20 font-bold">
            ${workerState?.balance.toFixed(2) || '0.00'}
          </div>
          <LanguageSelector />
          <LeaveRoomButton roomCode={code} />
        </div>
      </header>

      {/* Main Content Area - Fits Exactly in One Screen on Desktop without page scroll */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Mobile & Desktop View Mode Tabs Navigation */}
        <div className="flex bg-void border-b border-smoke/30 shrink-0 px-2">
          {(['pos', 'shop', 'codex', 'cctv'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "py-2 px-3 text-xs font-mono font-bold transition-colors uppercase border-b-2 flex items-center gap-1.5",
                activeTab === tab 
                  ? "border-amber-glow text-amber-glow bg-abyss" 
                  : "border-transparent text-ash hover:text-bone hover:bg-smoke/5",
                // CCTV tab only visible on mobile (since on desktop CCTV is pinned on right)
                tab === 'cctv' && "md:hidden"
              )}
            >
              {tab === 'pos' ? t('posTab') : tab === 'cctv' ? t('cctvTab') : tab === 'shop' ? t('shopTab') : t('codexTab')}
              {tab === 'shop' && <span className="text-[10px] text-safe font-normal">${workerState?.balance.toFixed(0)}</span>}
            </button>
          ))}
        </div>

        {/* Desktop Left Column / Mobile Active Tab */}
        <div className={clsx(
          "flex-1 flex flex-col p-2 md:p-3 gap-3 overflow-hidden min-h-0",
          activeTab === 'cctv' && "hidden md:flex"
        )}>
          <div className="flex-1 overflow-hidden min-h-0">
             {activeTab === 'pos' || (activeTab === 'cctv' && window.innerWidth >= 768) ? (
                 <POSRegister 
                  sendMessage={sendMessage}
                  cartItems={cartItems.length > 0 ? cartItems : (workerState?.cart || [])}
                  workerBalance={workerState?.balance || 0}
                  currentCustomerName={currentTurn?.playerName || null}
                  isPaymentPending={currentTurn?.phase === 'payment'}
                  allowedItemIds={currentTurn?.assignedOrder ? currentTurn.assignedOrder.map(i => i.id) : null}
                />
             ) : activeTab === 'shop' ? (
                <AbilityShop 
                  balance={workerState?.balance || 0}
                  ownedAbilities={workerState?.abilities || []}
                  lives={workerState?.lives || 3}
                  onPurchase={handlePurchaseAbility}
                />
             ) : (
                <AnomalyCodex />
             )}
          </div>
        </div>

        {/* Desktop Right Column / Mobile CCTV Tab */}
        <div className={clsx(
          "w-full md:w-[420px] lg:w-[460px] flex-col p-2 md:p-3 gap-2 bg-void border-l border-smoke/30 shrink-0 overflow-hidden min-h-0",
          activeTab === 'cctv' ? "flex" : "hidden md:flex"
        )}>
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
            <div className="relative shrink-0">
              <CCTVFeed
                videoRef={videoRef}
                canvasRef={canvasRef}
                connectionMode={connectionMode}
                isAnomaly={cctvGlitch?.isAnomaly ?? false}
                nightVisionOn={nightVisionOn}
                cctvGlitch={cctvGlitch}
                hasUvScanner={hasUvScanner}
                hasStabilizer={hasStabilizer}
                isBloodMoon={gameState?.isBloodMoon}
              />
              <button
                onClick={() => setNightVisionOn(!nightVisionOn)}
                className={clsx(
                  "absolute -bottom-2.5 right-3 p-1.5 rounded-full border shadow-lg transition-colors z-30",
                  nightVisionOn ? "bg-eerie/20 border-eerie text-eerie" : "bg-abyss border-smoke/30 text-ash hover:text-bone"
                )}
                title={t("nightVision")}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {activeTab !== 'codex' && (
              <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
                 <AnomalyCodex />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Decision Panel at Bottom */}
      <div className="shrink-0 z-40 bg-abyss border-t border-smoke/30">
        <DecisionPanel 
          onServe={handleServe}
          onReport={handleReport}
          disabled={isDecisionDisabled}
          customerName={currentTurn?.playerName || null}
        />
      </div>

      {/* 6:00 AM Night Survived Celebration Overlay */}
      {gameState?.phase === "night_complete" && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center select-none font-mono animate-fade-in">
          <div className="w-20 h-20 rounded-full border-4 border-safe/60 flex items-center justify-center mb-6 bg-safe/10 animate-bounce">
            <Moon className="w-10 h-10 text-safe" />
          </div>
          <div className="text-safe font-mono text-xl tracking-widest uppercase mb-2">6:00 AM</div>
          <h1 className="text-4xl md:text-6xl font-bold font-mono text-bone mb-4 glitch-text" data-text={`${t("night")} ${gameState.currentNight || 1} ${t("nightSurvived")}`}>
            {t("night")} {gameState.currentNight || 1} {t("nightSurvived")}
          </h1>
          <p className="font-mono text-fog text-sm md:text-base max-w-md mb-8">
            The shift has ended! Earnings and purchased upgrades are safely preserved for the next night.
          </p>
          <div className="bg-void border border-smoke/40 p-4 rounded max-w-xs w-full mb-8 font-mono text-left space-y-2">
            <div className="flex justify-between text-xs text-ash">
              <span>{t("night")}:</span>
              <span className="text-bone">{gameState.currentNight || 1} of 5</span>
            </div>
            <div className="flex justify-between text-xs text-ash">
              <span>{t("balance")}:</span>
              <span className="text-amber-glow">${workerState?.balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-ash">
              <span>{t("lives")}:</span>
              <span className="text-blood">{workerState?.lives} / 3</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button
              onClick={() => sendMessage({ type: "start-next-night" })}
              className="px-8 py-4 bg-safe text-abyss font-bold uppercase tracking-widest hover:bg-safe/80 transition-all font-mono shadow-lg"
            >
              {t("startNextNight")} {(gameState.currentNight || 1) + 1} of 5 &rarr;
            </button>
            <LeaveRoomButton roomCode={code} />
          </div>
        </div>
      )}

      {/* Game Over / Victory Overlay */}
      {gameState?.phase === "game_over" && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center select-none font-mono animate-fade-in">
          {workerState && workerState.lives > 0 ? (
            <>
              <div className="w-24 h-24 rounded-full border-4 border-safe flex items-center justify-center mb-6 bg-safe/20 animate-pulse">
                <Moon className="w-12 h-12 text-safe" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-safe mb-4 glitch-text" data-text={t("allNightsSurvived")}>
                {t("allNightsSurvived")}
              </h1>
              <p className="text-bone text-base max-w-md mb-4">
                {t("employeeOfMonth")}
              </p>
              <div className="text-amber-glow text-lg font-bold mb-8">
                {t("total")}: ${workerState.balance.toFixed(2)}
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full border-4 border-blood flex items-center justify-center mb-6 bg-blood/20 animate-pulse">
                <Skull className="w-12 h-12 text-blood" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-blood-bright mb-4 glitch-text" data-text={t("shiftTerminated")}>
                {t("shiftTerminated")}
              </h1>
              <p className="text-fog text-base max-w-md mb-8">
                {t("shiftTerminatedDesc")}
              </p>
            </>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-smoke/40 text-bone hover:bg-white/10 transition-all uppercase tracking-widest text-sm"
            >
              Play Again
            </button>
            <LeaveRoomButton roomCode={code} />
          </div>
        </div>
      )}
    </div>
  );
}
