export interface IdGeneratorOptions {
  length?: number;
  prefix?: string;
  suffix?: string;
  includeTimestamp?: boolean;
}

export class IdGenerator {
  private static readonly DEFAULT_LENGTH = 12;
  private static readonly ALPHANUMERIC_CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  private static readonly NUMERIC_CHARS = "0123456789";
  private static readonly HEX_CHARS = "0123456789ABCDEF";

  static uuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  static alphanumeric(options: IdGeneratorOptions = {}): string {
    const {
      length = this.DEFAULT_LENGTH,
      prefix = "",
      suffix = "",
      includeTimestamp = false,
    } = options;

    let id = "";
    for (let i = 0; i < length; i++) {
      id += this.ALPHANUMERIC_CHARS.charAt(
        Math.floor(Math.random() * this.ALPHANUMERIC_CHARS.length)
      );
    }

    if (includeTimestamp) {
      id = `${Date.now()}_${id}`;
    }

    return `${prefix}${id}${suffix}`;
  }

  static numeric(options: IdGeneratorOptions = {}): string {
    const {
      length = this.DEFAULT_LENGTH,
      prefix = "",
      suffix = "",
      includeTimestamp = false,
    } = options;

    let id = "";
    for (let i = 0; i < length; i++) {
      id += this.NUMERIC_CHARS.charAt(
        Math.floor(Math.random() * this.NUMERIC_CHARS.length)
      );
    }

    if (includeTimestamp) {
      id = `${Date.now()}_${id}`;
    }

    return `${prefix}${id}${suffix}`;
  }

  static hex(options: IdGeneratorOptions = {}): string {
    const {
      length = this.DEFAULT_LENGTH,
      prefix = "",
      suffix = "",
      includeTimestamp = false,
    } = options;

    let id = "";
    for (let i = 0; i < length; i++) {
      id += this.HEX_CHARS.charAt(
        Math.floor(Math.random() * this.HEX_CHARS.length)
      );
    }

    if (includeTimestamp) {
      id = `${Date.now()}_${id}`;
    }

    return `${prefix}${id}${suffix}`;
  }

  static timestamp(
    format: "unix" | "iso" | "custom" = "unix",
    customFormat?: string
  ): string {
    const now = new Date();

    switch (format) {
      case "unix":
        return now.getTime().toString();
      case "iso":
        return now
          .toISOString()
          .replace(/[-:.]/g, "")
          .replace("T", "_")
          .replace("Z", "");
      case "custom":
        if (!customFormat) {
          throw new Error(
            "Custom format string required when using custom format"
          );
        }
        return this.formatDate(now, customFormat);
      default:
        return now.getTime().toString();
    }
  }

  /**
   * Genera un nanoid (simile al nanoid di JavaScript)
   */
  static nanoid(size: number = 21): string {
    const alphabet =
      "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let id = "";
    let i = size;

    while (i--) {
      id += alphabet[(Math.random() * 64) | 0];
    }

    return id;
  }

  static ulid(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = this.alphanumeric({ length: 16 }).toUpperCase();
    return `${timestamp}${randomPart}`;
  }

  /**
   * Genera un short ID (come YouTube video IDs)
   */
  static shortId(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    let result = "";
    for (let i = 0; i < 11; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static hashFromString(input: string): string {
    let hash = 0;
    if (input.length === 0) return hash.toString();

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private static formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace("YYYY", year.toString())
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }
}

export const generateUUID = (): string => IdGenerator.uuid();
export const generateId = (options?: IdGeneratorOptions): string =>
  IdGenerator.alphanumeric(options);
export const generateNumericId = (options?: IdGeneratorOptions): string =>
  IdGenerator.numeric(options);
export const generateShortId = (): string => IdGenerator.shortId();
export const generateNanoId = (size?: number): string =>
  IdGenerator.nanoid(size);
