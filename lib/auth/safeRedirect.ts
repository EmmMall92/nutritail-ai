const DEFAULT_CUSTOMER_PATH = "/account";

export function normalizeSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_CUSTOMER_PATH
) {
  const candidate = String(value ?? "").trim();

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }

  if (/^\/(?:login|register|auth\/callback)(?:[/?#]|$)/i.test(candidate)) {
    return fallback;
  }

  return candidate;
}

export function buildAuthCallbackPath(nextPath?: string | null) {
  const safeNextPath = normalizeSafeRedirectPath(nextPath);
  return `/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
}
