/**
 * ui.js
 * Reusable render primitives shared by practice.js, review.js,
 * daily-test.js and the progress screen. Owns no state — every
 * function here takes data in and returns/paints markup.
 */

import {
  getOverallAccuracy,
  getReadinessScore,
  getWeakestTopic,
  getStrongestTopic,
  getAllTopicAccuracy,
} from "./progress.js";
import { getSessions, getStreaks, getMistakes } from "./storage.js";
import { topicLabel } from "./generators.js";

function appEl() {
  return document.getElementById("app");
}

export function renderBackButton(label = "Back") {
  return `<button class="ghost" data-action="dashboard">← ${label}</button>`;
}

const SWOOSH = `
  <svg class="swoosh" viewBox="0 0 140 16" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10 Q 35 2, 70 8 T 136 6" />
  </svg>
`;

/**
 * Renders one in-progress question for Practice, Review, or the
 * Daily Test. `kind` controls which action buttons fire, and the
 * caller wires up its own submit handler by element id.
 */
export function renderQuestionScreen({
  kind, // "practice" | "review" | "daily-test"
  topic,
  difficulty,
  index,
  total,
  questionText,
  onBack = true,
}) {
  const pct = total ? Math.round((index / total) * 100) : 0;
  const label = topicLabel(topic);

  appEl().innerHTML = `
    <div class="screen-enter">
      ${onBack ? renderBackButton() : ""}
      <div class="practice-topbar">
        <span>${label}${difficulty ? " · " + difficulty : ""}</span>
        <span>${index + 1} / ${total}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="card question-card">
        ${SWOOSH}
        <div class="question">${questionText}</div>
        <div class="answer-row">
          <input
            id="${kind}-answer"
            type="number"
            inputmode="numeric"
            placeholder="Your answer"
            autofocus
          />
          <button class="primary" id="${kind}-submit">Check</button>
        </div>
        <div class="feedback" id="${kind}-feedback"></div>
      </div>
    </div>
  `;

  const input = document.getElementById(`${kind}-answer`);
  if (input) {
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        document.getElementById(`${kind}-submit`)?.click();
      }
    });
  }
}

export function showFeedback(kind, isCorrect, correctAnswer) {
  const el = document.getElementById(`${kind}-feedback`);
  if (!el) return;
  el.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  el.textContent = isCorrect ? "Correct ✓" : `Not quite — answer was ${correctAnswer}`;
}

export function renderSummary({ topic, score, total, accuracy, duration, nextAction }) {
  appEl().innerHTML = `
    <div class="screen-enter card summary-card">
      <h3>${topic} complete</h3>
      <div class="summary-score">${score}/${total}</div>
      <div class="summary-grid">
        <div><span class="v">${accuracy}%</span><small>Accuracy</small></div>
        <div><span class="v">${duration}s</span><small>Time</small></div>
        <div><span class="v">${total}</span><small>Questions</small></div>
      </div>
      <button class="primary block" data-action="dashboard">Back to Dashboard</button>
      ${nextAction || ""}
    </div>
  `;
}

export function renderEmptyState(message, glyph = "◇") {
  appEl().innerHTML = `
    <div class="screen-enter">
      ${renderBackButton()}
      <div class="card empty-state">
        <span class="glyph">${glyph}</span>
        <p>${message}</p>
      </div>
    </div>
  `;
}

export function renderLoading() {
  appEl().innerHTML = `<div class="loading">Loading…</div>`;
}

/* ---------------- Progress screen ---------------- */

export function renderProgressScreen() {
  const overall = getOverallAccuracy();
  const readiness = getReadinessScore();
  const weakest = getWeakestTopic();
  const strongest = getStrongestTopic();
  const topicAcc = getAllTopicAccuracy();
  const sessions = getSessions().slice(0, 10);
  const mistakeCount = getMistakes().length;

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (circumference * readiness) / 100;

  appEl().innerHTML = `
    <div class="screen-enter">
      ${renderBackButton()}
      <h2>Progress</h2>

      <div class="card">
        <div class="readiness-wrap">
          <svg class="readiness-ring" width="100" height="100" viewBox="0 0 100 100">
            <circle class="track" cx="50" cy="50" r="42"></circle>
            <circle
              class="fill"
              cx="50" cy="50" r="42"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
            ></circle>
            <text x="50" y="55" text-anchor="middle" font-size="20">${readiness}%</text>
          </svg>
          <div class="readiness-copy">
            <div class="label">Readiness Score</div>
            <strong>${overall}% overall accuracy</strong>
            <p>${mistakeCount} question${mistakeCount === 1 ? "" : "s"} queued for review.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>By Topic</h3>
        ${Object.entries(topicAcc)
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

      <div class="card">
        <h3>Standouts</h3>
        <p>Strongest: <strong>${strongest ? topicLabel(strongest) : "—"}</strong></p>
        <p>Needs work: <strong>${weakest ? topicLabel(weakest) : "—"}</strong></p>
      </div>

      <div class="card">
        <h3>Recent Sessions</h3>
        ${
          sessions.length === 0
            ? `<p>No sessions yet.</p>`
            : sessions
                .map(
                  (s) => `
          <div class="session-row">
            <span>${s.topic}</span>
            <span class="meta">${new Date(s.completedAt).toLocaleDateString()}</span>
            <span class="score">${s.score}/${s.total}</span>
          </div>`
                )
                .join("")
        }
      </div>
    </div>
  `;
}

/* ---------------- Toast ---------------- */

let toastTimer = null;

export function showToast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------------- Theme ---------------- */

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
}
