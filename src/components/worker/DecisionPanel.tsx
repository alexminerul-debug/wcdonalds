import React, { useState, useEffect } from 'react';
import { HorrorButton } from '@/components/ui/HorrorButton';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface DecisionPanelProps {
  onServe: () => void;
  onReport: () => void;
  disabled: boolean;
  customerName: string | null;
}

export function DecisionPanel({ onServe, onReport, disabled, customerName }: DecisionPanelProps) {
  const [armedAction, setArmedAction] = useState<'serve' | 'report' | null>(null);

  useEffect(() => {
    if (armedAction) {
      const timer = setTimeout(() => setArmedAction(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [armedAction]);

  const handleServe = () => {
    if (armedAction === 'serve') {
      onServe();
      setArmedAction(null);
    } else {
      setArmedAction('serve');
    }
  };

  const handleReport = () => {
    if (armedAction === 'report') {
      onReport();
      setArmedAction(null);
    } else {
      setArmedAction('report');
    }
  };

  return (
    <div className="w-full bg-abyss border-t border-smoke/30 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center font-mono text-sm text-ash mb-3 h-5">
          {customerName ? `DECISION REQUIRED FOR: ${customerName.toUpperCase()}` : 'WAITING FOR CUSTOMER...'}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <HorrorButton
            variant="safe"
            size="lg"
            disabled={disabled || (armedAction !== null && armedAction !== 'serve')}
            onClick={handleServe}
            className="w-full relative overflow-hidden group"
          >
            <CheckCircle className="w-6 h-6" />
            {armedAction === 'serve' ? 'CONFIRM SERVE' : 'SERVE ORDER'}
          </HorrorButton>

          <HorrorButton
            variant="danger"
            size="lg"
            disabled={disabled || (armedAction !== null && armedAction !== 'report')}
            onClick={handleReport}
            className="w-full relative overflow-hidden group"
          >
            <AlertTriangle className="w-6 h-6" />
            {armedAction === 'report' ? 'CONFIRM ALARM' : 'REPORT ANOMALY'}
          </HorrorButton>
        </div>
      </div>
    </div>
  );
}
