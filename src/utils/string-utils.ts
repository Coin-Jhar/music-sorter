// src/utils/string-utils.ts
export function sanitizeFilename(input: string): string {
  return input.replace(/[\/\\:*?"<>|]/g, '_').trim();
}

export function formatTemplate(
  template: string, 
  values: Record<string, string | number | undefined>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    const placeholder = `{${key}}`;
    return result.replace(new RegExp(placeholder, 'g'), value?.toString() || '');
  }, template);
}
