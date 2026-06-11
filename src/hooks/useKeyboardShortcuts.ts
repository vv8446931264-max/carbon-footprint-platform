"use client";

import { useEffect } from "react";

interface Shortcut {
  /** Key character, case-insensitive */
  key: string;
  /** Requires Ctrl / Cmd */
  ctrl?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Don't fire when the user is typing in an input / textarea
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      for (const shortcut of shortcuts) {
        const ctrlOk = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

        if (ctrlOk && event.key.toLowerCase() === shortcut.key.toLowerCase()) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
