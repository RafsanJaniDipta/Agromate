"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

// Lenis smooth scrolling for the whole page; `anchors` makes #links glide too.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
