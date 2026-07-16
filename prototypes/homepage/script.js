// DevStash homepage prototype — interactions & animations.
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ─── Footer year ─────────────────────────────────────────────── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─── Navbar: grow opaque on scroll ───────────────────────────── */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ─── Scroll reveal (fade in on view) ─────────────────────────── */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    // The AI demo triggers its tag animation when it scrolls in.
    const aiDemo = document.querySelector(".ai__demo");
    if (aiDemo) {
      const demoIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              demoIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      demoIo.observe(aiDemo);
    }
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ─── Pricing: monthly / yearly toggle ────────────────────────── */
  const toggleOpts = document.querySelectorAll(".billing-toggle__opt");
  const swapAttr = (period) => {
    document.querySelectorAll("[data-" + period + "]").forEach((el) => {
      const val = el.getAttribute("data-" + period);
      if (val !== null) el.textContent = val;
    });
  };
  toggleOpts.forEach((opt) => {
    opt.addEventListener("click", () => {
      if (opt.classList.contains("is-active")) return;
      toggleOpts.forEach((o) => o.classList.remove("is-active"));
      opt.classList.add("is-active");
      swapAttr(opt.dataset.period === "yearly" ? "yearly" : "monthly");
    });
  });

  /* ─── Chaos icons: drift, bounce, repel from cursor ───────────── */
  const field = document.getElementById("chaos-field");
  if (field && !prefersReducedMotion) {
    const icons = Array.from(field.querySelectorAll(".chaos-icon"));
    const ICON = 64; // tile size, px — matches CSS
    const ICON_H = 82; // tile + gap + label height, for the bottom bound
    const REPEL_RADIUS = 120;
    const REPEL_FORCE = 0.35;
    const MAX_SPEED = 0.9;

    let bounds = field.getBoundingClientRect();
    const mouse = { x: -9999, y: -9999, active: false };

    // Seed each icon with a random position, velocity, and rotation.
    const particles = icons.map((el) => {
      const maxX = Math.max(bounds.width - ICON, 0);
      const maxY = Math.max(bounds.height - ICON_H, 0);
      return {
        el,
        tile: el.querySelector(".chaos-icon__tile"),
        x: Math.random() * maxX,
        y: Math.random() * maxY,
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6,
        rot: Math.random() * 20 - 10,
        vr: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const clampSpeed = (p) => {
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX_SPEED) {
        p.vx = (p.vx / speed) * MAX_SPEED;
        p.vy = (p.vy / speed) * MAX_SPEED;
      }
    };

    field.addEventListener("mousemove", (e) => {
      const r = field.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    });
    field.addEventListener("mouseleave", () => {
      mouse.active = false;
      mouse.x = mouse.y = -9999;
    });
    window.addEventListener(
      "resize",
      () => {
        bounds = field.getBoundingClientRect();
      },
      { passive: true }
    );

    let raf = null;
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

        // Light damping keeps velocities in a pleasant range.
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
        p.el.style.transform =
          "translate(" + p.x.toFixed(2) + "px," + p.y.toFixed(2) + "px)";

        // … but rotate + pulse only the tile, so the label stays upright.
        p.rot += p.vr;
        const scale = 1 + Math.sin(p.phase) * 0.06;
        if (p.tile) {
          p.tile.style.transform =
            "rotate(" + p.rot.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
        }
      });

      raf = requestAnimationFrame(tick);
    };

    // Only animate while the hero is on screen (saves battery).
    if ("IntersectionObserver" in window) {
      const heroIo = new IntersectionObserver(
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
        { threshold: 0 }
      );
      heroIo.observe(field);
    } else {
      raf = requestAnimationFrame(tick);
    }
  }
})();
