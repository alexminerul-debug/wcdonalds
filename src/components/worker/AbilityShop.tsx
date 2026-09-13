import React from 'react';
import { ABILITY_ITEMS } from '@/shared/constants';
import { HorrorButton } from '@/components/ui/HorrorButton';
import { ShoppingCart, Check } from 'lucide-react';

interface AbilityShopProps {
  balance: number;
  ownedAbilities: string[];
  onPurchase: (abilityId: string) => void;
}

export function AbilityShop({ balance, ownedAbilities, onPurchase }: AbilityShopProps) {
  return (
    <div className="flex flex-col h-full bg-void border border-smoke/30 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-abyss border-b border-smoke/30">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-glow" />
          <h2 className="font-mono text-amber-glow font-bold">BLACK MARKET</h2>
        </div>
        <div className="font-mono text-safe">FUNDS: ${balance.toFixed(2)}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {ABILITY_ITEMS.map((ability) => {
          const isOwned = ownedAbilities.includes(ability.id);
          const canAfford = balance >= ability.price;

          return (
            <div key={ability.id} className="flex flex-col p-4 bg-abyss border border-smoke/20 rounded gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ability.emoji}</span>
                  <div>
                    <h3 className="font-mono text-bone text-sm font-bold">{ability.name}</h3>
                    <div className="font-mono text-amber-glow text-xs">${ability.price}</div>
                  </div>
                </div>
                {ability.duration && (
                  <span className="font-mono text-[10px] bg-smoke/20 text-ash px-2 py-1 rounded">
                    {ability.duration} TURNS
                  </span>
                )}
              </div>
              
              <p className="font-mono text-xs text-ash">{ability.description}</p>
              
              <HorrorButton
                variant={isOwned ? "safe" : "primary"}
                size="sm"
                disabled={isOwned || !canAfford}
                onClick={() => onPurchase(ability.id)}
                className="w-full mt-2"
              >
                {isOwned ? (
                  <>
                    <Check className="w-4 h-4" /> ACTIVE
                  </>
                ) : (
                  'PURCHASE'
                )}
              </HorrorButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
