import React, { useState, useRef, useEffect } from 'react';

interface DraggableChatHeadProps {
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  bottomOffset?: number;
  rightOffset?: number;
  className?: string;
  onPositionChange?: (x: number, y: number) => void;
}

/**
 * DraggableChatHead
 *
 * Wraps any content (e.g. the floating Activity Feed button) and makes it
 * behave like a messenger chat head: the user can grab and drag it around the
 * viewport. The element snaps to the nearest horizontal edge when released,
 * and its vertical position is preserved within bounds.
 */
export const DraggableChatHead: React.FC<DraggableChatHeadProps> = ({
  children,
  initialX,
  initialY,
  bottomOffset = 24,
  rightOffset = 24,
  className = '',
  onPositionChange,
}) => {
  const [position, setPosition] = useState<{ x: number | null; y: number | null }>({
    x: initialX ?? null,
    y: initialY ?? null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const hasRestoredPosition = useRef(false);

  // Restore persisted position from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('draggableChatHeadPosition');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition({ x: parsed.x, y: parsed.y });
          hasRestoredPosition.current = true;
          return;
        }
      }
    } catch {
      // Ignore corrupt storage
    }
    if (initialX != null && initialY != null) {
      setPosition({ x: initialX, y: initialY });
    }
  }, [initialX, initialY]);

  // Persist position when dragging ends
  useEffect(() => {
    if (!isDragging && position.x != null && position.y != null) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'draggableChatHeadPosition',
            JSON.stringify({ x: position.x, y: position.y })
          );
        } catch {
          // Ignore storage errors
        }
      }
      onPositionChange?.(position.x, position.y);
    }
  }, [isDragging, position.x, position.y, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start dragging when grabbing the handle itself, not buttons inside
    if ((e.target as HTMLElement).closest('button, a, input, textarea')) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rect = elementRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = rect.width;
      const height = rect.height;

      // Compute new top-left position
      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;

      // Keep element within viewport bounds
      const minX = 0;
      const maxX = Math.max(0, viewportWidth - width);
      const minY = 0;
      const maxY = Math.max(0, viewportHeight - height);

      newX = Math.min(Math.max(newX, minX), maxX);
      newY = Math.min(Math.max(newY, minY), maxY);

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Compute inline style: if position is set, use pixel offsets; otherwise fall
  // back to the right/bottom offsets provided by the consumer via className.
  const style: React.CSSProperties = {};
  if (position.x != null && position.y != null) {
    style.left = `${position.x}px`;
    style.top = `${position.y}px`;
    style.right = 'auto';
    style.bottom = 'auto';
  } else {
    style.right = `${rightOffset}px`;
    style.bottom = `${bottomOffset}px`;
  }

  return (
    <div
      ref={elementRef}
      className={`fixed z-40 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default DraggableChatHead;