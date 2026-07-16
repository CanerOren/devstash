"use client";

import { useEffect, useRef } from "react";
import { CHAOS_ICONS } from "./data";

// The hero "chaos field": labelled source icons that drift, bounce off the
// walls, gently pulse/rotate, and repel from the cursor. Each icon is a wrapper
// that only *translates* + an inner tile that *rotates/scales*, so the label
// underneath stays upright. Runs on requestAnimationFrame, only while the field
// is on-screen, and is skipped entirely for reduced-motion users.
interface Particle {
  el: HTMLElement;
  tile: HTMLElement | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  phase: number;
}

const ICON = 64; // tile size, px — matches the w-16/size-16 below
const ICON_H = 82; // tile + gap + label, for the bottom bound
const REPEL_RADIUS = 120;
const REPEL_FORCE = 0.35;
const MAX_SPEED = 0.9;

export function ChaosField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const icons = Array.from(
      field.querySelectorAll<HTMLElement>("[data-chaos-icon]"),
    );
    let bounds = field.getBoundingClientRect();
    const mouse = { x: -9999, y: -9999, active: false };

    const particles: Particle[] = icons.map((el) => {
      const maxX = Math.max(bounds.width - ICON, 0);
      const maxY = Math.max(bounds.height - ICON_H, 0);
      return {
        el,
        tile: el.querySelector<HTMLElement>("[data-tile]"),
        x: Math.random() * maxX,
        y: Math.random() * maxY,
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6,
        rot: Math.random() * 20 - 10,
        vr: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const clampSpeed = (p: Particle) => {
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX_SPEED) {
        p.vx = (p.vx / speed) * MAX_SPEED;
        p.vy = (p.vy / speed) * MAX_SPEED;
      }
    };

    const onMove = (e: MouseEvent) => {
      const r = field.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = mouse.y = -9999;
    };
    const onResize = () => {
      bounds = field.getBoundingClientRect();
    };
    field.addEventListener("mousemove", onMove);
    field.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize, { passive: true });

    let raf: number | null = null;
    const tick = () => {
      const w = bounds.width;
      const h = bounds.height;

      particles.forEach((p) => {
        // Gentle idle sway so motion never fully stops.
        p.phase += 0.02;
        p.vx += Math.cos(p.phase) * 0.006;
        p.vy += Math.sin(p.phase * 0.9) * 0.006;

        // Repel from the cursor.
        if (mouse.active) {
          const cx = p.x + ICON / 2;
          const cy = p.y + ICON / 2;
          const dx = cx - mouse.x;
          const dy = cy - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.01) {
            const strength = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
            p.vx += (dx / dist) * strength;
            p.vy += (dy / dist) * strength;
          }
        }

        // Light damping keeps velocities pleasant.
        p.vx *= 0.99;
        p.vy *= 0.99;
        clampSpeed(p);

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off the walls. ICON_H leaves room for the label below the tile.
        const maxX = w - ICON;
        const maxY = h - ICON_H;
        if (p.x <= 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x >= maxX) {
          p.x = maxX;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y <= 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y >= maxY) {
          p.y = maxY;
          p.vy = -Math.abs(p.vy);
        }

        // Move the wrapper (icon + label) …
        p.el.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)`;

        // … but rotate + pulse only the tile, so the label stays upright.
        p.rot += p.vr;
        const scale = 1 + Math.sin(p.phase) * 0.06;
        if (p.tile) {
          p.tile.style.transform = `rotate(${p.rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        }
      });

      raf = requestAnimationFrame(tick);
    };

    // Only animate while the field is on screen (saves battery).
    let heroIo: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      heroIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              bounds = field.getBoundingClientRect();
              if (!raf) raf = requestAnimationFrame(tick);
            } else if (raf) {
              cancelAnimationFrame(raf);
              raf = null;
            }
          });
        },
        { threshold: 0 },
      );
      heroIo.observe(field);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      field.removeEventListener("mousemove", onMove);
      field.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      if (heroIo) heroIo.disconnect();
    };
  }, []);

  return (
    <div className="min-w-0">
      <span className="mb-3 block text-center text-[0.82rem] font-semibold text-mk-dim">
        Your knowledge today…
      </span>
      <div
        ref={fieldRef}
        aria-hidden="true"
        className="mk-chaos-grid relative h-80 overflow-hidden rounded-[14px] border border-mk-border bg-mk-elevated bg-[radial-gradient(120%_100%_at_50%_0%,rgba(239,68,68,0.06),transparent_60%)]"
      >
        {CHAOS_ICONS.map(({ label, color, Icon }) => (
          <div
            key={label}
            data-chaos-icon
            style={{ "--c": color } as React.CSSProperties}
            className="absolute left-0 top-0 z-[1] flex w-16 flex-col items-center gap-1.5 will-change-transform"
          >
            <div
              data-tile
              className="grid size-16 place-items-center rounded-2xl border border-mk-border-strong bg-mk-surface text-[var(--c)] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)] will-change-transform"
            >
              <Icon className="size-8" />
            </div>
            <span className="pointer-events-none whitespace-nowrap text-[0.62rem] font-semibold text-mk-dim">
              {label}
            </span>
          </div>
        ))}
      </div>
      <span className="mt-3.5 block text-center text-[0.8rem] font-medium text-mk-dim">
        8 apps. Zero organization.
      </span>
    </div>
  );
}
