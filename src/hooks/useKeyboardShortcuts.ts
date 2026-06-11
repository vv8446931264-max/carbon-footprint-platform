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
      // Don't fire when the user is typing in a form field or editable region
      const target = event.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target.isContentEditable) return;

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
