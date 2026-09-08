function hasControlCharacters(value: string): boolean {
  return [...value].some(
    (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
  );
}

/** Validate before URL parsing can normalize dot segments or backslashes. */
export function localPath(value: string): boolean {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\#]/.test(value) ||
    hasControlCharacters(value)
  )
    return false;
  const path = value.split("?")[0];
  try {
    const decoded = decodeURIComponent(path);
    if (
      decoded.includes("%") ||
      decoded.includes("\\") ||
      decoded.includes("//") ||
      /[?#]/.test(decoded) ||
      hasControlCharacters(decoded)
    )
      return false;
    if (decoded.split("/").some((part) => part === "." || part === "..")) return false;
    // Encoded separators must never change which mount receives a request.
    return !/%2f/i.test(path);
  } catch {
    return false;
  }
}

export function isApiPath(value: string): boolean {
  return localPath(value) && value.split("?")[0].startsWith("/api/");
}

export function isHorizonPath(value: string): boolean {
  const path = value.split("?")[0];
  return localPath(value) && (path === "/horizon" || path.startsWith("/horizon/"));
}

export function dashboardContinuation(value: string): string | null {
  const path = value.split("?")[0];
  return isHorizonPath(value) && path !== "/horizon/api" && !path.startsWith("/horizon/api/")
    ? value
    : null;
}
