/**
 * app.js
 * The orchestrator. Contains no question generation, scoring, or
 * storage logic — only:
 *
 *   User Click → Call Module → Render Screen
 */

import { renderDashboard } from "./dashboard.js";
import { renderProgressScreen, applyTheme, showToast } from "./ui.js";
import { startPractice } from "./practice.js";
import { startReview } from "./review.js";
import { startDailyTest } from "./daily-test.js";
import { openSettings } from "./settings.js";
import { getSettings } from "./storage.js";
import { getSuggestedTopic } from "./progress.js";

document.addEventListener("DOMContentLoaded", init);

function init() {
  applyTheme(getSettings().theme);
  bindNavigation();
  showHomeScreen();
  registerServiceWorker();
  bindInstallPrompt();
}

/* ---------------- Navigation ---------------- */

function bindNavigation() {
  document.addEventListener("click", handleNavigation);
}

function handleNavigation(event) {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  switch (action) {
    case "practice":
      showPracticeMenu();
      break;

    case "review":
      startReview();
      break;

    case "progress":
      renderProgressScreen();
      break;

    case "daily-test":
      startDailyTest();
      break;

    case "settings":
      openSettings();
      break;

    case "dashboard":
      showHomeScreen();
      break;
  }
}

/* ---------------- Screens ---------------- */

function showHomeScreen() {
  renderDashboard();
}

function showPracticeMenu() {
  const app = document.getElementById("app");

  const topics = [
    { id: "tables", label: "Tables", sub: "Multiplication facts" },
    { id: "squares", label: "Squares", sub: "n²" },
    { id: "cubes", label: "Cubes", sub: "n³" },
    { id: "powers", label: "Powers", sub: "base^exp" },
    { id: "arithmetic", label: "Arithmetic", sub: "+ − ×" },
  ];

  app.innerHTML = `
    <div class="screen-enter">
      <button class="ghost" data-action="dashboard">← Back</button>
      <h2>Select Topic</h2>
      <div class="menu-grid">
        ${topics
          .map(
            (t) => `
          <button class="menu-tile" data-topic="${t.id}">
            <span>
              ${t.label}
              <span class="sub">${t.sub}</span>
            </span>
            <span>›</span>
          </button>`
          )
          .join("")}
      </div>
    </div>
  `;

  document.querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      showDifficultyMenu(button.dataset.topic);
    });
  });
}

function showDifficultyMenu(topic) {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="screen-enter">
      <button class="ghost" data-action="practice">← Back</button>
      <h2>${topic[0].toUpperCase()}${topic.slice(1)}</h2>
      <div class="menu-grid">
        <button class="menu-tile" data-difficulty="easy">Easy<span>›</span></button>
        <button class="menu-tile" data-difficulty="medium">Medium<span>›</span></button>
        <button class="menu-tile" data-difficulty="hard">Hard<span>›</span></button>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      startPractice(topic, button.dataset.difficulty);
    });
  });
}

/* ---------------- Shortcuts ---------------- */

export function startSuggestedPractice() {
  startPractice(getSuggestedTopic(), "medium");
}

/* ---------------- PWA ---------------- */

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(console.error);
    });
  }
}

/* ---------------- Install (Download Lite App) ---------------- */

let deferredInstallPrompt = null;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function bindInstallPrompt() {
  const btn = document.getElementById("install-btn");
  if (!btn) return;

  if (isStandalone()) {
    // already installed / running as an app — nothing to offer
    return;
  }

  // Chrome / Edge / Android: fires only if the app meets install criteria
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    btn.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    btn.classList.add("hidden");
    showToast("Installed — find it on your home screen");
  });

  // iOS Safari never fires beforeinstallprompt — show the button with
  // manual instructions instead, since "Add to Home Screen" is user-driven there.
  if (isIos()) {
    btn.classList.remove("hidden");
  }

  btn.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (outcome !== "accepted") {
        showToast("Install dismissed — you can try again anytime");
      }
      return;
    }

    if (isIos()) {
      showToast("Tap Share, then \u201cAdd to Home Screen\u201d");
      return;
    }

    showToast("Install isn't available in this browser yet");
  });
}
