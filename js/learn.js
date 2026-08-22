/**
 * learn.js
 * A reference/study mode, separate from practice.js. No scoring, no
 * timer, no storage writes — just the full table laid out so the
 * user can study it before being quizzed on it in Practice or the
 * Daily Test.
 */

import { renderBackButton } from "./ui.js";

function appEl() {
  return document.getElementById("app");
}

/* ---------------- Menu ---------------- */

export function renderLearnMenu() {
  appEl().innerHTML = `
    <div class="screen-enter">
      ${renderBackButton()}
      <h2>Learn</h2>
      <p class="learn-intro">
        Study the full table before drilling it in Practice — no timer,
        no scoring, just the reference.
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
      <p class="learn-intro">Pick a number to see its full table.</p>

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
    .map(
      (m) => `
      <div class="learn-row">
        <span class="learn-expr">${n} × ${m}</span>
        <span class="learn-result">${n * m}</span>
      </div>`
    )
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
      <p class="learn-intro">Scan the sequence — notice how the pattern grows.</p>

      <div class="card">
        <div class="learn-grid learn-grid-two-col">
          ${nums
            .map(
              (n) => `
            <div class="learn-row">
              <span class="learn-expr">${n}${label}</span>
              <span class="learn-result">${compute(n)}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}
