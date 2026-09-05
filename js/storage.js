/**
 * storage.js
 * The only module allowed to talk to localStorage.
 * Everything else asks storage.js for data.
 */

const KEYS = {
  PROGRESS: "mmd_progress",
  SESSIONS: "mmd_sessions",
  MISTAKES: "mmd_mistakes",
  STREAKS: "mmd_streaks",
  SETTINGS: "mmd_settings",
};

const TOPICS = ["tables", "squares", "cubes", "powers", "arithmetic"];

const DEFAULT_PROGRESS = () =>
  TOPICS.reduce((acc, topic) => {
    acc[topic] = { correct: 0, total: 0 };
    return acc;
  }, {});

const DEFAULT_STREAKS = () => ({
  current: 0,
  best: 0,
  lastCompletedDate: null,
});

const DEFAULT_SETTINGS = () => ({
  questionsPerSession: 10,
  theme: "dark",
});

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`storage: failed to read ${key}`, err);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`storage: failed to write ${key}`, err);
  }
}

/* ---------------- Progress ---------------- */

export function getProgress() {
  const stored = read(KEYS.PROGRESS, null);
  if (!stored) {
    const fresh = DEFAULT_PROGRESS();
    write(KEYS.PROGRESS, fresh);
    return fresh;
  }
  // backfill any topics added after a user's first save
  TOPICS.forEach((topic) => {
    if (!stored[topic]) stored[topic] = { correct: 0, total: 0 };
  });
  return stored;
}

export function updateProgress(topic, isCorrect) {
  const progress = getProgress();
  if (!progress[topic]) progress[topic] = { correct: 0, total: 0 };
  progress[topic].total += 1;
  if (isCorrect) progress[topic].correct += 1;
  write(KEYS.PROGRESS, progress);
  return progress;
}

/* ---------------- Sessions ---------------- */

export function getSessions() {
  return read(KEYS.SESSIONS, []);
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.unshift(session);
  // keep the log from growing forever
  const trimmed = sessions.slice(0, 200);
  write(KEYS.SESSIONS, trimmed);
  return trimmed;
}

/* ---------------- Mistakes ---------------- */

export function getMistakes() {
  return read(KEYS.MISTAKES, []);
}

export function addMistake(mistake) {
  const mistakes = getMistakes();
  // avoid piling up duplicates of the exact same question text
  const existingIndex = mistakes.findIndex(
    (m) => m.questionText === mistake.questionText && m.topic === mistake.topic
  );
  if (existingIndex >= 0) {
    mistakes[existingIndex].correctStreak = 0;
    mistakes[existingIndex].missedAt = mistake.missedAt;
  } else {
    mistakes.unshift({ ...mistake, correctStreak: 0 });
  }
  write(KEYS.MISTAKES, mistakes);
  return mistakes;
}

/**
 * A mistake needs 2 consecutive correct attempts in Review mode
 * before it's considered mastered and removed from the list.
 */
export function markMistakeCorrect(id) {
  const mistakes = getMistakes();
  const target = mistakes.find((m) => m.id === id);
  if (!target) return mistakes;

  target.correctStreak = (target.correctStreak || 0) + 1;
  let updated = mistakes;
  if (target.correctStreak >= 2) {
    updated = mistakes.filter((m) => m.id !== id);
  }
  write(KEYS.MISTAKES, updated);
  return updated;
}

export function markMistakeIncorrect(id) {
  const mistakes = getMistakes();
  const target = mistakes.find((m) => m.id === id);
  if (target) target.correctStreak = 0;
  write(KEYS.MISTAKES, mistakes);
  return mistakes;
}

export function removeMistake(id) {
  const mistakes = getMistakes().filter((m) => m.id !== id);
  write(KEYS.MISTAKES, mistakes);
  return mistakes;
}

/* ---------------- Streaks ---------------- */

export function getStreaks() {
  return read(KEYS.STREAKS, DEFAULT_STREAKS());
}

function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dateA = new Date(a);
  const dateB = new Date(b);
  dateA.setHours(0, 0, 0, 0);
  dateB.setHours(0, 0, 0, 0);
  return Math.round((dateB - dateA) / msPerDay);
}

/**
 * Call once per completed Daily Test. Extends the streak if the
 * last completion was yesterday, keeps it if it was already today,
 * resets to 1 otherwise.
 */
export function updateStreak() {
  const streaks = getStreaks();
  const today = new Date().toISOString().slice(0, 10);

  if (streaks.lastCompletedDate === today) {
    // already completed today, no change
    write(KEYS.STREAKS, streaks);
    return streaks;
  }

  const diff = streaks.lastCompletedDate
    ? daysBetween(streaks.lastCompletedDate, today)
    : null;

  if (diff === 1) {
    streaks.current += 1;
  } else {
    streaks.current = 1;
  }

  streaks.best = Math.max(streaks.best, streaks.current);
  streaks.lastCompletedDate = today;

  write(KEYS.STREAKS, streaks);
  return streaks;
}

/* ---------------- Settings ---------------- */

export function getSettings() {
  const stored = read(KEYS.SETTINGS, null);
  if (!stored) {
    const fresh = DEFAULT_SETTINGS();
    write(KEYS.SETTINGS, fresh);
    return fresh;
  }
  return { ...DEFAULT_SETTINGS(), ...stored };
}

export function saveSettings(settings) {
  const merged = { ...getSettings(), ...settings };
  write(KEYS.SETTINGS, merged);
  return merged;
}

/* ---------------- Reset ---------------- */

export function resetAllData() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export { TOPICS };
