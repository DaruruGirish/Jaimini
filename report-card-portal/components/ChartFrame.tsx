"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function ChartFrame({
  children,
  height = 288,
}: {
  children: (size: { width: number; height: number }) => ReactNode;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(0, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t = window.setTimeout(update, 50);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} className="w-full min-w-0" style={{ height }}>
      {width > 20 ? children({ width, height }) : <div className="h-full w-full rounded-lg bg-slate-50" />}
    </div>
  );
}
