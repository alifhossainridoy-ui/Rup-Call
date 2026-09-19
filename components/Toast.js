'use client';

import { useState, useEffect, useCallback } from 'react';

const toastContext = [];

export function useToast() {
  return useCallback((message, type = 'info') => {
    const id = Math.random();
    const toast = { id, message, type };
    toastContext.push(toast);

    // Trigger re-render by dispatching custom event
    window.dispatchEvent(new CustomEvent('toast', { detail: toast }));

    // Auto-remove after 3 seconds
    setTimeout(() => {
      const index = toastContext.findIndex((t) => t.id === id);
      if (index > -1) toastContext.splice(index, 1);
      window.dispatchEvent(new CustomEvent('toast-remove', { detail: { id } }));
    }, 3000);
  }, []);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      setToasts((prev) => [...prev, e.detail]);
    };

    const handleRemove = (e) => {
      setToasts((prev) => prev.filter((t) => t.id !== e.detail.id));
    };

    window.addEventListener('toast', handleToast);
    window.addEventListener('toast-remove', handleRemove);

    return () => {
      window.removeEventListener('toast', handleToast);
      window.removeEventListener('toast-remove', handleRemove);
    };
  }, []);

  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2 pointer-events-none md:bottom-4 md:right-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${typeClasses[toast.type] || typeClasses.info} text-white px-4 py-3 rounded-lg shadow-lg pointer-events-auto animate-fade-in`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
