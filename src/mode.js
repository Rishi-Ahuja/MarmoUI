/**
 * MarmoUI — UI-generation switch: 'new' | 'legacy'.
 *
 * 'legacy' renders the original MarmoUI 2.0 look (legacy/legacy.js) on the
 * same fixed engine.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { MODES, MODE_STORAGE_KEY } = MUI.constants;

  function get() {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      return MODES.includes(saved) ? saved : MODES[0];
    } catch {
      return MODES[0];
    }
  }

  /** Persist the mode and reload — each mode owns the whole page. */
  function set(mode) {
    if (!MODES.includes(mode)) {
      MUI.log.warn(`Ignoring unknown UI mode "${mode}"`);
      return;
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Storage unavailable — reload still applies nothing new; bail quietly.
    }
    location.reload();
  }

  MUI.mode = { get, set };
})();
