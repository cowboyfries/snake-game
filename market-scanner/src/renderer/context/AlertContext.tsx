import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AlertEvent } from '../../shared/types';

interface Toast {
  id: number;
  event: AlertEvent;
}

interface AlertContextValue {
  toasts: Toast[];
  dismissToast: (id: number) => void;
}

const AlertContext = createContext<AlertContextValue>({
  toasts: [],
  dismissToast: () => {},
});

export function useAlertContext() {
  return useContext(AlertContext);
}

const SOUND_PATHS: Record<string, string> = {
  default: 'alert-default.mp3',
  urgent: 'alert-urgent.mp3',
  success: 'alert-success.mp3',
  warning: 'alert-warning.mp3',
};

let nextToastId = 0;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const playSound = useCallback((sound: string, volume: number) => {
    if (sound === 'none') return;
    try {
      const filename = SOUND_PATHS[sound] || SOUND_PATHS.default;
      const audio = new Audio(`./sounds/${filename}`);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => { /* Audio play failed, ignore */ });
    } catch { /* skip */ }
  }, []);

  useEffect(() => {
    const cleanup = window.api.onAlertTriggered((event: AlertEvent) => {
      const id = ++nextToastId;
      setToasts(prev => [...prev, { id, event }]);

      // Play sound
      playSound(event.sound, event.volume);

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 8000);
    });

    return cleanup;
  }, [playSound]);

  return (
    <AlertContext.Provider value={{ toasts, dismissToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className="toast">
              <div className="toast-title">Alert: {toast.event.symbol}</div>
              <div className="toast-body">{toast.event.message}</div>
            </div>
          ))}
        </div>
      )}
    </AlertContext.Provider>
  );
}
