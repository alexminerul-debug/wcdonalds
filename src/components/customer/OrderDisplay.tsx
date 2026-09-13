import React from 'react';
import type { MenuItem } from '@/shared/types';
import { ShoppingBag } from 'lucide-react';

interface OrderDisplayProps {
  items: MenuItem[];
  isAnomaly: boolean;
}

export function OrderDisplay({ items = [], isAnomaly }: OrderDisplayProps) {
  // Group identical items defensively
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const groupedItems = safeItems.reduce((acc, item) => {
    if (!item || !item.id) return acc;
    const existing = acc.find(i => i.menuItem?.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ menuItem: item, quantity: 1 });
    }
    return acc;
  }, [] as { menuItem: MenuItem; quantity: number }[]);

  return (
    <div className={`p-6 rounded-lg bg-abyss border ${isAnomaly ? 'border-blood/30' : 'border-eerie'} w-full max-w-md mx-auto relative overflow-hidden`}>
      {isAnomaly && (
        <div className="absolute top-0 right-0 bg-blood text-void text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl">
          Decoy Order
        </div>
      )}
      
      <div className="flex items-center space-x-3 mb-6 border-b border-eerie pb-4">
        <ShoppingBag className="w-6 h-6 text-bone" />
        <h2 className="text-lg font-mono text-bone uppercase tracking-widest">
          Read this order aloud to the Worker:
        </h2>
      </div>
      
      <ul className="space-y-4">
        {groupedItems.map((group, index) => (
          <li key={`${group.menuItem.id}-${index}`} className="flex items-center justify-between text-xl font-mono">
            <div className="flex items-center space-x-4">
              <span className="text-3xl" role="img" aria-label={group.menuItem.name}>
                {group.menuItem.emoji}
              </span>
              <span className="text-bone">{group.menuItem.name}</span>
            </div>
            <span className="text-blood-bright font-bold">x{group.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
