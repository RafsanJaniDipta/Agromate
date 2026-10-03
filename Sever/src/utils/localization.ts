import type { Request } from "express";

/**
 * Extracts requested locale ('bn' | 'en') from query parameter ?locale=
 */
export function getLocale(req: Request): "bn" | "en" {
  const queryLocale = req.query.locale;
  if (typeof queryLocale === "string" && queryLocale.toLowerCase() === "bn") {
    return "bn";
  }
  return "en";
}

/**
 * Format team content with fallback logic for public APIs.
 * If locale === 'bn' and title_bn is present, returns title_bn. Otherwise returns title_en.
 */
export function localizeContent<T extends Record<string, any>>(
  item: T,
  locale: "bn" | "en"
): T {
  if (!item) return item;

  const result: Record<string, any> = { ...item };

  if (locale === "bn") {
    if ("titleBn" in item || "title_bn" in item) {
      result.title = item.titleBn || item.title_bn || item.titleEn || item.title_en;
    }
    if ("bodyBn" in item || "body_bn" in item) {
      result.body = item.bodyBn || item.body_bn || item.bodyEn || item.body_en;
    }
    if ("nameBn" in item || "name_bn" in item) {
      result.name = item.nameBn || item.name_bn || item.nameEn || item.name_en || item.name;
    }
    if ("descriptionBn" in item || "description_bn" in item) {
      result.description = item.descriptionBn || item.description_bn || item.descriptionEn || item.description_en || item.description;
    }
  } else {
    if ("titleEn" in item || "title_en" in item) {
      result.title = item.titleEn || item.title_en;
    }
    if ("bodyEn" in item || "body_en" in item) {
      result.body = item.bodyEn || item.body_en;
    }
    if ("nameEn" in item || "name_en" in item) {
      result.name = item.nameEn || item.name_en || item.name;
    }
    if ("descriptionEn" in item || "description_en" in item) {
      result.description = item.descriptionEn || item.description_en || item.description;
    }
  }

  return result as T;
}
