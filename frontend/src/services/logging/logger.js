export const logger = {
  info(...args) {
    console.info("[SpiroStrap]", ...args);
  },
  warn(...args) {
    console.warn("[SpiroStrap]", ...args);
  },
  error(...args) {
    console.error("[SpiroStrap]", ...args);
  },
};
