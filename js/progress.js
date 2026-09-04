/**
 * progress.js
 * Read-only analytics layer on top of storage.js. Nothing here writes data.
 */

import { getProgress, TOPICS } from "./storage.js";

function accuracyFor(stats) {
  if (!stats || stats.total === 0) return 0;
  return Math.round((stats.correct / stats.total) * 100);
}

export function getOverallAccuracy() {
  const progress = getProgress();
  const totals = Object.values(progress).reduce(
    (acc, stats) => {
      acc.correct += stats.correct;
      acc.total += stats.total;
      return acc;
    },
    { correct: 0, total: 0 }
  );
  return accuracyFor(totals);
}

/**
 * Readiness blends accuracy with volume of practice so a single
 * lucky question doesn't read as "100% ready".
 */
export function getReadinessScore() {
  const progress = getProgress();
  const totals = Object.values(progress).reduce(
    (acc, stats) => {
      acc.correct += stats.correct;
      acc.total += stats.total;
      return acc;
    },
    { correct: 0, total: 0 }
  );
  if (totals.total === 0) return 0;

  const accuracy = totals.correct / totals.total;
  const volumeFactor = Math.min(totals.total / 100, 1); // ramps up to 100 answered
  const score = accuracy * (0.7 + 0.3 * volumeFactor);
  return Math.round(score * 100);
}

export function getWeakestTopic() {
  const progress = getProgress();
  let weakest = null;
  let lowest = Infinity;

  TOPICS.forEach((topic) => {
    const stats = progress[topic];
    if (!stats || stats.total === 0) return;
    const acc = accuracyFor(stats);
    if (acc < lowest) {
      lowest = acc;
      weakest = topic;
    }
  });

  return weakest;
}

export function getStrongestTopic() {
  const progress = getProgress();
  let strongest = null;
  let highest = -1;

  TOPICS.forEach((topic) => {
    const stats = progress[topic];
    if (!stats || stats.total === 0) return;
    const acc = accuracyFor(stats);
    if (acc > highest) {
      highest = acc;
      strongest = topic;
    }
  });

  return strongest;
}

/**
 * Suggests what to practice next: the weakest attempted topic, or
 * a topic that hasn't been tried yet, falling back to "tables".
 */
export function getSuggestedTopic() {
  const progress = getProgress();
  const untried = TOPICS.find((topic) => !progress[topic] || progress[topic].total === 0);
  if (untried) return untried;

  const weakest = getWeakestTopic();
  return weakest || "tables";
}

export function getTopicAccuracy(topic) {
  const progress = getProgress();
  return accuracyFor(progress[topic]);
}

export function getAllTopicAccuracy() {
  const progress = getProgress();
  return TOPICS.reduce((acc, topic) => {
    acc[topic] = accuracyFor(progress[topic]);
    return acc;
  }, {});
}
