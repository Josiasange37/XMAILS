"use client";
import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

const ToastContext = React.createContext<{
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}>({ toasts: [], addToast: () => {}, removeToast: () => {} });

function ToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { x: 100, opacity: 0, scale: 0.9 },
      { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  }, []);

  const handleDismiss = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      x: 100,
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: onRemove,
    });
  };

  const iconMap = {
    default: Info,
    success: CheckCircle2,
    destructive: AlertCircle,
  };
  const Icon = iconMap[toast.variant || "default"];

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border p-4 shadow-xl max-w-sm flex gap-3 items-start",
        toast.variant === "destructive"
          ? "bg-red-950 border-red-800 text-red-200"
          : toast.variant === "success"
          ? "bg-green-950 border-green-800 text-green-200"
          : "bg-card border-card-border text-foreground"
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addToast = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        ref={containerRef}
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-full sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
