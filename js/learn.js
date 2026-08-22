/**
 * learn.js
 * A self-check reference/study mode, separate from practice.js. No
 * timer, no scoring, no storage writes — but unlike a plain static
 * table, each row asks for recall first: type the answer, get an
 * instant tick if it's right, or reveal it on request if it isn't.
 */

import { renderBackButton } from "./ui.js";

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
        Type the answer for each one — a tick means you've got it. If
        you're stuck, reveal it rather than guessing.
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

      <div class="card">
        <h3 id="tableGridTitle">Table of ${selected}</h3>
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
  const compute = (n) => (isSquares ? n * n : n * n * n);

  appEl().innerHTML = `
    <div class="screen-enter">
      <button class="ghost" data-action="learn">← Back</button>
      <h2>${title} 1–${max}</h2>
      <p class="learn-intro">Type each answer from memory — reveal only if you're stuck.</p>

      <div class="card">
        <div class="learn-grid learn-grid-two-col">
          ${nums.map((n) => buildLearnRow(`${n}${label}`, compute(n))).join("")}
        </div>
      </div>
    </div>
  `;
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
    if (!showBtn) return;
    const row = showBtn.closest(".learn-row");
    const input = row.querySelector(".learn-input");
    input.value = input.dataset.answer;
    input.disabled = true;
    input.classList.add("revealed");
    showBtn.classList.add("hidden");
  });
}

function evaluateLearnInput(input) {
  const answer = Number(input.dataset.answer);
  const value = input.value.trim();
  if (value === "" || Number(value) !== answer) return;

  input.classList.add("correct");
  input.disabled = true;
  const row = input.closest(".learn-row");
  row.querySelector(".learn-check").textContent = "✓";
  row.querySelector(".learn-show")?.classList.add("hidden");
}
