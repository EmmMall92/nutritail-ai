export const supportedLocales = ["el", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "el";
export const localeRequestHeader = "x-nutritail-locale";

const localizedRoutePrefixes = [
  "/about",
  "/ai-transparency",
  "/guides",
  "/how-it-works",
  "/privacy",
  "/support",
  "/terms",
] as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

export function isLocalizedRoute(pathname: string): boolean {
  const plainPath = stripLocalePrefix(pathname);

  if (plainPath === "/") return true;

  return localizedRoutePrefixes.some(
    (prefix) => plainPath === prefix || plainPath.startsWith(`${prefix}/`)
  );
}

export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;

  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : path.slice(suffixIndex);
  const plainPath = stripLocalePrefix(pathname);

  if (!isLocalizedRoute(plainPath)) return `${plainPath}${suffix}`;
  if (locale === defaultLocale) return `${plainPath}${suffix}`;

  return `${plainPath === "/" ? "/en" : `/en${plainPath}`}${suffix}`;
}

export function localeTag(locale: Locale): "el-GR" | "en" {
  return locale === "el" ? "el-GR" : "en";
}

export function openGraphLocale(locale: Locale): "el_GR" | "en_US" {
  return locale === "el" ? "el_GR" : "en_US";
}
