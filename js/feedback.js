/**
 * feedback.js
 * Renders the Feedback screen and mounts the giscus widget (GitHub
 * Discussions-backed comments) into it. Self-contained — nothing
 * else in the app depends on giscus loading successfully.
 */

import { renderBackButton } from "./ui.js";
import { getSettings } from "./storage.js";

const GISCUS_THEME_BY_APP_THEME = {
  dark: "transparent_dark",
  light: "catppuccin_latte",
};

function appEl() {
  return document.getElementById("app");
}

export function renderFeedback() {
  appEl().innerHTML = `
    <div class="screen-enter">
      ${renderBackButton()}
      <h2>Feedback &amp; Discussion</h2>
      <div class="card">
        <p>
          Found a bug, have an idea, or just want to say something? Post it
          below — it's a public thread, and replies are welcome from anyone.
        </p>
        <p><small>Posting requires a free GitHub account.</small></p>
      </div>
      <div id="giscus-container"></div>
    </div>
  `;

  mountGiscus();
}

function mountGiscus() {
  const container = document.getElementById("giscus-container");
  if (!container) return;

  container.innerHTML = ""; // clear any previous mount before re-embedding

  const theme = GISCUS_THEME_BY_APP_THEME[getSettings().theme] || "transparent_dark";

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", "ashutoshsingh5888-web/MathCal");
  script.setAttribute("data-repo-id", "R_kgDOT0LK_g");
  script.setAttribute("data-category", "Feedback");
  script.setAttribute("data-category-id", "DIC_kwDOT0LK_s4DD2gD");
  script.setAttribute("data-mapping", "specific");
  script.setAttribute("data-term", "mental-math-daily-feedback");
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", theme);
  script.setAttribute("data-lang", "en");
  script.crossOrigin = "anonymous";
  script.async = true;

  container.appendChild(script);
}
