import React from 'react';
import { MENU_ITEMS } from '@/shared/constants';

interface MenuGridProps {
  onAddItem: (menuItemId: string) => void;
}

export function MenuGrid({ onAddItem }: MenuGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onAddItem(item.id)}
          className="flex flex-col items-center justify-center p-4 bg-void border border-smoke/30 rounded-lg hover:border-amber-glow hover:bg-abyss transition-all duration-200 active:scale-95 group"
        >
          <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{item.emoji}</span>
          <span className="font-mono text-sm text-bone text-center">{item.name}</span>
          <span className="font-mono text-amber-glow mt-1">${item.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
