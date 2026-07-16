/**
 * MarmoUI — theme management.
 *
 * The active theme is a `mui-theme-*` class on <html> (stamped pre-paint by
 * early-theme.js). Using classList — never a wholesale className assignment —
 * preserves any classes the page itself may set.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY, THEME_CLASS_PREFIX } = MUI.constants;

  /** @returns {string} the active theme name */
  function getTheme() {
    const root = document.documentElement.classList;
    return THEMES.find((theme) => root.contains(THEME_CLASS_PREFIX + theme)) ?? DEFAULT_THEME;
  }

  /** @param {string} theme - one of MUI.constants.THEMES */
  function setTheme(theme) {
    if (!THEMES.includes(theme)) {
      MUI.log.warn(`Ignoring unknown theme "${theme}"`);
      return;
    }
    const root = document.documentElement.classList;
    for (const candidate of THEMES) {
      root.toggle(THEME_CLASS_PREFIX + candidate, candidate === theme);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable — the theme still applies for this page view.
    }
  }

  MUI.theme = { getTheme, setTheme };
})();
