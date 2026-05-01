import type { Ref } from "vue";

export function useSwipe(
  target: Ref<HTMLElement | null>,
  options: {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    threshold?: number;
  },
) {
  const { onSwipeLeft, onSwipeRight, threshold = 40 } = options;

  let startX = 0;
  let startY = 0;
  let dx = 0;
  let isTracking = false;

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    dx = 0;
    isTracking = true;
  }

  function onTouchMove(e: TouchEvent) {
    if (!isTracking) return;
    const t = e.touches[0];
    dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx)) {
      isTracking = false;
    }
  }

  function onTouchEnd() {
    if (!isTracking) return;
    isTracking = false;
    if (dx > threshold) {
      onSwipeRight();
    } else if (dx < -threshold) {
      onSwipeLeft();
    }
  }

  onMounted(() => {
    const el = target.value;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
  });

  onUnmounted(() => {
    const el = target.value;
    if (!el) return;
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
  });
}
