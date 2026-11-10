'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-[#5FC36C]' : type === 'error' ? 'bg-red-500' : 'bg-[#4A9EDE]';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] flex items-center gap-4 z-[200] animate-fade-in-up`}>
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
        {icon}
      </div>
      <p className="font-bold text-sm">{message}</p>
      <button onClick={onClose} className="ml-4 text-white/70 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
}