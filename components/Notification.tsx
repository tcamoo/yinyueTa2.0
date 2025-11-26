
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map((note) => (
        <div 
          key={note.id}
          className={`
            pointer-events-auto min-w-[300px] max-w-md bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right-10 fade-in duration-300
            ${note.type === 'error' ? 'border-red-500/30' : note.type === 'success' ? 'border-brand-lime/30' : 'border-blue-500/30'}
          `}
        >
          <div className={`mt-0.5 ${
            note.type === 'success' ? 'text-brand-lime' : 
            note.type === 'error' ? 'text-red-500' : 'text-blue-400'
          }`}>
             {note.type === 'success' && <CheckCircle className="w-5 h-5" />}
             {note.type === 'error' && <AlertCircle className="w-5 h-5" />}
             {note.type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <div className="flex-1 pt-0.5">
             <p className="text-sm font-bold text-white leading-tight">{note.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(note.id)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
