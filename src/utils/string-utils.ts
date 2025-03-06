// src/utils/string-utils.ts
/**
 * Sanitize a filename to remove invalid characters for all operating systems
 * @param input The string to sanitize
 * @returns Sanitized string safe for filesystem use
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') {
    return 'unknown';
  }

  // Replace characters invalid in Windows, macOS, and Linux
  let sanitized = input
    .replace(/[\/\\:*?"<>|]/g, '_') // Windows invalid chars
    .replace(/[\x00-\x1F]/g, '') // Control characters
    .replace(/^\.+/, '') // Don't start with dots (hidden files)
    .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i, '_$1') // Reserved names in Windows
    .trim();

  // Handle empty results
  if (!sanitized) {
    sanitized = 'unknown';
  }

  // Limit length to 255 characters (common filesystem limit)
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * Format a template string by replacing placeholders with values
 * @param template Template string with {placeholder} syntax
 * @param values Object with values to replace placeholders
 * @returns Formatted string with replacements
 */
export function formatTemplate(
  template: string,
  values: Record<string, string | number | undefined>
): string {
  if (!template) return '';

  return Object.entries(values).reduce((result, [key, value]) => {
    const placeholder = `{${key}}`;
    const replacement = value !== undefined ? value.toString() : '';
    
    // Global replacement of all instances of the placeholder
    return result.replace(new RegExp(placeholder, 'g'), replacement);
  }, template);
}
