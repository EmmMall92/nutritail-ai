import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { localizePath, type Locale } from "@/lib/i18n/config";
import { publicEnglishTranslations } from "@/lib/i18n/publicTranslations";

const translatableProps = new Set([
  "alt",
  "aria-label",
  "description",
  "eyebrow",
  "placeholder",
  "title",
]);

function normalized(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function translatePublicText(value: string, locale: Locale): string {
  if (locale === "el") return value;

  const key = normalized(value);
  const translation = publicEnglishTranslations[key];
  if (!translation) return value;

  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? "";
  return `${leadingWhitespace}${translation}${trailingWhitespace}`;
}

export function translatePublicTree(locale: Locale, node: ReactNode): ReactNode {
  if (locale === "el" || node === null || node === undefined || typeof node === "boolean") {
    return node;
  }

  if (typeof node === "string") return translatePublicText(node, locale);
  if (typeof node === "number") return node;

  if (Array.isArray(node)) {
    return node.map((child) => translatePublicTree(locale, child));
  }

  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const nextProps: Record<string, unknown> = {};

  for (const propName of translatableProps) {
    const value = element.props[propName];
    if (typeof value === "string") {
      nextProps[propName] = translatePublicText(value, locale);
    }
  }

  if (typeof element.props.href === "string") {
    nextProps.href = localizePath(element.props.href, locale);
  }

  if ("children" in element.props) {
    nextProps.children = Children.map(element.props.children as ReactNode, (child) =>
      translatePublicTree(locale, child)
    );
  }

  return cloneElement(element, nextProps);
}
