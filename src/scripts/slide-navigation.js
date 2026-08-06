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
  const nextImages = page.querySelector("[data-next-slide-images]");
  let active = true;

  const currentImages = [...page.querySelectorAll(".slide-images img")];
  Promise.all(
    currentImages.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        }),
    ),
  ).then(() => {
    if (!active || !(nextImages instanceof HTMLTemplateElement)) {
      return;
    }

    nextImages.content.querySelectorAll("img").forEach((source) => {
      const image = new Image();
      image.src = source.src;
    });
  });

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
    active = false;
    document.removeEventListener("keydown", handleKeydown);
    gesture.destroy();
    cleanup = () => {};
  };
}
