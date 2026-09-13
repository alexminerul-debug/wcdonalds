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
import { Heart, Moon } from 'lucide-react';
import { HorrorButton } from '@/components/ui/HorrorButton';
import { clsx } from 'clsx';

export default function WorkerPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { socket, sendMessage } = useGameSocket(roomCode || '');
  const { gameState, currentTurn, cctvGlitch, workerState, cartItems } = useGameState(socket);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { connectionMode, startViewing } = useWebRTC('viewer', socket, videoRef, canvasRef);
  
  const [activeTab, setActiveTab] = useState<'pos' | 'cctv' | 'codex' | 'shop'>('pos');
  const [nightVisionOn, setNightVisionOn] = useState(false);
  const [showJumpscare, setShowJumpscare] = useState(false);

  useEffect(() => {
    startViewing();
  }, [startViewing]);

  useEffect(() => {
    if (currentTurn?.result?.type === 'served_anomaly') {
      setShowJumpscare(true);
    }
  }, [currentTurn?.result]);

  const handleServe = () => {
    sendMessage({ type: 'serve-order' });
  };

  const handleReport = () => {
    sendMessage({ type: 'report-anomaly' });
  };

  const handlePurchaseAbility = (abilityId: string) => {
    sendMessage({ type: 'purchase-ability', abilityId });
  };

  const isDecisionDisabled = !currentTurn || currentTurn.phase === 'resolved' || currentTurn.phase === 'deciding';
  const hasUvScanner = workerState?.abilities.includes('uv-scanner') || false;
  const hasStabilizer = workerState?.abilities.includes('static-stabilizer') || false;

  return (
    <div className="min-h-screen bg-black flex flex-col font-mono text-bone overflow-hidden selection:bg-blood/30">
      <JumpscareOverlay active={showJumpscare} onDismiss={() => setShowJumpscare(false)} />

      {/* Top HUD */}
      <header className="bg-abyss border-b border-smoke/30 p-2 md:p-4 flex justify-between items-center z-10 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="text-amber-glow font-bold tracking-widest text-sm md:text-base">WCD_WORKER_OS</div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={i} 
                className={clsx("w-4 h-4 md:w-5 md:h-5", i < (workerState?.lives || 0) ? "text-blood fill-blood" : "text-ash/30")} 
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs md:text-sm">
          <div className="text-ash">ROOM: <span className="text-bone">{roomCode}</span></div>
          <div className="text-safe bg-safe/10 px-2 py-1 rounded border border-safe/20 font-bold">
            ${workerState?.balance.toFixed(2) || '0.00'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden pb-28 md:pb-24">
        
        {/* Mobile Tabs Navigation */}
        <div className="md:hidden flex bg-void border-b border-smoke/30 shrink-0">
          {(['pos', 'cctv', 'codex', 'shop'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "flex-1 py-3 text-xs font-bold transition-colors uppercase border-b-2",
                activeTab === tab ? "border-amber-glow text-amber-glow bg-abyss" : "border-transparent text-ash hover:bg-smoke/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Desktop Left Column / Mobile Active Tab */}
        <div className={clsx(
          "flex-1 flex flex-col p-2 md:p-4 gap-4 overflow-y-auto custom-scrollbar",
          (activeTab !== 'pos' && activeTab !== 'shop' && activeTab !== 'codex') && "hidden md:flex"
        )}>
          <div className={clsx("flex-1", (activeTab === 'pos' || activeTab === 'shop' || activeTab === 'codex') ? "block" : "hidden md:block")}>
             {activeTab === 'pos' || activeTab === 'cctv' ? (
                <POSRegister 
                  sendMessage={sendMessage}
                  cartItems={cartItems || []}
                  workerBalance={workerState?.balance || 0}
                  currentCustomerName={currentTurn?.playerName || null}
                  isPaymentPending={currentTurn?.phase === 'payment'}
                />
             ) : activeTab === 'shop' ? (
                <AbilityShop 
                  balance={workerState?.balance || 0}
                  ownedAbilities={workerState?.abilities || []}
                  onPurchase={handlePurchaseAbility}
                />
             ) : (
                <AnomalyCodex />
             )}
          </div>
        </div>

        {/* Desktop Right Column / Mobile CCTV Tab */}
        <div className={clsx(
          "w-full md:w-[450px] lg:w-[500px] flex-col p-2 md:p-4 gap-4 bg-void border-l border-smoke/30 shrink-0 overflow-y-auto custom-scrollbar",
          activeTab === 'cctv' ? "flex" : "hidden md:flex"
        )}>
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <CCTVFeed
                videoRef={videoRef}
                canvasRef={canvasRef}
                connectionMode={connectionMode}
                isAnomaly={cctvGlitch?.isAnomaly ?? false}
                nightVisionOn={nightVisionOn}
                cctvGlitch={cctvGlitch}
                hasUvScanner={hasUvScanner}
                hasStabilizer={hasStabilizer}
              />
              <button
                onClick={() => setNightVisionOn(!nightVisionOn)}
                className={clsx(
                  "absolute -bottom-3 right-4 p-2 rounded-full border shadow-lg transition-colors z-30",
                  nightVisionOn ? "bg-eerie/20 border-eerie text-eerie" : "bg-abyss border-smoke/30 text-ash hover:text-bone"
                )}
                title="Toggle Night Vision"
              >
                <Moon className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden md:block flex-1">
               <AnomalyCodex />
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Decision Panel at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-abyss">
        <DecisionPanel 
          onServe={handleServe}
          onReport={handleReport}
          disabled={isDecisionDisabled}
          customerName={currentTurn?.playerName || null}
        />
      </div>
    </div>
  );
}
