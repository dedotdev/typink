export const noop = () => {};

/**
 * Generates a unique instance ID for tracking object instances.
 * Uses timestamp and random number to ensure uniqueness.
 * @returns A unique string identifier
 */
export const generateInstanceId = () => `${Date.now()}-${Math.random()}`;
