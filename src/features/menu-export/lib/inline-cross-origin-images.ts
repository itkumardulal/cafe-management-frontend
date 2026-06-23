function waitForImage(img: HTMLImageElement) {
  return new Promise<void>((resolve) => {
    if (img.complete && img.naturalHeight > 0) {
      resolve();
      return;
    }
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  });
}

/** Rewrites cross-origin image sources through the same-origin proxy for html2canvas. */
export async function inlineCrossOriginImages(root: HTMLElement): Promise<void> {
  if (typeof window === "undefined") return;

  const origin = window.location.origin;
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:") || src.startsWith(origin)) {
        return;
      }

      img.removeAttribute("crossorigin");
      img.src = `/api/asset-proxy?url=${encodeURIComponent(src)}`;
      await waitForImage(img);
    }),
  );
}
