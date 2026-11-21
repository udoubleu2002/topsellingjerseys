"use client";
import { useEffect, useRef } from "react";

/**
 * Keeps the sidebar from running past the main column on wide screens. When the rail is taller than the content beside
 * it, the overhang is trimmed from the bottom: first the last items of the bottom box's list (keeping at least two), then
 * whole boxes. So the page never shows an empty stretch under the main column. Phones and tablets stack the rail under
 * the content, so nothing is trimmed there.
 */
export function RailFit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const rail = ref.current?.parentElement;
    const main = rail?.previousElementSibling as HTMLElement | null | undefined;
    if (!rail || !main || !rail.parentElement?.classList.contains("with-rail")) return;
    const wide = window.matchMedia("(min-width: 1021px)");
    const hide = (el: HTMLElement) => { el.style.display = "none"; el.dataset.railFit = "1"; };
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        rail.querySelectorAll<HTMLElement>("[data-rail-fit]").forEach((el) => { el.style.removeProperty("display"); delete el.dataset.railFit; });
        if (!wide.matches) return;
        const limit = main.getBoundingClientRect().bottom + 1;
        const boxes = [...rail.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c !== ref.current && c.offsetHeight > 0);
        // The first box always stays.
        for (let i = boxes.length - 1; i > 0; i--) {
          const box = boxes[i];
          if (box.getBoundingClientRect().bottom <= limit) break;
          const items = [...box.querySelectorAll<HTMLElement>(":scope > ul > li, :scope > ol > li")];
          for (let j = items.length - 1; j >= 2 && box.getBoundingClientRect().bottom > limit; j--) hide(items[j]);
          if (box.getBoundingClientRect().bottom <= limit) break;
          items.forEach((li) => { li.style.removeProperty("display"); delete li.dataset.railFit; });
          hide(box);
        }
      });
    };
    const ro = new ResizeObserver(fit);
    ro.observe(main);
    for (const c of rail.children) ro.observe(c);
    wide.addEventListener("change", fit);
    window.addEventListener("load", fit);
    fit();
    return () => { cancelAnimationFrame(frame); ro.disconnect(); wide.removeEventListener("change", fit); window.removeEventListener("load", fit); };
  }, []);
  return <span ref={ref} hidden aria-hidden="true" />;
}
