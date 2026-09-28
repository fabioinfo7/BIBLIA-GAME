import { useCallback, useRef, useState } from "react";

export type DropTargets = Record<string, HTMLElement | null>;

/**
 * Arrastar com o dedo ou com o mouse, feito para mãos pequenas:
 * qualquer toque dentro do item já inicia o arraste.
 */
export function useDragItem(opts: {
  targets: () => DropTargets;
  onDrop: (targetId: string) => boolean | void;
  disabled?: boolean;
}) {
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const hitTest = useCallback(
    (x: number, y: number) => {
      const targets = opts.targets();
      for (const [id, el] of Object.entries(targets)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left - 24 && x <= r.right + 24 && y >= r.top - 24 && y <= r.bottom + 24) {
          return id;
        }
      }
      return null;
    },
    [opts],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (opts.disabled) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setOffset({ x: 0, y: 0 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
    setHover(hitTest(e.clientX, e.clientY));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    const id = hitTest(e.clientX, e.clientY);
    start.current = null;
    setHover(null);
    if (id) {
      const kept = opts.onDrop(id);
      if (kept !== false) {
        setOffset(null);
        return;
      }
    }
    setOffset(null);
  };

  return {
    dragging: offset !== null && (offset.x !== 0 || offset.y !== 0),
    hover,
    style: offset
      ? {
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.12)`,
          transition: "none" as const,
          zIndex: 40,
          touchAction: "none" as const,
        }
      : { touchAction: "none" as const },
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
