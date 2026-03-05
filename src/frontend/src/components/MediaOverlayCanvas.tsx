import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useRef, useState } from "react";

export interface Overlay {
  id: string;
  type: "sticker" | "text";
  content: string;
  style?: string;
  color?: string;
  x: number; // percent from left
  y: number; // percent from top
}

interface MediaOverlayCanvasProps {
  children: React.ReactNode;
  overlays: Overlay[];
  onRemoveOverlay: (id: string) => void;
  filterStyle?: string;
  className?: string;
}

function OverlayItem({
  overlay,
  onRemove,
}: {
  overlay: Overlay;
  onRemove: (id: string) => void;
}) {
  const [pos, setPos] = useState({ x: overlay.x, y: overlay.y });
  const [isDragging, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPointerRef = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setShowDelete(true);
    const rect = containerRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    startPointerRef.current = {
      px: e.clientX,
      py: e.clientY,
      ox: pos.x,
      oy: pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !startPointerRef.current) return;
    e.stopPropagation();
    const rect = containerRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - startPointerRef.current.px) / rect.width) * 100;
    const dy = ((e.clientY - startPointerRef.current.py) / rect.height) * 100;
    const newX = Math.max(0, Math.min(90, startPointerRef.current.ox + dx));
    const newY = Math.max(0, Math.min(90, startPointerRef.current.oy + dy));
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const getTextStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      color: overlay.color || "#ffffff",
      userSelect: "none",
      cursor: isDragging ? "grabbing" : "grab",
      fontSize: "1.25rem",
      fontWeight: "normal",
    };

    switch (overlay.style) {
      case "Bold":
        return { ...base, fontWeight: "bold", fontSize: "1.25rem" };
      case "Neon":
        return {
          ...base,
          fontWeight: "bold",
          fontSize: "1.25rem",
          textShadow: `0 0 8px ${overlay.color || "#fff"}, 0 0 16px ${overlay.color || "#fff"}`,
        };
      case "Shadow":
        return {
          ...base,
          fontSize: "1.25rem",
          filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.8))",
        };
      case "Outline":
        return {
          ...base,
          fontWeight: "bold",
          fontSize: "1.25rem",
          WebkitTextStroke: `1px ${overlay.color || "#fff"}`,
          color: "transparent",
        };
      default:
        return base;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute select-none"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => !isDragging && setShowDelete(false)}
    >
      {overlay.type === "sticker" ? (
        <span
          className="text-4xl select-none"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {overlay.content}
        </span>
      ) : (
        <span style={getTextStyle()}>{overlay.content}</span>
      )}

      {/* Delete button */}
      {showDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(overlay.id);
          }}
          className={cn(
            "absolute -top-3 -right-3 w-5 h-5 rounded-full flex items-center justify-center text-white z-10",
            "bg-red-500 hover:bg-red-600 transition-colors",
          )}
          aria-label="Remove overlay"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export function MediaOverlayCanvas({
  children,
  overlays,
  onRemoveOverlay,
  filterStyle,
  className,
}: MediaOverlayCanvasProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Media with filter */}
      <div
        className="w-full h-full"
        style={{ filter: filterStyle || undefined }}
      >
        {children}
      </div>

      {/* Overlays */}
      {overlays.map((overlay) => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          onRemove={onRemoveOverlay}
        />
      ))}
    </div>
  );
}
