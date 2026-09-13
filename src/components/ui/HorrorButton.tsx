import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HorrorButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'safe' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function HorrorButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: HorrorButtonProps) {
  const baseClasses = "font-mono uppercase transition-all duration-200 flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "border-amber-glow text-amber-glow hover:bg-amber-glow/10 hover:shadow-[0_0_15px_rgba(255,191,0,0.3)]",
    danger: "border-blood-bright text-blood-bright hover:bg-blood-bright/10 hover:shadow-[0_0_20px_rgba(255,51,51,0.5)] hover:animate-pulse-glow",
    safe: "border-eerie text-eerie hover:bg-eerie/10 hover:shadow-[0_0_15px_rgba(51,255,51,0.3)]",
    ghost: "border-transparent text-bone hover:bg-bone/5 hover:border-bone/20",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg font-bold",
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
