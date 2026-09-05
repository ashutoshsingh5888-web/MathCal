/**
 * learn.js
 * A self-check reference/study mode, separate from practice.js. No
 * timer, no scoring, no storage writes. Each row asks for recall
 * first — type the answer, get an instant tick, and focus jumps to
 * the next one automatically. A per-row "Show" reveals a single
 * answer if you're stuck; a top-level toggle reveals (or re-hides)
 * the whole table at once for a quick browse.
 */

import { renderBackButton } from "./ui.js";
import { trackEvent } from "./state.js";

function appEl() {
  return document.getElementById("app");
}

/* ---------------- Menu ---------------- */

export function renderLearnMenu() {
  ensureLearnBindings();

  appEl().innerHTML = `
    <div class="screen-enter">
      ${renderBackButton()}
      <h2>Learn</h2>
      <p class="learn-intro">
        Type the answer for each one — a tick means you've got it, and
        the cursor jumps to the next box automatically. Stuck? Reveal
        one answer, or the whole table.
      </p>
      <div class="menu-grid">
        <button class="menu-tile" data-learn="tables">
          <span>Multiplication Tables<span class="sub">10–30</span></span>
          <span>›</span>
        </button>
        <button class="menu-tile" data-learn="squares">
          <span>Squares<span class="sub">1–40</span></span>
          <span>›</span>
        </button>
        <button class="menu-tile" data-learn="cubes">
          <span>Cubes<span class="sub">1–20</span></span>
          <span>›</span>
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-learn]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = button.dataset.learn;
      trackEvent({ event: "learn_topic_open", topic });
      if (topic === "tables") renderTablesLearn();
      else if (topic === "squares") renderNumberSeriesLearn("squares");
      else if (topic === "cubes") renderNumberSeriesLearn("cubes");
    });
  });
}

/* ---------------- Row builder (shared) ---------------- */

function buildLearnRow(exprHtml, answer) {
  return `
    <div class="learn-row">
      <span class="learn-expr">${exprHtml}</span>
      <span class="learn-input-wrap">
        <input
          type="number"
          inputmode="numeric"
          class="learn-input"
          data-answer="${answer}"
          autocomplete="off"
          aria-label="Answer for ${exprHtml}"
        />
        <span class="learn-check"></span>
        <button type="button" class="learn-show hidden">Show</button>
      </span>
    </div>`;
}

function toggleAllButton(targetId) {
  return `<button type="button" class="learn-toggle-all" data-target="${targetId}" data-state="hidden">Show All</button>`;
}

/* ---------------- Tables ---------------- */

function multiplesFor(n) {
  // 10–25 get the full ×1–×10; the higher tables (26–30) only go to ×5,
  // matching the range that's actually worth memorizing in full.
  return n <= 25 ? 10 : 5;
}

function renderTablesLearn(selected = 10) {
  const numbers = Array.from({ length: 21 }, (_, i) => i + 10); // 10..30

  appEl().innerHTML = `
    <div class="screen-enter">
      <button class="ghost" data-action="learn">← Back</button>
      <h2>Multiplication Tables</h2>
      <p class="learn-intro">Pick a number, then type each answer from memory.</p>

      <div class="chip-grid" id="tableNumberPicker">
        ${numbers
          .map(
            (n) =>
              `<button class="chip-btn ${n === selected ? "active" : ""}" data-table-num="${n}">${n}</button>`
          )
          .join("")}
      </div>

      <div class="learn-toolbar">
        <h3 id="tableGridTitle" style="margin:0;">Table of ${selected}</h3>
        ${toggleAllButton("tableGrid")}
      </div>

      <div class="card">
        <div class="learn-grid" id="tableGrid"></div>
      </div>
    </div>
  `;

  renderTableGrid(selected);

  document.getElementById("tableNumberPicker").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-table-num]");
    if (!btn) return;
    const n = Number(btn.dataset.tableNum);
    document.querySelectorAll("[data-table-num]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tableGridTitle").textContent = `Table of ${n}`;
    renderTableGrid(n);
    resetToggleButton(document.querySelector('.learn-toggle-all[data-target="tableGrid"]'));
  });
}

function renderTableGrid(n) {
  const grid = document.getElementById("tableGrid");
  const upTo = multiplesFor(n);

  grid.innerHTML = Array.from({ length: upTo }, (_, i) => i + 1)
    .map((m) => buildLearnRow(`${n} × ${m}`, n * m))
    .join("");
}

/* ---------------- Squares / Cubes ---------------- */

function renderNumberSeriesLearn(kind) {
  const isSquares = kind === "squares";
  const max = isSquares ? 40 : 20;
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  const label = isSquares ? "²" : "³";
  const title = isSquares ? "Squares" : "Cubes";
  const gridId = isSquares ? "squaresGrid" : "cubesGrid";
  const compute = (n) => (isSquares ? n * n : n * n * n);

  appEl().innerHTML = `
    <div class="screen-enter">
      <button class="ghost" data-action="learn">← Back</button>
      <div class="learn-toolbar">
        <h2 style="margin:0;">${title} 1–${max}</h2>
        ${toggleAllButton(gridId)}
      </div>
      <p class="learn-intro">Type each answer from memory — reveal only if you're stuck.</p>

      <div class="card">
        <div class="learn-grid learn-grid-two-col" id="${gridId}">
          ${nums.map((n) => buildLearnRow(`${n}${label}`, compute(n))).join("")}
        </div>
      </div>
    </div>
  `;
}

/* ---------------- Toggle-all reset (used when the underlying grid changes) ---------------- */

function resetToggleButton(btn) {
  if (!btn) return;
  btn.textContent = "Show All";
  btn.dataset.state = "hidden";
}

/* ---------------- Self-check interactivity (bound once, delegated) ---------------- */

let learnBound = false;

function ensureLearnBindings() {
  if (learnBound) return;
  learnBound = true;

  document.addEventListener("input", (event) => {
    const input = event.target.closest(".learn-input");
    if (!input) return;
    evaluateLearnInput(input);
  });

  // focusout bubbles (unlike blur), so this works with plain delegation
  document.addEventListener("focusout", (event) => {
    const input = event.target.closest(".learn-input");
    if (!input || input.disabled) return;
    if (!input.classList.contains("correct")) {
      const row = input.closest(".learn-row");
      row.querySelector(".learn-show")?.classList.remove("hidden");
    }
  });

  document.addEventListener("click", (event) => {
    const showBtn = event.target.closest(".learn-show");
    if (showBtn) {
      revealSingleRow(showBtn);
      return;
    }

    const toggleBtn = event.target.closest(".learn-toggle-all");
    if (toggleBtn) {
      toggleAllAnswers(toggleBtn);
    }
  });
}

function evaluateLearnInput(input) {
  const answer = Number(input.dataset.answer);
  const value = input.value.trim();
  if (value === "" || Number(value) !== answer) return;

  markRowCorrect(input);

  // move on to the next box automatically
  const row = input.closest(".learn-row");
  const nextInput = row.nextElementSibling?.querySelector(".learn-input");
  if (nextInput && !nextInput.disabled) {
    nextInput.focus();
  }
}

function markRowCorrect(input) {
  input.classList.add("correct");
  input.classList.remove("revealed");
  input.disabled = true;
  const row = input.closest(".learn-row");
  row.querySelector(".learn-check").textContent = "✓";
  row.querySelector(".learn-show")?.classList.add("hidden");
}

function revealSingleRow(showBtn) {
  const row = showBtn.closest(".learn-row");
  const input = row.querySelector(".learn-input");
  input.value = input.dataset.answer;
  input.disabled = true;
  input.classList.add("revealed");
  input.classList.remove("correct");
  showBtn.classList.add("hidden");
}

function toggleAllAnswers(btn) {
  const grid = document.getElementById(btn.dataset.target);
  if (!grid) return;

  const isShowing = btn.dataset.state === "shown";
  const inputs = grid.querySelectorAll(".learn-input");

  if (isShowing) {
    // hide again — back to blank, editable, ready to self-test
    inputs.forEach((input) => {
      input.value = "";
      input.disabled = false;
      input.classList.remove("correct", "revealed");
    });
    grid.querySelectorAll(".learn-check").forEach((el) => (el.textContent = ""));
    grid.querySelectorAll(".learn-show").forEach((el) => el.classList.add("hidden"));
    btn.textContent = "Show All";
    btn.dataset.state = "hidden";
  } else {
    inputs.forEach((input) => {
      input.value = input.dataset.answer;
      input.disabled = true;
      input.classList.add("revealed");
      input.classList.remove("correct");
    });
    grid.querySelectorAll(".learn-check").forEach((el) => (el.textContent = ""));
    grid.querySelectorAll(".learn-show").forEach((el) => el.classList.add("hidden"));
    btn.textContent = "Hide All";
    btn.dataset.state = "shown";
    trackEvent({ event: "learn_show_all", target: btn.dataset.target });
  }
}
