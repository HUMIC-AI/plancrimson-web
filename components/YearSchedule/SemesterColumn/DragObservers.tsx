import {
  MutableRefObject, useRef, useState, useEffect,
} from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useDragAndDropContext } from './DragAndDrop';

export function useObserver(resizeRef: MutableRefObject<HTMLDivElement>) {
  const leftScrollRef = useRef<HTMLDivElement>(null!);
  const rightScrollRef = useRef<HTMLDivElement>(null!);

  // default w-56 = 224px
  // the resize bar starts at w-24 = 96px
  const [colWidth, setWidth] = useState(224);
  const [leftIntersecting, setLeftIntersecting] = useState(false);
  const [rightIntersecting, setRightIntersecting] = useState(false);

  // conditionally show the left and right scroll bars
  // based on the user's current scroll position
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries?.[0]?.borderBoxSize?.[0]?.inlineSize;
      if (newWidth) {
        setWidth(Math.max(Math.min(newWidth + 224 - 96, 2048), 224));
      }
    });
    resizeObserver.observe(resizeRef.current);
    const leftScrollObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries?.[0]?.isIntersecting;
      if (typeof isIntersecting === 'boolean') {
        setLeftIntersecting(isIntersecting);
      }
    });
    leftScrollObserver.observe(leftScrollRef.current);
    const rightScrollObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries?.[0]?.isIntersecting;
      if (typeof isIntersecting === 'boolean') {
        setRightIntersecting(isIntersecting);
      }
    });
    rightScrollObserver.observe(rightScrollRef.current);
    return () => {
      resizeObserver.disconnect();
      leftScrollObserver.disconnect();
      rightScrollObserver.disconnect();
    };
  }, [resizeRef]);

  return {
    leftScrollRef,
    rightScrollRef,
    colWidth,
    leftIntersecting,
    rightIntersecting,
  };
}

export function DragObservers({
  leftIntersecting,
  rightIntersecting,
  semestersContainerRef,
}: {
  leftIntersecting: boolean
  rightIntersecting: boolean
  semestersContainerRef: MutableRefObject<HTMLDivElement>
}) {
  const drag = useDragAndDropContext();

  if (!drag.enabled || !drag.dragStatus.dragging) return null;

  return (
    <>
      {!leftIntersecting && (
        <div
          className="absolute inset-y-0 left-0 z-10 flex w-1/6 justify-center bg-black/30 pt-4 text-4xl text-white"
          onDragOver={() => {
            semestersContainerRef.current.scrollBy(-2, 0);
          }}
        >
          <FaChevronLeft />
        </div>
      )}

      {!rightIntersecting && (
        <div
          className="absolute inset-y-0 right-0 z-10 flex w-1/6 justify-center bg-black/30 pt-4 text-4xl text-white"
          onDragOver={() => {
            semestersContainerRef.current.scrollBy(2, 0);
          }}
        >
          <FaChevronRight />
        </div>
      )}
    </>
  );
}
