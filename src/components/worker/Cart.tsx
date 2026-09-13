import React from 'react';
import type { CartItem } from '@/shared/types';
import { getCartTotal } from '@/shared/constants';
import { X, Trash2, CreditCard, Loader2 } from 'lucide-react';
import { HorrorButton } from '@/components/ui/HorrorButton';

interface CartProps {
  items: CartItem[];
  onRemoveItem: (menuItemId: string) => void;
  onClearCart: () => void;
  onRequestPayment: () => void;
  isPaymentPending: boolean;
}

export function Cart({ items, onRemoveItem, onClearCart, onRequestPayment, isPaymentPending }: CartProps) {
  const total = getCartTotal(items);
  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col h-full bg-void border-l border-smoke/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-ash font-mono opacity-50">
            <span className="text-4xl mb-2">🛒</span>
            <p>Cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.menuItem.id} className="flex items-center justify-between bg-abyss p-3 rounded border border-smoke/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.menuItem.emoji}</span>
                <div>
                  <div className="font-mono text-bone text-sm">{item.menuItem.name}</div>
                  <div className="font-mono text-ash text-xs">
                    {item.quantity} x ${item.menuItem.price.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-amber-glow">${(item.quantity * item.menuItem.price).toFixed(2)}</span>
                <button 
                  onClick={() => onRemoveItem(item.menuItem.id)}
                  className="text-blood hover:text-blood-bright transition-colors"
                  disabled={isPaymentPending}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-smoke/30 bg-abyss">
        <div className="flex justify-between items-center mb-4">
          <span className="font-mono text-ash">TOTAL</span>
          <span className="font-mono text-xl text-amber-glow font-bold">${total.toFixed(2)}</span>
        </div>

        <div className="space-y-3">
          <HorrorButton
            variant="primary"
            className="w-full"
            disabled={isEmpty || isPaymentPending}
            onClick={onRequestPayment}
          >
            {isPaymentPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                WAITING FOR PAYMENT...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                REQUEST PAYMENT
              </>
            )}
          </HorrorButton>

          <button
            onClick={onClearCart}
            disabled={isEmpty || isPaymentPending}
            className="w-full flex items-center justify-center gap-2 text-ash hover:text-blood transition-colors font-mono text-sm py-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
