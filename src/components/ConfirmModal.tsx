'use client';

import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  isDanger = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-center">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <AlertTriangle className={`w-8 h-8 ${isDanger ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>

        <h2 className="text-2xl font-black mb-2">{title}</h2>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 text-white py-4 rounded-xl font-bold text-sm transition-colors ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-[#5FC36C] hover:bg-[#4CAF50]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}