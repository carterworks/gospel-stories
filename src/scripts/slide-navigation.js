import { DragGesture } from "@use-gesture/vanilla";

let cleanup = () => {};

function isEditable(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  );
}

export function setupSlideNavigation() {
  cleanup();

  const page = document.querySelector("[data-slide-navigation]");
  if (!page) {
    return;
  }

  const previous = page.querySelector("[data-slide-previous]");
  const next = page.querySelector("[data-slide-next]");

  function handleKeydown(event) {
    if (isEditable(event.target)) {
      return;
    }

    const link = event.key === "ArrowLeft" ? previous : event.key === "ArrowRight" ? next : null;
    if (!link) {
      return;
    }

    event.preventDefault();
    link.click();
  }

  document.addEventListener("keydown", handleKeydown);

  const gesture = new DragGesture(
    page,
    ({ swipe: [swipeX], tap }) => {
      if (tap) {
        return;
      }

      if (swipeX === -1) {
        next?.click();
      } else if (swipeX === 1) {
        previous?.click();
      }
    },
    {
      axis: "x",
      filterTaps: true,
      threshold: 40,
    },
  );

  cleanup = () => {
    document.removeEventListener("keydown", handleKeydown);
    gesture.destroy();
    cleanup = () => {};
  };
}
