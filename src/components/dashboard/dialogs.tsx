"use client";

import { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";

/**
 * Shared dialog plumbing: close on Escape, focus the dialog on open, and
 * return focus to whatever opened it when it unmounts.
 *
 * @param onClose - Called when the user dismisses the dialog (Escape).
 * @returns A ref to attach to the focusable dialog container.
 */
function useDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [onClose]);

  return dialogRef;
}

interface QuickLogSheetProps {
  /** Called when the sheet should close (backdrop click, Escape, or close button). */
  onClose: () => void;
  /** Content rendered inside the sheet — typically the activity logger. */
  children: React.ReactNode;
}

/** Bottom-sheet modal opened by the mobile floating action button. */
export function QuickLogSheet({ onClose, children }: QuickLogSheetProps) {
  const dialogRef = useDialog(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-heading"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-t-2xl border border-stone-200 bg-white p-6 pb-8 shadow-xl outline-none dark:border-stone-700 dark:bg-stone-900 sm:rounded-2xl sm:pb-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="quick-log-heading"
            className="text-sm font-semibold text-stone-900 dark:text-stone-50"
          >
            Log an activity
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const SHORTCUTS = [
  { keys: ["Ctrl", "N"], label: "Focus the activity input" },
  { keys: ["Ctrl", "Z"], label: "Undo the last action" },
  { keys: ["Ctrl", "E"], label: "Export your data as JSON" },
  { keys: ["?"], label: "Toggle this help panel" },
];

interface ShortcutsModalProps {
  /** Called when the modal should close. */
  onClose: () => void;
}

/** Modal listing the app's keyboard shortcuts, toggled with `?`. */
export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const dialogRef = useDialog(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl outline-none dark:border-stone-700 dark:bg-stone-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="shortcuts-heading"
            className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-50"
          >
            <Keyboard
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts panel"
            className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.label}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-stone-600 dark:text-stone-300">
                {shortcut.label}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
          Shortcuts are inactive when an input is focused.
        </p>
      </div>
    </div>
  );
}
