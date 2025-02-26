// src/utils/logger.ts
export const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error(error);
    }
  },
  success: (message: string) => console.log(`[SUCCESS] ${message}`)
};
