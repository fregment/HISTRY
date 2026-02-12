import type { ReactNode } from 'react';

interface BarContainerProps {
  isVisible: boolean;
  children: ReactNode;
}

export const BarContainer = ({ isVisible, children }: BarContainerProps) => (
  <div
    className={`fixed left-0 top-0 z-[2147483647] flex w-full items-center border-b border-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-200 ease-in-out ${isVisible ? 'h-auto min-h-[36px]' : 'h-[28px]'}`}
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
    {children}
  </div>
);
