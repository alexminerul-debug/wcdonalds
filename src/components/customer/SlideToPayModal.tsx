import React, { useState, useRef, useEffect } from 'react';
import type { CartItem } from '@/shared/types';
import { ChevronUp, CheckCircle, CreditCard } from 'lucide-react';

interface SlideToPayModalProps {
  total: number;
  items: CartItem[];
  onPaymentComplete: () => void;
}

export function SlideToPayModal({ total, items, onPaymentComplete }: SlideToPayModalProps) {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isSuccess) return;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setStartY(y);
    setCurrentY(y);
  };
  
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isSuccess || startY === null) return;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Only allow sliding up
    if (y <= startY) {
      setCurrentY(y);
      
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        const dragDistance = startY - y;
        const threshold = height * 0.6; // 60% of screen
        
        if (dragDistance > threshold) {
          triggerSuccess();
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (isSuccess) return;
    setStartY(null);
    setCurrentY(null);
  };
  
  const triggerSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onPaymentComplete();
    }, 1500);
  };

  // Calculate progress for visual feedback (0 to 1)
  let progress = 0;
  if (startY !== null && currentY !== null && containerRef.current) {
    const dragDistance = Math.max(0, startY - currentY);
    const threshold = containerRef.current.clientHeight * 0.6;
    progress = Math.min(1, dragDistance / threshold);
  }

  // Calculate background color based on progress
  const bgOpacity = 0.1 + (progress * 0.8);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden touch-none select-none bg-void transition-colors duration-200"
      style={{
        backgroundColor: isSuccess ? 'rgba(0,255,0,0.2)' : `rgba(0, 255, 0, ${progress * 0.1})`
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className="flex-1 w-full p-8 flex flex-col pt-20 max-w-md mx-auto pointer-events-none">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-mono text-bone uppercase tracking-widest mb-2">Order Summary</h2>
          <div className="text-5xl font-mono font-bold text-safe">${total.toFixed(2)}</div>
        </div>
        
        <div className="bg-abyss border border-eerie rounded-lg p-4 mb-8">
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li key={`${item.menuItem.id}-${idx}`} className="flex justify-between items-center text-bone font-mono text-sm sm:text-base">
                <div className="flex items-center space-x-2">
                  <span>{item.menuItem.emoji}</span>
                  <span>{item.quantity}x {item.menuItem.name}</span>
                </div>
                <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div 
        className={`w-full flex flex-col items-center pb-20 transition-transform duration-100 ease-out ${isSuccess ? '-translate-y-[40vh]' : ''}`}
        style={{
          transform: !isSuccess && startY !== null && currentY !== null && startY > currentY 
            ? `translateY(${currentY - startY}px)` 
            : undefined
        }}
      >
        {isSuccess ? (
          <div className="flex flex-col items-center animate-bounce">
            <CheckCircle className="w-24 h-24 text-safe bg-void rounded-full" />
            <p className="mt-4 font-mono text-safe text-xl uppercase tracking-widest font-bold">Payment Accepted</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center space-y-[-10px] mb-4 pay-shimmer text-safe opacity-80">
              <ChevronUp className="w-16 h-16" />
              <ChevronUp className="w-16 h-16" />
              <ChevronUp className="w-16 h-16" />
            </div>
            
            <div className="flex items-center space-x-3 bg-abyss border border-safe px-8 py-4 rounded-full">
              <CreditCard className="w-8 h-8 text-safe" />
              <span className="font-mono text-safe font-bold text-xl uppercase tracking-widest">
                Slide up to pay
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
