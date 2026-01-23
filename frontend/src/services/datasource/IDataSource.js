/**
 * @typedef {Object} BreathSample
 * @property {number} ts - Unix ms timestamp
 * @property {number} value - normalized signal value
 * @property {number} quality - 0..1 signal quality
 */

/**
 * @interface
 * start(): void
 * stop(): void
 * onSample: (sample: BreathSample) => void
 */

export {};