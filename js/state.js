/**
 * state.js
 * Small shared helpers for in-memory session state and timing.
 * Holds no app data of its own — practice.js, review.js and
 * daily-test.js each keep their own state object and use these
 * as utilities.
 */

export function createStopwatch() {
  let startedAt = null;

  return {
    start() {
      startedAt = Date.now();
    },
    elapsedSeconds() {
      if (!startedAt) return 0;
      return Math.round((Date.now() - startedAt) / 1000);
    },
    reset() {
      startedAt = null;
    },
  };
}

/**
 * Fisher-Yates shuffle, used wherever a fixed pool of topics/questions
 * needs to be presented in a random order.
 */
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
