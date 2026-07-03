import React, { useRef, useEffect } from "react";

/**
 * ParticleSphere
 * A canvas-based particle sphere with cursor dispersion physics,
 * click effects, and motion trails. No 3D library dependency.
 *
 * Props
 * ------
 * particleCount   number   default 3000
 * particleSize    number   default 2
 * colors          string[] default ["#FF5300"]  (cycled/random per particle)
 * speed           number   default 0.3   (base rotation speed)
 * cursorRadius    number   default 120   (px, dispersion field radius)
 * clickForce      number   default 40    (impulse strength on click)
 * clickEffect     "scatter" | "color" | "both"  default "both"
 * trails          boolean  default true
 * trailLength     number   0-1, default 0.85 (higher = longer trails)
 * background      string   default "#0A0A0B"
 * radius          number   default 180 (sphere radius in px)
 */
export default function ParticleSphere({
  particleCount = 3000,
  particleSize = 2,
  colors = ["#FF5300", "#FF8A50", "#FFFFFF"],
  speed = 0.3,
  cursorRadius = 120,
  clickForce = 40,
  clickEffect = "both",
  trails = true,
  trailLength = 0.85,
  background = "#0A0A0B",
  radius = 180,
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null, active: false });
  const angleRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const fadeInRef = useRef(0);

  // --- Build initial particle set using Fibonacci sphere distribution ---
  useEffect(() => {
    const particles = [];
    const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; // -1 to 1
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      particles.push({
        // base (undisturbed) position on unit sphere
        bx: x,
        by: y,
        bz: z,
        // current displaced position (for dispersion physics)
        ox: 0,
        oy: 0,
        oz: 0,
        // velocity for spring-back / impulse
        vx: 0,
        vy: 0,
        vz: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      });
    }
    particlesRef.current = particles;
    fadeInRef.current = 0;
  }, [particleCount, colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, cx, cy;

    const resize = () => {
      const parent = canvas.parentElement;
      width = canvas.width = parent.clientWidth;
      height = canvas.height = parent.clientHeight;
      cx = width / 2;
      cy = height / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = clientX - rect.left;
      mouseRef.current.y = clientY - rect.top;
      mouseRef.current.active = true;
    };

    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseLeave = () => (mouseRef.current.active = false);
    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => (mouseRef.current.active = false);

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const scale = Math.min(width, height) / (radius * 2.4);

      particlesRef.current.forEach((p) => {
        const px = cx + (p.bx + p.ox) * radius * scale;
        const py = cy + (p.by + p.oy) * radius * scale;
        const dx = px - clickX;
        const dy = py - clickY;
        const dist2 = dx * dx + dy * dy;
        const influence = Math.max(0, 1 - dist2 / (cursorRadius * cursorRadius * 4));

        if (influence > 0) {
          if (clickEffect === "scatter" || clickEffect === "both") {
            const len = Math.sqrt(dist2) || 1;
            p.vx += (dx / len) * clickForce * influence * 0.02;
            p.vy += (dy / len) * clickForce * influence * 0.02;
            p.vz += (Math.random() - 0.5) * clickForce * influence * 0.02;
          }
          if (clickEffect === "color" || clickEffect === "both") {
            p.color = colors[Math.floor(Math.random() * colors.length)];
          }
        }
      });
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("click", onClick);

    const render = () => {
      if (fadeInRef.current < 1) fadeInRef.current += 0.02;

      // Trails: draw a translucent rect instead of clearing fully
      if (trails) {
        ctx.fillStyle = hexToRgba(background, 1 - trailLength);
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }

      angleRef.current.y += speed * 0.01;
      angleRef.current.x += speed * 0.004;

      const sinY = Math.sin(angleRef.current.y);
      const cosY = Math.cos(angleRef.current.y);
      const sinX = Math.sin(angleRef.current.x);
      const cosX = Math.cos(angleRef.current.x);

      const scale = Math.min(width, height) / (radius * 2.4);
      const mouse = mouseRef.current;

      // depth-sort for realistic overlap
      const projected = [];

      for (const p of particlesRef.current) {
        // spring back toward base position
        p.vx += -p.ox * 0.02;
        p.vy += -p.oy * 0.02;
        p.vz += -p.oz * 0.02;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.vz *= 0.9;
        p.ox += p.vx * 0.05;
        p.oy += p.vy * 0.05;
        p.oz += p.vz * 0.05;

        let x = p.bx + p.ox;
        let y = p.by + p.oy;
        let z = p.bz + p.oz;

        // rotate around Y then X
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        let y1 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        const px = cx + x1 * radius * scale;
        const py = cy + y1 * radius * scale;

        // cursor dispersion (screen-space distance check, squared)
        if (mouse.active) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < cursorRadius * cursorRadius) {
            const dist = Math.sqrt(distSq) || 1;
            const force = (1 - dist / cursorRadius) * 0.6;
            p.vx += (dx / dist) * force * cosY + (dx / dist) * force * sinY * 0.3;
            p.vy += (dy / dist) * force;
          }
        }

        const perspective = 400 / (400 + z2 * radius * scale * 0.5);
        const depthAlpha = fadeInRef.current * Math.max(0.15, Math.min(1, (z2 + 1.4) / 2.4));
        const size = Math.max(0.4, particleSize * perspective);

        projected.push({ px, py, z2, size, alpha: depthAlpha, color: p.color });
      }

      projected.sort((a, b) => a.z2 - b.z2);

      for (const pt of projected) {
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("click", onClick);
    };
  }, [
    speed,
    cursorRadius,
    clickForce,
    clickEffect,
    trails,
    trailLength,
    background,
    radius,
    particleSize,
    colors,
  ]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
      />
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
