"use client";

import { useEffect } from "react";
import { Check, Undo2, X } from "lucide-react";

interface ToastProps {
  message: string;
  /** Called when the user clicks "Undo". Omit to hide the undo affordance. */
  onUndo?: () => void;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
}

/**
 * A single, accessible toast with an optional Undo action. Auto-dismisses, but
 * the Undo gives people a safety net after logging — preventing an accidental
 * entry from silently skewing their footprint. Announced politely to screen
 * readers via role="status".
 */
export function Toast({
  message,
  onUndo,
  onDismiss,
  duration = 6000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-stone-700 bg-stone-900 py-2 pl-4 pr-2 text-sm text-stone-50 shadow-lg dark:border-stone-700 dark:bg-stone-800"
    >
      <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
      <span className="truncate">{message}</span>

      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="flex shrink-0 items-center gap-1 rounded-full bg-stone-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-stone-600 focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          Undo
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-700 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
