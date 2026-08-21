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

export function renderDashboard() {
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

function renderHeroCard() {
  const streaks = getStreaks();
  return `
    <div class="card hero-card">
      <div class="hero-eyebrow">Mental Math Daily</div>
      <h1>Keep the streak alive</h1>
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
      <div class="action-grid">
        <button class="primary" data-action="daily-test">▸ Daily Test</button>
        <button data-action="practice">Practice</button>
        <button data-action="review">Review Mistakes</button>
        <button data-action="progress">Progress</button>
        <button data-action="settings">Settings</button>
        <button data-action="feedback">Feedback</button>
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
        .map(
          ([topic, pct]) => `
        <div class="topic-row">
          <span>${topicLabel(topic)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="pct">${pct}%</span>
        </div>`
        )
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
      <div class="badge-row">
        ${badges
          .map(
            (b) => `<span class="badge ${b.earned ? "earned" : ""}">${b.earned ? "🏅 " : "· "}${b.label}</span>`
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
