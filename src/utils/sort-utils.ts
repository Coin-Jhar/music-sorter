import { SortPattern, SortOptions } from '../models/music-file';

/**
 * Parse a sort pattern string and return the corresponding enum value.
 * Returns null if the pattern is invalid.
 */
export function parseSortPattern(pattern: string): SortPattern | null {
  switch (pattern) {
    case SortPattern.ARTIST:
    case SortPattern.ALBUM_ARTIST:
    case SortPattern.ALBUM:
    case SortPattern.GENRE:
    case SortPattern.YEAR:
      return pattern as SortPattern;
    default:
      return null;
  }
}

/**
 * Build a SortOptions object from provided parameters.
 * Throws an error if the pattern is invalid.
 */

export function buildSortOptions(pattern: string, copyMode = false): SortOptions {
  const parsed = parseSortPattern(pattern);
  if (!parsed) {
    throw new Error(`Unknown pattern: ${pattern}`);
  }
  return {
    pattern: parsed,
    copyMode,
    nestedStructure: true,
    includeArtistInAlbumFolder: true
  };
}
