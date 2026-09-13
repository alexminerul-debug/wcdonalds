import React, { useState, useEffect } from 'react';
import type { CartItem, ClientMessage } from '@/shared/types';
import { MENU_ITEMS } from '@/shared/constants';
import { MenuGrid } from './MenuGrid';
import { Cart } from './Cart';
import { useTranslation } from '@/lib/i18n';

interface POSRegisterProps {
  sendMessage: (msg: ClientMessage) => void;
  cartItems: CartItem[];
  workerBalance: number;
  currentCustomerName: string | null;
  isPaymentPending: boolean;
  allowedItemIds?: string[] | null;
}

export function POSRegister({
  sendMessage,
  cartItems: serverCartItems,
  workerBalance,
  currentCustomerName,
  isPaymentPending,
  allowedItemIds,
}: POSRegisterProps) {
  const { t } = useTranslation();
  const [localCart, setLocalCart] = useState<CartItem[]>(serverCartItems || []);

  // Synchronize when server updates cart items
  useEffect(() => {
    if (serverCartItems) {
      setLocalCart(serverCartItems);
    }
  }, [serverCartItems]);

  const handleAddItem = (menuItemId: string) => {
    // Enforce: worker can only put the correct items in an order
    if (allowedItemIds && allowedItemIds.length > 0 && !allowedItemIds.includes(menuItemId)) {
      return;
    }

    const item = MENU_ITEMS.find((m) => m.id === menuItemId);
    if (item) {
      setLocalCart((prev) => {
        const existing = prev.find((c) => c.menuItem.id === item.id);
        if (existing) {
          return prev.map((c) =>
            c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [...prev, { menuItem: item, quantity: 1 }];
      });
    }
    sendMessage({ type: 'add-to-cart', menuItemId });
  };

  const handleRemoveItem = (menuItemId: string) => {
    setLocalCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === menuItemId);
      if (idx === -1) return prev;
      if (prev[idx].quantity > 1) {
        return prev.map((c, i) =>
          i === idx ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((_, i) => i !== idx);
    });
    sendMessage({ type: 'remove-from-cart', menuItemId });
  };

  const handleClearCart = () => {
    setLocalCart([]);
    sendMessage({ type: 'clear-cart' });
  };

  const handleRequestPayment = () => {
    sendMessage({ type: 'request-payment', cart: localCart });
  };

  return (
    <div className="flex flex-col h-full w-full bg-void border border-smoke/30 rounded-lg overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-abyss border-b border-smoke/30">
        <div>
          <h2 className="font-mono text-amber-glow font-bold text-lg tracking-widest">POS_TERM_01</h2>
          <div className="font-mono text-sm text-ash mt-1">
            {currentCustomerName ? (
              <span className="text-bone">
                NOW SERVING: <span className="text-safe">{currentCustomerName.toUpperCase()}</span>
              </span>
            ) : (
              <span className="text-smoke">{t('waitingCustomer')}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-ash text-xs">{t('balance').toUpperCase()}</div>
          <div className="font-mono text-safe text-xl font-bold">${workerBalance.toFixed(2)}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-smoke/30">
          <MenuGrid onAddItem={handleAddItem} allowedItemIds={allowedItemIds} />
        </div>
        <div className="w-full md:w-80 h-64 md:h-full flex-shrink-0">
          <Cart 
            items={localCart}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onRequestPayment={handleRequestPayment}
            isPaymentPending={isPaymentPending}
          />
        </div>
      </div>
    </div>
  );
}
