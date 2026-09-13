import React, { useState } from 'react';
import { getTraitsByCategory } from '@/shared/anomalyTraits';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

export function AnomalyCodex() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    facial: true,
    postural: false,
    gestural: false,
    behavioral: false,
  });

  const traitsByCategory = getTraitsByCategory();

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="flex flex-col h-full bg-void border border-smoke/30 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 bg-abyss hover:bg-abyss/80 transition-colors border-b border-smoke/30"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-glow" />
          <h2 className="font-mono text-amber-glow font-bold">ANOMALY CODEX</h2>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-ash" /> : <ChevronRight className="w-5 h-5 text-ash" />}
      </button>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <p className="font-mono text-xs text-ash mb-4 border-l-2 border-blood pl-2">
            WARNING: Memorize these traits. Anomalies use them to blend in. Do not serve if detected.
          </p>

          {Object.entries(traitsByCategory).map(([category, traits]) => (
            <div key={category} className="border border-smoke/20 rounded overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-2 bg-abyss text-bone font-mono text-sm hover:bg-smoke/10"
              >
                <span className="uppercase">{category} TRAITS</span>
                {expandedCategories[category] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {expandedCategories[category] && (
                <div className="p-2 space-y-2 bg-void">
                  {traits.map(trait => (
                    <div key={trait.id} className="p-2 bg-smoke/5 rounded border border-smoke/10">
                      <p className="font-mono text-xs text-ash leading-relaxed">
                        &gt; {trait.display}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
