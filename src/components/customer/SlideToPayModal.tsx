import React, { useState, useRef } from "react";
import type { CartItem } from "@/shared/types";
import { ChevronUp, CheckCircle, CreditCard, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { vibratePayment } from "@/lib/effects/haptics";

interface SlideToPayModalProps {
  total?: number;
  items?: CartItem[];
  onPaymentComplete: () => void;
}

export function SlideToPayModal({ total = 0, items = [], onPaymentComplete }: SlideToPayModalProps) {
  const { t } = useTranslation();
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const safeTotal = typeof total === "number" && !isNaN(total) && total > 0 ? total : 5.0;
  const safeItems: CartItem[] = Array.isArray(items) && items.length > 0 ? items : [
    {
      menuItem: { id: "order_item", name: "WcMeal Order", price: safeTotal, emoji: "🍔" },
      quantity: 1,
    },
  ];

  const triggerSuccess = () => {
    if (isSuccess) return;
    setIsSuccess(true);
    try {
      vibratePayment();
    } catch {}
    // Short 200ms delay for visual feedback before dispatching payment
    setTimeout(() => {
      onPaymentComplete();
    }, 200);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isSuccess) return;
    const y = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setStartY(y);
    setCurrentY(y);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isSuccess || startY === null) return;
    const y = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (y <= startY) {
      setCurrentY(y);
      const dragDistance = startY - y;
      const threshold = containerRef.current
        ? Math.min(containerRef.current.clientHeight * 0.25, 120)
        : 120;

      if (dragDistance > threshold) {
        triggerSuccess();
      }
    }
  };

  const handleTouchEnd = () => {
    if (isSuccess) return;
    setStartY(null);
    setCurrentY(null);
  };

  // Calculate progress for visual feedback (0 to 1)
  let progress = 0;
  if (startY !== null && currentY !== null && containerRef.current) {
    const dragDistance = Math.max(0, startY - currentY);
    const threshold = Math.min(containerRef.current.clientHeight * 0.25, 120);
    progress = Math.min(1, dragDistance / threshold);
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] flex flex-col justify-between overflow-hidden touch-none select-none bg-void/95 backdrop-blur-sm transition-colors duration-200 p-4 pb-8"
      style={{
        backgroundColor: isSuccess ? "rgba(0,255,0,0.25)" : `rgba(0, 255, 0, ${progress * 0.15})`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Top Header & Total */}
      <div className="w-full max-w-md mx-auto pt-6 text-center pointer-events-none">
        <h2 className="text-xl md:text-2xl font-mono text-bone uppercase tracking-widest mb-1">
          {t("orderSummary")}
        </h2>
        <div className="text-4xl md:text-5xl font-mono font-bold text-safe tracking-tight">
          ${safeTotal.toFixed(2)}
        </div>
      </div>

      {/* Itemized Receipt */}
      <div className="w-full max-w-md mx-auto my-auto max-h-[35vh] overflow-y-auto custom-scrollbar bg-abyss/90 border border-smoke/30 rounded-lg p-4 pointer-events-auto">
        <ul className="space-y-2.5">
          {safeItems.map((item, idx) => {
            const name = item?.menuItem?.name || "Order Item";
            const emoji = item?.menuItem?.emoji || "🍔";
            const price = typeof item?.menuItem?.price === "number" ? item.menuItem.price : safeTotal;
            const qty = typeof item?.quantity === "number" ? item.quantity : 1;

            return (
              <li
                key={`${item?.menuItem?.id || idx}-${idx}`}
                className="flex justify-between items-center text-bone font-mono text-sm"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-base">{emoji}</span>
                  <span className="truncate">
                    {qty}x {name}
                  </span>
                </div>
                <span className="font-bold shrink-0 ml-2">
                  ${(price * qty).toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Payment Actions Container */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-3 pointer-events-auto">
        {isSuccess ? (
          <div className="flex flex-col items-center animate-bounce py-4">
            <CheckCircle className="w-16 h-16 text-safe bg-void rounded-full" />
            <p className="mt-2 font-mono text-safe text-lg uppercase tracking-widest font-bold">
              {t("paymentAccepted")}
            </p>
          </div>
        ) : (
          <>
            {/* Primary: Quick Instant Tap Button (Supports both touch and click) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSuccess();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                triggerSuccess();
              }}
              className="w-full py-4 px-6 bg-safe text-abyss font-mono font-black text-lg md:text-xl rounded-xl shadow-lg shadow-safe/20 active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-safe uppercase tracking-wider cursor-pointer pointer-events-auto select-none"
            >
              <Zap className="w-6 h-6 fill-current animate-pulse" />
              <span>{t("tapToPay")}</span>
            </button>

            {/* Secondary: Slide Indicator */}
            <div
              className="w-full flex flex-col items-center pt-1"
              style={{
                transform:
                  startY !== null && currentY !== null && startY > currentY
                    ? `translateY(${currentY - startY}px)`
                    : undefined,
              }}
            >
              <div className="flex flex-col items-center space-y-[-8px] text-safe/70 opacity-70 animate-pulse">
                <ChevronUp className="w-6 h-6" />
                <ChevronUp className="w-6 h-6" />
              </div>

              <div className="flex items-center space-x-2 text-safe/80 font-mono text-xs uppercase tracking-wider mt-1">
                <CreditCard className="w-4 h-4" />
                <span>{t("slideUpToPay")}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
