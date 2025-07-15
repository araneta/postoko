/**
 * Safely converts a value to a number and formats it to 2 decimal places
 * @param value - The value to format (can be number, string, or any other type)
 * @returns Formatted string with 2 decimal places, or "0.00" if invalid
 */
export function safeToFixed(value: any, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) {
    return `0.${'0'.repeat(decimals)}`;
  }
  return num.toFixed(decimals);
}

/**
 * Safely converts a value to a number
 * @param value - The value to convert
 * @returns The number value, or 0 if invalid
 */
export function safeToNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Safely converts a value to an integer
 * @param value - The value to convert
 * @returns The integer value, or 0 if invalid
 */
export function safeToInteger(value: any): number {
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return isNaN(num) ? 0 : Math.floor(num);
} 