/**
 * dashboard.js
 * Assembles data from storage.js and progress.js into the home
 * screen. Knows nothing about question generation, scoring, or
 * review logic — it only reads and renders.
 */

import { getSessions, getStreaks, getMistakes, getProgress } from "./storage.js";
import {
  getOverallAccuracy,
  getReadinessScore,
  getSuggestedTopic,
  getWeakestTopic,
  getAllTopicAccuracy,
} from "./progress.js";
import { topicLabel } from "./generators.js";

function appEl() {
  return document.getElementById("app");
}

function hasAnyProgress() {
  const progress = getProgress();
  return Object.values(progress).some((stats) => stats.total > 0);
}

/* ---------------- Icon set (chalk-style outline, matches app icon) ---------------- */

const ICONS = {
  dailyTest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/><path d="M12 2v2"/></svg>`,
  practice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.7" fill="currentColor"/></svg>`,
  learn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c2-1 5-1 8 0v13c-3-1-6-1-8 0Z"/><path d="M20 5.5c-2-1-5-1-8 0v13c3-1 6-1 8 0Z"/></svg>`,
  review: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 2.6 5.9"/><path d="M4 17v-4h4"/><path d="M9.5 12.5l1.8 1.8L15 10.5"/></svg>`,
  progress: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V10"/><path d="M12 19V5"/><path d="M19 19v-6"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>`,
  feedback: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H8l-4 4Z"/></svg>`,
};

const TOPIC_GLYPHS = {
  tables: { symbol: "×", color: "teal" },
  squares: { symbol: "x²", color: "yellow" },
  cubes: { symbol: "x³", color: "coral" },
  powers: { symbol: "^", color: "green" },
  arithmetic: { symbol: "±", color: "teal" },
};

function actionTile({ action, icon, label, primary }) {
  return `
    <button class="menu-tile action-tile ${primary ? "primary" : ""}" data-action="${action}">
      <span class="tile-icon">${ICONS[icon]}</span>
      <span class="tile-label">${label}</span>
      <span class="tile-arrow">›</span>
    </button>`;
}

/**
 * The dashed-ring + bolt motif from the app icon, reused here so the
 * homepage has one visual anchor instead of zero.
 */
function heroGlyph() {
  return `
    <svg class="hero-glyph" viewBox="0 0 80 80" aria-hidden="true">
      <circle class="ring" cx="40" cy="40" r="30"></circle>
      <path class="bolt" d="M43 14 L27 44 L38 44 L35 66 L54 36 L42 36 Z"></path>
    </svg>`;
}

export function renderDashboard() {
  if (!hasAnyProgress()) {
    renderWelcomeScreen();
    return;
  }

  appEl().innerHTML = `
    <div class="screen-enter">
      ${renderHeroCard()}
      ${renderQuickActions()}
      ${renderWeakAreaAlert()}
      ${renderStatsCard()}
      ${renderTopicsCard()}
      ${renderBadgesCard()}
      ${renderRecentSessions()}
    </div>
  `;
}

/**
 * What a brand-new visitor sees — no streaks, no zeroed-out stats,
 * no empty progress bars. One line of context, one clear next step.
 */
function renderWelcomeScreen() {
  const suggested = getSuggestedTopic();

  appEl().innerHTML = `
    <div class="screen-enter">
      <div class="card hero-card">
        <div class="hero-top">
          <div>
            <div class="hero-eyebrow">Mental Math Daily</div>
            <h1>Get faster at the math you already know</h1>
          </div>
          ${heroGlyph()}
        </div>
        <p style="color:var(--ink-dim); margin: var(--space-2) 0 var(--space-4);">
          Tables, squares, cubes, powers and arithmetic — timed practice,
          tracked accuracy, and a review queue for anything you miss.
          No account needed.
        </p>
        <button class="primary block" data-action="daily-test">Start a 2-minute Daily Test →</button>
      </div>

      <div class="card">
        <h3>New here? A few ways in</h3>
        <div class="menu-grid">
          ${actionTile({ action: "practice", icon: "practice", label: "Practice a topic" })}
          ${actionTile({ action: "learn", icon: "learn", label: "Learn (study first)" })}
        </div>
        <p style="color:var(--ink-dim); font-size:0.85rem; margin-top:var(--space-3);">
          Not sure where to start? Try <strong>${topicLabel(suggested)}</strong> —
          Learn mode shows the full table, Practice quizzes you on it.
        </p>
      </div>
    </div>
  `;
}

function renderHeroCard() {
  const streaks = getStreaks();
  return `
    <div class="card hero-card">
      <div class="hero-top">
        <div>
          <div class="hero-eyebrow">Mental Math Daily</div>
          <h1>Keep the streak alive</h1>
        </div>
        ${heroGlyph()}
      </div>
      <div class="hero-grid">
        <div class="hero-stat">
          <span class="num">${streaks.current}</span>
          <small>Day Streak</small>
        </div>
        <div class="hero-stat best">
          <span class="num">${streaks.best}</span>
          <small>Best Streak</small>
        </div>
      </div>
    </div>
  `;
}

