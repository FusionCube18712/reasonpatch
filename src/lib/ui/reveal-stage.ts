export const revealStage = (target: HTMLElement | null): void => {
  if (!target) return;

  target.focus({ preventScroll: true });
  if (typeof target.scrollIntoView !== "function") return;

  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
};
