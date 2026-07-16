/**
 * MarmoUI — early mode/theme applier.
 *
 * Runs at document_start (before first paint): stamps the UI mode class and,
 * in the new UI, the saved theme class onto <html> so the page never flashes
 * the wrong skin. Everything else loads at document_end; keep this file
 * dependency-free and tiny.
 */
(() => {
  'use strict';

  const THEMES = ['light', 'dark', 'vintage'];
  const MODES = ['new', 'legacy'];
  const THEME_KEY = 'marmoUITheme';
  const MODE_KEY = 'marmoUIMode';

  let theme = 'dark'; // default: dark, new UI
  let mode = MODES[0];
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (THEMES.includes(savedTheme)) theme = savedTheme;
    const savedMode = localStorage.getItem(MODE_KEY);
    if (MODES.includes(savedMode)) mode = savedMode;
  } catch {
    // Storage unavailable (e.g. blocked in private mode) — keep the defaults.
  }

  document.documentElement.classList.add(`mui-mode-${mode}`);
  if (mode === 'new') {
    document.documentElement.classList.add(`mui-theme-${theme}`);
  }
})();
