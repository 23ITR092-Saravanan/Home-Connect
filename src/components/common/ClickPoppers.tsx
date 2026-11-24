import React, { useEffect, useState } from 'react';

interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  rotation: number;
  char?: string;
}

interface Ripple {
  id: string;
  x: number;
  y: number;
  color: string;
}

const COLORS = [
  '#f59e0b', // amber
  '#f97316', // orange
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#eab308', // yellow
];

const ICONS = ['✦', '★', '●', '▲', '✿', '◆'];

export const ClickPoppers: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Check if target or parent is a clickable button or interactive element
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest('button, [role="button"], .btn-cartoon-pop, a[href]');
      if (!clickable) return;

      const x = e.clientX;
      const y = e.clientY;

      // Choose a random highlight color for ripple
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

      const rippleId = `rip-${Date.now()}-${Math.random()}`;
      setRipples((prev) => [...prev, { id: rippleId, x, y, color: randomColor }]);

      // Generate 12-16 celebratory popper confetti particles
      const newParticles: Particle[] = [];
      const particleCount = 14;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.4 - 0.2);
        const distance = 40 + Math.random() * 45;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 15; // slightly upward bias
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = Math.floor(Math.random() * 6) + 7;
        const rotation = (Math.random() - 0.5) * 360;
        const char = Math.random() > 0.4 ? ICONS[Math.floor(Math.random() * ICONS.length)] : undefined;

        newParticles.push({
          id: `p-${Date.now()}-${i}-${Math.random()}`,
          x,
          y,
          dx,
          dy,
          color,
          size,
          rotation,
          char,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      // Clean up after animation finishes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 550);

      const idsToRemove = new Set(newParticles.map((p) => p.id));
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !idsToRemove.has(p.id)));
      }, 700);
    };

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* Ripple Wave Rings */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="popper-ripple"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: '32px',
            height: '32px',
            border: `2px solid ${r.color}`,
            boxShadow: `0 0 16px ${r.color}55`,
          }}
        />
      ))}

      {/* Bursting Confetti & Sparkle Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="popper-particle flex items-center justify-center font-bold select-none"
          style={
            {
              left: `${p.x}px`,
              top: `${p.y}px`,
              color: p.color,
              fontSize: `${p.size}px`,
              '--pop-x': `${p.dx}px`,
              '--pop-y': `${p.dy}px`,
              '--pop-rot': `${p.rotation}deg`,
            } as React.CSSProperties
          }
        >
          {p.char || (
            <span
              className="block rounded-full"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 6px ${p.color}88`,
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
};
