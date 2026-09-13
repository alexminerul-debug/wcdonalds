import React, { useState } from 'react';
import { ANOMALY_TRAITS } from '@/shared/anomalyTraits';
import { ChevronDown, ChevronRight, BookOpen, Search, Eye } from 'lucide-react';
import { clsx } from 'clsx';

export function AnomalyCodex() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    facial: true,
    postural: true,
    gestural: true,
    behavioral: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredTraits = ANOMALY_TRAITS.filter(trait => {
    const matchesSearch = trait.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trait.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (trait.tip && trait.tip.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'all' || trait.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  const traitsByCategory = filteredTraits.reduce((acc, trait) => {
    if (!acc[trait.category]) acc[trait.category] = [];
    acc[trait.category].push(trait);
    return acc;
  }, {} as Record<string, typeof ANOMALY_TRAITS>);

  return (
    <div className="flex flex-col h-full bg-void border border-smoke/30 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 bg-abyss hover:bg-abyss/80 transition-colors border-b border-smoke/30"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-glow" />
          <h2 className="font-mono text-amber-glow font-bold text-sm">ANOMALY FIELD CODEX</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-ash">
          <span>{ANOMALY_TRAITS.length} CATALOGED</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Filters */}
          <div className="p-3 bg-abyss/60 border-b border-smoke/20 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ash" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search traits or tips..."
                className="w-full pl-8 pr-3 py-1.5 bg-void border border-smoke/30 rounded text-xs font-mono text-bone placeholder:text-ash/50 focus:border-amber-glow focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 text-[10px] font-mono">
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={clsx(
                    "px-2 py-0.5 rounded uppercase border transition-colors",
                    selectedDifficulty === diff
                      ? diff === 'easy' ? "bg-emerald-950/80 text-emerald-400 border-emerald-600"
                        : diff === 'medium' ? "bg-amber-950/80 text-amber-400 border-amber-600"
                        : diff === 'hard' ? "bg-blood/40 text-blood-bright border-blood"
                        : "bg-smoke/30 text-bone border-smoke/60"
                      : "bg-void text-ash border-smoke/20 hover:border-smoke/40"
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {Object.keys(traitsByCategory).length === 0 ? (
              <div className="text-center py-6 text-xs text-ash font-mono">
                No anomaly traits match the search criteria.
              </div>
            ) : (
              Object.entries(traitsByCategory).map(([category, traits]) => (
                <div key={category} className="border border-smoke/20 rounded overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-2 bg-abyss text-bone font-mono text-xs hover:bg-smoke/10"
                  >
                    <span className="uppercase font-bold text-ash tracking-wider">{category} ({traits.length})</span>
                    {expandedCategories[category] ? <ChevronDown className="w-3.5 h-3.5 text-ash" /> : <ChevronRight className="w-3.5 h-3.5 text-ash" />}
                  </button>
                  
                  {expandedCategories[category] && (
                    <div className="p-2 space-y-2 bg-void">
                      {traits.map(trait => (
                        <div key={trait.id} className="p-2 bg-smoke/5 rounded border border-smoke/10 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-bone font-semibold leading-relaxed">
                              &gt; {trait.display}
                            </span>
                            {trait.difficulty && (
                              <span className={clsx(
                                "text-[9px] uppercase px-1.5 py-0.2 rounded font-mono shrink-0",
                                trait.difficulty === 'easy' ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                  : trait.difficulty === 'medium' ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                                  : "bg-blood/20 text-blood-bright border border-blood/40"
                              )}>
                                {trait.difficulty}
                              </span>
                            )}
                          </div>
                          {trait.tip && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-glow/90 bg-amber-glow/5 px-1.5 py-0.5 rounded border border-amber-glow/10">
                              <Eye className="w-3 h-3 shrink-0" />
                              <span>TIP: {trait.tip}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
