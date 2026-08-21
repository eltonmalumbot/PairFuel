"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function internalDashboardHref(anchor: HTMLAnchorElement) {
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/dashboard")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export default function SmoothDashboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="/dashboard"]');
    anchors.forEach((anchor) => {
      const href = internalDashboardHref(anchor);
      if (href) router.prefetch(href);
    });

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="/dashboard"]');
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = internalDashboardHref(anchor);
      if (!href) return;

      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      event.preventDefault();
      if (href === current) return;

      router.push(href, { scroll: false });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
