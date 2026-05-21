import React, { useEffect, useRef } from 'react';

interface SplashScreenProps {
  progress: number;
  status: string;
  onReady?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ progress, status, onReady }) => {
  const hasFired = useRef(false);

  useEffect(() => {
    if (progress >= 100 && onReady && !hasFired.current) {
      hasFired.current = true;
      const timer = setTimeout(onReady, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, onReady]);

  const isLoading = progress < 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-term-bg font-mono">
      {/* Logo */}
      <h1
        className={`text-4xl font-bold tracking-tight select-none mb-6 ${
          isLoading ? 'animate-pulse-green' : ''
        }`}
      >
        <span className="text-term-green">OSINT</span>
        <span className="text-term-dim">//</span>
      </h1>

      {/* Progress bar container */}
      <div className="w-64 h-0.5 bg-term-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-term-green transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Status text */}
      <p className="text-[10px] text-term-secondary tracking-wide">
        {status}
      </p>
    </div>
  );
};
