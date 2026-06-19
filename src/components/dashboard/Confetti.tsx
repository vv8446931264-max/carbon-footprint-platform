"use client";

import { useState } from "react";

const CONFETTI_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6"];

/** Number of confetti particles in a celebration burst. */
const PARTICLE_COUNT = 14;

/**
 * A brief, one-shot confetti burst shown when a logging milestone is reached.
 * Particle positions are randomised once via a `useState` lazy initializer so
 * the values stay stable across re-renders (and render stays pure).
 */
export function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: `${6 + Math.random() * 88}%`,
      delay: `${(Math.random() * 0.4).toFixed(2)}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="animate-confetti-fall absolute -top-3 h-2.5 w-2.5 rounded-sm"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}
