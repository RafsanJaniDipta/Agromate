"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not([data-revealed])";

// Watches every [data-reveal] element and marks it [data-revealed] the first time
// it scrolls into view; globals.css animates the change. Renders nothing.
export default function ScrollReveal() {
  useEffect(() => {
    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          intersection.unobserve(entry.target);
        }
      },
      // Trigger a little before the element's top reaches the bottom of the screen
      { rootMargin: "0px 0px -10% 0px" },
    );

    const observeAll = () => document.querySelectorAll(SELECTOR).forEach((el) => intersection.observe(el));
    observeAll();

    // Pick up elements added later, e.g. after client-side navigation
    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      intersection.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}
