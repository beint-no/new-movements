import { EDITORIAL_IMAGES } from './editorial-image-manifest.mjs';

// Preserve the exact image, crop, direct-child CSS and alt copy. Only transport
// changes; conversion never runs in a customer request or deployment build.
export function optimizeEditorialImages(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    const source = tag.match(/\bsrc="([^"]+)"/)?.[1];
    const image = EDITORIAL_IMAGES[source];
    if (!image) return tag;
    const candidates = image.renditions;
    const src = candidates.find((item) => item.width >= 960) || candidates.at(-1);
    const sizes = /hero-(?:men|women)\.jpg$/.test(source)
      ? '(max-width: 900px) and (orientation: portrait) 100vw, 50vw'
      : '(max-width: 900px) 100vw, 50vw';
    const attributes = `src="${src.url}" srcset="${candidates.map((item) => `${item.url} ${item.width}w`).join(', ')}" sizes="${sizes}"`;
    let optimized = tag.replace(/\bsrc="[^"]+"/, attributes);
    if (!/\bwidth=/.test(tag)) optimized = optimized.replace('<img', `<img width="${image.width}" height="${image.height}"`);
    if (!/\bdecoding=/.test(tag)) optimized = optimized.replace('<img', '<img decoding="async"');
    return optimized;
  });
}
