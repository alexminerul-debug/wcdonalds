import React from 'react';
import type { CartItem, ClientMessage } from '@/shared/types';
import { MenuGrid } from './MenuGrid';
import { Cart } from './Cart';

interface POSRegisterProps {
  sendMessage: (msg: ClientMessage) => void;
  cartItems: CartItem[];
  workerBalance: number;
  currentCustomerName: string | null;
  isPaymentPending: boolean;
}

export function POSRegister({ sendMessage, cartItems, workerBalance, currentCustomerName, isPaymentPending }: POSRegisterProps) {
  
  const handleAddItem = (menuItemId: string) => {
    sendMessage({ type: 'add-to-cart', menuItemId });
  };

  const handleRemoveItem = (menuItemId: string) => {
    sendMessage({ type: 'remove-from-cart', menuItemId });
  };

  const handleClearCart = () => {
    sendMessage({ type: 'clear-cart' });
  };

  const handleRequestPayment = () => {
    sendMessage({ type: 'request-payment' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-void border border-smoke/30 rounded-lg overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-abyss border-b border-smoke/30">
        <div>
          <h2 className="font-mono text-amber-glow font-bold text-lg tracking-widest">POS_TERM_01</h2>
          <div className="font-mono text-sm text-ash mt-1">
            {currentCustomerName ? (
              <span className="text-bone">NOW SERVING: <span className="text-safe">{currentCustomerName.toUpperCase()}</span></span>
            ) : (
              <span className="text-smoke">NO CUSTOMER AT COUNTER</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-ash text-xs">BANK BALANCE</div>
          <div className="font-mono text-safe text-xl">${workerBalance.toFixed(2)}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-smoke/30">
          <MenuGrid onAddItem={handleAddItem} />
        </div>
        <div className="w-full md:w-80 h-64 md:h-full flex-shrink-0">
          <Cart 
            items={cartItems}
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
