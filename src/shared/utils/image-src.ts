export function getValidImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const src = value.trim();
  if (!src || src.startsWith("placeholder-")) return null;
  if (src.startsWith("/")) return src;

  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:" ? src : null;
  } catch {
    return null;
  }
}

export function getValidImageSources(
  values: readonly unknown[] | null | undefined,
) {
  return (values ?? []).flatMap((value) => {
    const src = getValidImageSrc(value);
    return src ? [src] : [];
  });
}
