import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

type DropTarget = { id: string; before: boolean };
type Point = Pick<PointerEvent, "clientX" | "clientY">;
type HandleEvent = PointerEvent<HTMLButtonElement>;

interface Drag {
  id: string;
  pointerId: number;
  card: HTMLElement;
  slot: HTMLElement;
  point: Point;
  offsetX: number;
  offsetY: number;
}

function dropTarget(point: Point, draggedId: string): DropTarget | null {
  const slot = document
    .elementFromPoint(point.clientX, point.clientY)
    ?.closest<HTMLElement>("[data-question-id]");
  const id = slot?.dataset.questionId;
  if (!slot || !id || id === draggedId) return null;
  const { top, height } = slot.getBoundingClientRect();
  return { id, before: point.clientY < top + height / 2 };
}

function positionCard(drag: Drag) {
  const x = drag.point.clientX - drag.offsetX;
  const y = drag.point.clientY - drag.offsetY;
  drag.card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function cancelAnimations(card: HTMLElement) {
  card.getAnimations?.().forEach((animation) => animation.cancel());
}

export function useQuestionDrag(
  onDrop: (id: string, target: DropTarget) => void,
) {
  const builder = useRef<HTMLFieldSetElement>(null);
  const active = useRef<Drag | null>(null);
  const settleFrom = useRef<{
    grabbed: HTMLElement;
    positions: Map<HTMLElement, DOMRect>;
  } | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);

  function updatePosition(drag: Drag) {
    const next = dropTarget(drag.point, drag.id);
    positionCard(drag);
    setTarget((current) =>
      current?.id === next?.id && current?.before === next?.before
        ? current
        : next,
    );
  }

  useEffect(() => {
    if (dragged === null) return;
    let frame = 0;
    const scrollWhileHeld = () => {
      const drag = active.current;
      if (!drag) return;
      const edge = 56;
      const y = drag.point.clientY;
      const step = y < edge ? -12 : y > window.innerHeight - edge ? 12 : 0;
      if (step) {
        window.scrollBy(0, step);
        updatePosition(drag);
      }
      frame = requestAnimationFrame(scrollWhileHeld);
    };
    frame = requestAnimationFrame(scrollWhileHeld);
    return () => cancelAnimationFrame(frame);
  }, [dragged]);

  useLayoutEffect(() => {
    const settlement = settleFrom.current;
    settleFrom.current = null;
    if (!settlement) return;
    const { grabbed, positions } = settlement;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // Measure the new layout before starting any animations on the cards.
    const offsets = Array.from(positions, ([card, before]) => {
      cancelAnimations(card);
      const after = card.getBoundingClientRect();
      return { card, x: before.left - after.left, y: before.top - after.top };
    });
    if (reduceMotion) return;
    for (const { card, x, y } of offsets) {
      if (!x && !y) continue;
      const layer = card === grabbed ? { zIndex: 1 } : {};
      card.animate?.(
        [
          { ...layer, transform: `translate3d(${x}px, ${y}px, 0)` },
          { ...layer, transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
    }
  });

  function start(id: string, event: HandleEvent) {
    if (active.current || !event.isPrimary || event.button !== 0) return;
    const card = event.currentTarget.closest<HTMLElement>(
      "[data-question-card]",
    );
    const slot = card?.parentElement;
    if (!card || !slot) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { left, top, width, height } = card.getBoundingClientRect();
    cancelAnimations(card);
    // Keep the gap in the list while the fixed card follows the pointer.
    slot.style.minBlockSize = `${height}px`;
    card.style.inlineSize = `${width}px`;
    const point = { clientX: event.clientX, clientY: event.clientY };
    const drag = {
      id,
      pointerId: event.pointerId,
      card,
      slot,
      point,
      offsetX: point.clientX - left,
      offsetY: point.clientY - top,
    };
    active.current = drag;
    positionCard(drag);
    setDragged(id);
  }

  function move(event: HandleEvent) {
    const drag = active.current;
    if (drag?.pointerId !== event.pointerId) return;
    drag.point = { clientX: event.clientX, clientY: event.clientY };
    updatePosition(drag);
  }

  function finish(event: HandleEvent, commit: boolean) {
    const drag = active.current;
    if (drag?.pointerId !== event.pointerId) return;
    const destination = commit ? dropTarget(event, drag.id) : null;
    const cards = destination
      ? (builder.current?.querySelectorAll<HTMLElement>(
          "[data-question-card]",
        ) ?? [drag.card])
      : [drag.card];
    settleFrom.current = {
      grabbed: drag.card,
      positions: new Map(
        Array.from(cards, (card) => [card, card.getBoundingClientRect()]),
      ),
    };

    active.current = null;
    drag.slot.style.removeProperty("min-block-size");
    drag.card.style.removeProperty("inline-size");
    drag.card.style.removeProperty("transform");
    setDragged(null);
    setTarget(null);
    if (destination) onDrop(drag.id, destination);
  }

  return { builder, dragged, target, start, move, finish };
}
