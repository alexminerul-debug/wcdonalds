import React, { useState, useEffect } from 'react';
import { HorrorButton } from '@/components/ui/HorrorButton';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface DecisionPanelProps {
  onServe: () => void;
  onReport: () => void;
  disabled: boolean;
  customerName: string | null;
}

export function DecisionPanel({ onServe, onReport, disabled, customerName }: DecisionPanelProps) {
  const [armedAction, setArmedAction] = useState<'serve' | 'report' | null>(null);
  const { t } = useTranslation();

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
    <div className="w-full bg-abyss p-2 md:py-2.5 md:px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center font-mono text-[11px] md:text-xs text-ash mb-1.5 h-3.5 truncate">
          {customerName ? `${customerName.toUpperCase()}` : t('waitingCustomer')}
        </div>
        
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <HorrorButton
            variant="safe"
            size="md"
            disabled={disabled || (armedAction !== null && armedAction !== 'serve')}
            onClick={handleServe}
            className="w-full relative overflow-hidden group py-2 md:py-2.5 text-xs font-bold"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{armedAction === 'serve' ? 'CONFIRM SERVE' : t('serveOrder')}</span>
          </HorrorButton>

          <HorrorButton
            variant="danger"
            size="lg"
            disabled={disabled || (armedAction !== null && armedAction !== 'report')}
            onClick={handleReport}
            className="w-full relative overflow-hidden group py-3 md:py-4 text-xs md:text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{armedAction === 'report' ? 'CONFIRM' : t('reportAnomaly')}</span>
          </HorrorButton>
        </div>
      </div>
    </div>
  );
}
