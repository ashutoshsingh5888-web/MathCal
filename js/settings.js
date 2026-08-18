/**
 * settings.js
 * Reads/writes user preferences via storage.js and renders the
 * settings screen. Theme changes apply immediately; other changes
 * take effect on the next session.
 */

import { getSettings, saveSettings, resetAllData } from "./storage.js";
import { renderBackButton, applyTheme, showToast } from "./ui.js";

export function openSettings() {
  const settings = getSettings();
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="screen-enter">
      ${renderBackButton()}
      <h2>Settings</h2>

      <div class="card">
        <label for="questions">Questions per session</label>
        <select id="questions">
          ${[5, 10, 20, 50]
            .map(
              (n) =>
                `<option value="${n}" ${settings.questionsPerSession === n ? "selected" : ""}>${n}</option>`
            )
            .join("")}
        </select>

        <label for="theme">Theme</label>
        <select id="theme">
          <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Chalkboard (Dark)</option>
          <option value="light" ${settings.theme === "light" ? "selected" : ""}>Paper (Light)</option>
        </select>

        <button class="primary block" id="save-settings">Save Settings</button>
      </div>

      <div class="card">
        <h3>Data</h3>
        <p>Clear all saved progress, sessions, mistakes and streaks. This cannot be undone.</p>
        <button class="danger block" id="reset-data">Reset All Data</button>
      </div>
    </div>
  `;

  bindSettingsSave();
  bindResetData();

  // live-preview the theme as the user picks it
  document.getElementById("theme").addEventListener("change", (e) => {
    applyTheme(e.target.value);
  });
}

function bindSettingsSave() {
  document.getElementById("save-settings").addEventListener("click", () => {
    const questionsPerSession = Number(document.getElementById("questions").value);
    const theme = document.getElementById("theme").value;

    saveSettings({ questionsPerSession, theme });
    applyTheme(theme);
    showToast("Settings saved");
  });
}

function bindResetData() {
  document.getElementById("reset-data").addEventListener("click", () => {
    const confirmed = confirm("This will erase all progress, sessions, mistakes and streaks. Continue?");
    if (!confirmed) return;
    resetAllData();
    showToast("All data cleared");
    location.reload();
  });
}
