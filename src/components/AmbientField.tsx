import { useEffect, useRef } from "react";

/** Decorative light field, limited to 30fps and suspended outside the viewport. */
export function AmbientField({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    let width = 1;
    let height = 1;
    let frame = 0;
    let lastFrame = 0;
    let visible = true;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const parent = element.parentElement!;
    function draw(time: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;
      const centerX = width * 0.75 + pointer.x * 16;
      const centerY = height * 0.47 + pointer.y * 12;
      const radius = Math.min(width * 0.32, height * 0.5);
      const glow = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 1.4,
      );
      glow.addColorStop(0, "rgba(38, 124, 98, 0.18)");
      glow.addColorStop(0.5, "rgba(24, 106, 91, 0.08)");
      glow.addColorStop(1, "rgba(2, 10, 9, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      for (let orbit = 0; orbit < 3; orbit++) {
        context.beginPath();
        for (let segment = 0; segment <= 180; segment++) {
          const angle = (segment / 180) * Math.PI * 2;
          const wave = 1 + Math.sin(angle * 3 + time * 0.00016 + orbit) * 0.07;
          const x = Math.cos(angle) * radius * wave;
          const y = Math.sin(angle) * radius * (0.62 + orbit * 0.11) * wave;
          const rotation =
            -0.65 + orbit * 0.43 + Math.sin(time * 0.00007) * 0.14;
          const px = centerX + x * Math.cos(rotation) - y * Math.sin(rotation);
          const py = centerY + x * Math.sin(rotation) + y * Math.cos(rotation);
          if (segment === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
        context.strokeStyle = `rgba(169, 246, 218, ${0.06 + orbit * 0.018})`;
        context.lineWidth = 1;
        context.stroke();
      }
      const count = width < 600 ? 22 : 46;
      for (let index = 0; index < count; index++) {
        const angle = index * 2.39996 + time * 0.000018;
        const distance = radius * (0.5 + ((index * 37) % 100) / 90);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance * 0.8;
        context.fillStyle = `rgba(184, 255, 226, ${0.12 + Math.sin(index + time * 0.0005) * 0.1})`;
        context.fillRect(
          x,
          y,
          index % 7 === 0 ? 2 : 1,
          index % 7 === 0 ? 2 : 1,
        );
      }
    }
    function animate(time: number) {
      if (time - lastFrame >= 1000 / 30) {
        draw(time);
        lastFrame = time;
      }
      frame = requestAnimationFrame(animate);
    }
    function updateActivity() {
      cancelAnimationFrame(frame);
      if (active && visible && !document.hidden)
        frame = requestAnimationFrame(animate);
      else draw(0);
    }
    const resize = new ResizeObserver(() => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(0);
    });
    resize.observe(parent);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateActivity();
    });
    observer.observe(element);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = parent.getBoundingClientRect();
      pointer.targetX = (event.clientX - bounds.left) / width - 0.5;
      pointer.targetY = (event.clientY - bounds.top) / height - 0.5;
    };
    parent.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", updateActivity);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      parent.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", updateActivity);
    };
  }, [active]);
  return (
    <canvas
      ref={canvas}
      className="ambient-field"
      aria-hidden="true"
      data-state={active ? "running" : "static"}
    />
  );
}
