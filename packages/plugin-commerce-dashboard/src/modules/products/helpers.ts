type MediaType = "image" | "video" | "file";

export const getTypeFromFile = (file: File): MediaType => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
};

export const getTypeFromUrl = (url: string): MediaType => {
  const ext = url.split("?")[0]?.split("#")[0]?.split(".").pop()?.toLowerCase();
  if (!ext) return "file";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(ext))
    return "image";
  if (["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) return "video";
  return "file";
};

export const getNameFromUrl = (url: string) => {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch {
    return url;
  }
};
