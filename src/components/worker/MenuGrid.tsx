import React from 'react';
import { MENU_ITEMS } from '@/shared/constants';

interface MenuGridProps {
  onAddItem: (menuItemId: string) => void;
  allowedItemIds?: string[] | null;
}

export function MenuGrid({ onAddItem, allowedItemIds }: MenuGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
      {MENU_ITEMS.map((item) => {
        const isAllowed = !allowedItemIds || allowedItemIds.length === 0 || allowedItemIds.includes(item.id);

        return (
          <button
            key={item.id}
            disabled={!isAllowed}
            onClick={() => onAddItem(item.id)}
            className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all duration-150 active:scale-95 group ${
              isAllowed
                ? "bg-void border-smoke/30 hover:border-amber-glow hover:bg-abyss cursor-pointer"
                : "bg-black/40 border-smoke/10 opacity-30 cursor-not-allowed grayscale"
            }`}
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.emoji}</span>
            <span className="font-mono text-xs text-bone text-center line-clamp-1">{item.name}</span>
            <span className="font-mono text-[11px] text-amber-glow mt-0.5">${item.price.toFixed(2)}</span>
          </button>
        );
      })}
    </div>
  );
}
