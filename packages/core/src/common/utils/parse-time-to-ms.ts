/**
 * Parses a time string (e.g., "15m", "1h") into milliseconds.
 * @param timeString The time string to parse.
 * @returns The equivalent time in milliseconds.
 */
export function parseTimeToMs(timeString: string): number {
  const unit = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1), 10);

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid time format: ${timeString}`);
  }
}
