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

/**
 * Normalizes a path by replacing backslashes with forward slashes
 * and ensuring no trailing slash
 * @param inputPath The path to normalize
 * @returns Normalized path
 */
export function normalizePath(inputPath: string): string {
  if (!inputPath) return '';
  
  // Replace all backslashes with forward slashes
  let normalized = inputPath.replace(/\\/g, '/');
  
  // Remove trailing slash if present
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Truncates a string to a specific length and adds an ellipsis if truncated
 * @param input The string to truncate
 * @param maxLength Maximum length of the output string (including ellipsis if added)
 * @returns Truncated string
 */
export function truncate(input: string, maxLength: number): string {
  if (!input) return '';
  if (input.length <= maxLength) return input;
  
  // Reserve 3 characters for the ellipsis
  const ellipsis = '...';
  const truncateLength = maxLength - ellipsis.length;
  
  return input.slice(0, truncateLength) + ellipsis;
}

/**
 * Pads a number with zeros to a specific length
 * @param num Number to pad
 * @param length Target length
 * @returns Padded number string
 */
export function padNumber(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}

/**
 * Formats a duration in seconds to a string (mm:ss or hh:mm:ss)
 * @param seconds Duration in seconds
 * @param includeHours Whether to always include hours
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number, includeHours = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0 || includeHours) {
    return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(secs, 2)}`;
  }
  
  return `${padNumber(minutes, 2)}:${padNumber(secs, 2)}`;
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places to show
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Extracts artist and title from a filename using common patterns
 * @param filename Filename without extension
 * @returns Object with artist and title, or undefined if no match
 */
export function extractArtistAndTitle(filename: string): { artist?: string, title?: string } {
  if (!filename) return {};
  
  // Common patterns for music filenames
  const patterns = [
    /^(.*?)\s*-\s*(.*?)$/, // Artist - Title
    /^(.*?)\s*–\s*(.*?)$/, // Artist – Title (en dash)
    /^(.*?)\s*—\s*(.*?)$/, // Artist — Title (em dash)
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match && match.length === 3) {
      return {
        artist: match[1].trim(),
        title: match[2].trim()
      };
    }
  }
  
  return { title: filename };
}