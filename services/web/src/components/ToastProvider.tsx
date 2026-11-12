import { X, CircleAlert } from 'lucide-react';
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  createContext
} from 'react';

import type { ReactNode } from 'react';

const TOAST_TIMEOUT_MS = 4000;

const TOAST_LIMIT = 3;

type Toast = { id: number; title: string };

type ToastItemProps = {
  toast: Toast;
  onClose: (id: number) => void;
};

export const ToastContext = createContext<(title: string) => void>(() => {});

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), TOAST_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-toast-border bg-toast p-3 text-toast-foreground shadow-toast"
    >
      <span className="mt-0.5 flex shrink-0 [&_svg]:size-4">
        <CircleAlert aria-hidden="true" className="text-toast-error" />
      </span>
      <p className="m-0 min-w-0 flex-1 text-sm leading-5 font-medium">
        {toast.title}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onClose(toast.id)}
        className="-mt-0.5 -mr-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-toast-icon hover:bg-toast-raised hover:text-toast-icon-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toast-link focus-visible:ring-offset-2 focus-visible:ring-offset-toast"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const close = useCallback(
    (id: number) => setToasts((all) => all.filter((item) => item.id !== id)),
    []
  );
  const show = useMemo(() => {
    let nextId = 0;

    return (title: string) =>
      setToasts((all) => [...all, { id: nextId++, title }].slice(-TOAST_LIMIT));
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div className="fixed right-4 bottom-4 z-[80] flex w-[min(22rem,calc(100vw-32px))] flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={close} />
        ))}
      </div>
    </ToastContext>
  );
}
