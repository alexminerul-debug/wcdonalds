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
    <div className="w-full bg-abyss border-t border-smoke/30 p-3 md:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center font-mono text-xs md:text-sm text-ash mb-2.5 h-4 truncate">
          {customerName ? `${customerName.toUpperCase()}` : t('waitingCustomer')}
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 md:gap-4">
          <HorrorButton
            variant="safe"
            size="lg"
            disabled={disabled || (armedAction !== null && armedAction !== 'serve')}
            onClick={handleServe}
            className="w-full relative overflow-hidden group py-3 md:py-4 text-xs md:text-sm"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{armedAction === 'serve' ? 'CONFIRM' : t('serveOrder')}</span>
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
