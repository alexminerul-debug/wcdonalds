import React from 'react';
import { MENU_ITEMS } from '@/shared/constants';
import type { MenuItem, CartItem } from '@/shared/types';

interface MenuGridProps {
  onAddItem: (menuItemId: string) => void;
  allowedItemIds?: string[] | null;
  assignedOrder?: MenuItem[] | null;
  cartItems?: CartItem[];
}

export function MenuGrid({ onAddItem, allowedItemIds, assignedOrder, cartItems = [] }: MenuGridProps) {
  const hasOrder = Boolean(assignedOrder && assignedOrder.length > 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
      {MENU_ITEMS.map((item) => {
        let isAllowed = true;
        let isFulfilled = false;
        let currentQty = 0;
        let targetQty = 0;

        if (hasOrder) {
          targetQty = assignedOrder!.filter((i) => i.id === item.id).length;
          currentQty = cartItems.find((c) => c.menuItem.id === item.id)?.quantity || 0;
          isFulfilled = targetQty > 0 && currentQty >= targetQty;
          isAllowed = targetQty > 0 && currentQty < targetQty;
        } else if (allowedItemIds && allowedItemIds.length > 0) {
          isAllowed = allowedItemIds.includes(item.id);
        }

        return (
          <button
            key={item.id}
            disabled={!isAllowed}
            onClick={() => onAddItem(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded border transition-all duration-150 relative overflow-hidden group ${
              isFulfilled
                ? "bg-safe/10 border-safe/40 cursor-not-allowed text-safe"
                : isAllowed
                ? "bg-void border-smoke/30 hover:border-amber-glow hover:bg-abyss cursor-pointer active:scale-95"
                : "bg-black/40 border-smoke/10 opacity-25 cursor-not-allowed grayscale"
            }`}
          >
            {/* Status indicator badge */}
            {hasOrder && targetQty > 0 && (
              <div
                className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  isFulfilled
                    ? "bg-safe text-black"
                    : "bg-amber-glow text-black"
                }`}
              >
                {isFulfilled ? "✓" : `${currentQty}/${targetQty}`}
              </div>
            )}

            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.emoji}</span>
            <span className="font-mono text-xs text-bone text-center line-clamp-1">{item.name}</span>
            <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px]">
              <span className="text-amber-glow">${item.price.toFixed(2)}</span>
              {hasOrder && !targetQty && (
                <span className="text-[9px] text-fog/60">(NOT IN ORDER)</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
