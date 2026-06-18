"use client";

import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Log a new activity"
      className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/40 transition-all hover:shadow-xl hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 md:hidden"
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
