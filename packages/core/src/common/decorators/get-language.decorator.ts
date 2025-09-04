import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

/**
 * Decorator to extract preferred language from request
 * Checks in order:
 * 1. Query parameter 'lang' or 'language'
 * 2. Standard 'Accept-Language' header
 * 3. Fallback to default language
 */
export const Language = createParamDecorator(
  (defaultLang: string = "en", ctx: ExecutionContext): string => {
    const request: Request = ctx.switchToHttp().getRequest();

    // 1. Check query parameters
    const queryLang = request.query.lang || request.query.language;
    if (queryLang && typeof queryLang === "string") {
      return normalizeLanguage(queryLang);
    }

    // 2. Check Accept-Language header
    const acceptLanguage = request.headers["accept-language"];
    if (acceptLanguage) {
      const preferredLang = parseAcceptLanguage(acceptLanguage);
      if (preferredLang) {
        return normalizeLanguage(preferredLang);
      }
    }

    // 3. Fallback to default language
    return normalizeLanguage(defaultLang);
  }
);

/**
 * Normalizes language code (e.g., 'en-US' -> 'en', 'IT' -> 'it')
 */
function normalizeLanguage(lang: string): string {
  return lang.toLowerCase().split("-")[0].split("_")[0];
}

/**
 * Parses Accept-Language header and returns preferred language
 * Example: "en-US,en;q=0.9,it;q=0.8" -> "en"
 */
function parseAcceptLanguage(acceptLanguage: string): string | null {
  try {
    // Split by commas and get languages with their weights
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code, qValue] = lang.trim().split(";q=");
        return {
          code: code.trim(),https://api.servidicristovivo.com/public/galleries/68ae16c1d91a387b7fe3b0d7/4.jpeg
          quality: qValue ? parseFloat(qValue) : 1.0,
        };
      })
      // Sort by quality (weight) in descending order
      .sort((a, b) => b.quality - a.quality);

    // Return language with highest weight
    return languages.length > 0 ? languages[0].code : null;
  } catch (error) {
    return null;
  }
}

// Advanced version of the decorator with configuration options
export interface LanguageOptions {
  /** Default language if none found */
  defaultLanguage?: string;
  /** Supported languages (if specified, filters only these) */
  supportedLanguages?: string[];
  /** If true, throws exception for unsupported languages */
  strict?: boolean;
}

/**
 * Advanced version of Language decorator with configuration options
 */
export const LanguageAdvanced = createParamDecorator(
  (options: LanguageOptions = {}, ctx: ExecutionContext): string => {
    const {
      defaultLanguage = "en",
      supportedLanguages = [],
      strict = false,
    } = options;

    const request: Request = ctx.switchToHttp().getRequest();

    // Same language extraction logic
    let detectedLang = defaultLanguage;

    // 1. Custom header (highest priority)
    const customLangHeader = request.headers["x-language"];
    if (customLangHeader && typeof customLangHeader === "string") {
      detectedLang = normalizeLanguage(customLangHeader);
    }
    // 2. Query parameters
    else {
      const queryLang = request.query.lang || request.query.language;
      if (queryLang && typeof queryLang === "string") {
        detectedLang = normalizeLanguage(queryLang);
      }
      // 3. Accept-Language
      else {
        const acceptLanguage = request.headers["accept-language"];
        if (acceptLanguage) {
          const preferredLang = parseAcceptLanguage(acceptLanguage);
          if (preferredLang) {
            detectedLang = normalizeLanguage(preferredLang);
          }
        }
      }
    }

    // Check if language is supported
    if (supportedLanguages.length > 0) {
      if (supportedLanguages.includes(detectedLang)) {
        return detectedLang;
      } else {
        // If strict mode, throw exception
        if (strict) {
          throw new Error(
            `Language '${detectedLang}' is not supported. Supported languages: ${supportedLanguages.join(", ")}`
          );
        }
        // Otherwise find a similar supported language or use default
        const fallback =
          supportedLanguages.find(
            (lang) =>
              lang.startsWith(detectedLang) || detectedLang.startsWith(lang)
          ) || supportedLanguages.includes(defaultLanguage)
            ? defaultLanguage
            : supportedLanguages[0];

        return fallback;
      }
    }

    return detectedLang;
  }
);