function renderQuickActions() {
  return `
    <div class="card">
      <h3>Quick Actions</h3>
      <div class="menu-grid">
        ${actionTile({ action: "daily-test", icon: "dailyTest", label: "Daily Test", primary: true })}
        ${actionTile({ action: "practice", icon: "practice", label: "Practice" })}
        ${actionTile({ action: "learn", icon: "learn", label: "Learn" })}
        ${actionTile({ action: "review", icon: "review", label: "Review Mistakes" })}
        ${actionTile({ action: "progress", icon: "progress", label: "Progress" })}
        ${actionTile({ action: "settings", icon: "settings", label: "Settings" })}
        ${actionTile({ action: "feedback", icon: "feedback", label: "Feedback" })}
      </div>
    </div>
  `;
}

function renderWeakAreaAlert() {
  const weakest = getWeakestTopic();
  const suggested = getSuggestedTopic();
  const mistakeCount = getMistakes().length;

  if (!weakest && mistakeCount === 0) {
    return `
      <div class="card">
        <h3>Suggested Topic</h3>
        <p>Try <strong>${topicLabel(suggested)}</strong> to get your first readings on the board.</p>
      </div>
    `;
  }

  const accuracy = getAllTopicAccuracy()[weakest] ?? 0;

  return `
    <div class="card">
      <h3>Focus Area</h3>
      <p>
        ${weakest ? `<strong>${topicLabel(weakest)}</strong> is at ${accuracy}% accuracy.` : ""}
        ${mistakeCount > 0 ? ` ${mistakeCount} question${mistakeCount === 1 ? "" : "s"} waiting in review.` : ""}
      </p>
      <div class="badge-row">
        <span class="chip warn">Suggested: ${topicLabel(suggested)}</span>
        ${mistakeCount > 0 ? `<span class="chip">${mistakeCount} to review</span>` : ""}
      </div>
    </div>
  `;
}

function renderStatsCard() {
  return `
    <div class="card">
      <h3>Overall Progress</h3>
      <p>Accuracy: <strong>${getOverallAccuracy()}%</strong></p>
      <p>Readiness: <strong>${getReadinessScore()}%</strong></p>
    </div>
  `;
}

function renderTopicsCard() {
  const accuracies = getAllTopicAccuracy();
  return `
    <div class="card">
      <h3>Topic Progress</h3>
      ${Object.entries(accuracies)
        .map(([topic, pct]) => {
          const glyph = TOPIC_GLYPHS[topic] || { symbol: "•", color: "teal" };
          return `
        <div class="topic-row">
          <span class="topic-glyph glyph-${glyph.color}">${glyph.symbol}</span>
          <span class="topic-name">${topicLabel(topic)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="pct">${pct}%</span>
        </div>`;
        })
        .join("")}
    </div>
  `;
}

function computeBadges() {
  const progress = getProgress();
  const streaks = getStreaks();
  const totalAnswered = Object.values(progress).reduce((sum, s) => sum + s.total, 0);
  const tablesAccuracy = progress.tables.total
    ? Math.round((progress.tables.correct / progress.tables.total) * 100)
    : 0;

  return [
    { label: "100 Questions", earned: totalAnswered >= 100 },
    { label: "7 Day Streak", earned: streaks.best >= 7 },
    { label: "Tables Master", earned: progress.tables.total >= 20 && tablesAccuracy >= 90 },
    { label: "First Steps", earned: totalAnswered >= 1 },
  ];
}

function renderBadgesCard() {
  const badges = computeBadges();
  return `
    <div class="card">
      <h3>Badges</h3>
      <div class="badge-grid">
        ${badges
          .map(
            (b) => `
          <div class="badge-tile ${b.earned ? "earned" : ""}">
            <span class="badge-icon">${
              b.earned
                ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M9 14l-1.5 6L12 18l4.5 2L15 14"/></svg>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3" stroke-linecap="round"><circle cx="12" cy="9" r="6"/></svg>`
            }</span>
            <span class="badge-label">${b.label}</span>
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderRecentSessions() {
  const sessions = getSessions().slice(0, 5);

  if (sessions.length === 0) {
    return `<div class="card">No sessions yet — run a Daily Test to get started.</div>`;
  }

  return `
    <div class="card">
      <h3>Recent Sessions</h3>
      ${sessions
        .map(
          (session) => `
        <div class="session-row">
          <span>${session.topic}</span>
          <span class="meta">${new Date(session.completedAt).toLocaleDateString()}</span>
          <span class="score">${session.score}/${session.total}</span>
        </div>`
        )
        .join("")}
    </div>
  `;
}
