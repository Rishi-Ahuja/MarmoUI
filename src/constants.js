/**
 * MarmoUI — shared configuration.
 *
 * Every module attaches to the `globalThis.MarmoUI` namespace (classic
 * content scripts share one isolated world; an IIFE-per-file plus a single
 * namespace object avoids global-scope collisions without a build step).
 */
(() => {
  'use strict';

  const MUI = (globalThis.MarmoUI ??= {});

  MUI.constants = Object.freeze({
    THEMES: Object.freeze(['light', 'dark', 'vintage']),
    DEFAULT_THEME: 'dark',
    THEME_STORAGE_KEY: 'marmoUITheme',
    THEME_CLASS_PREFIX: 'mui-theme-',

    /** UI generations: 'new' (the redesign) and 'legacy' (the original
        MarmoUI 2.0 look running on the same fixed engine). */
    MODES: Object.freeze(['new', 'legacy']),
    MODE_STORAGE_KEY: 'marmoUIMode',
    MODE_CLASS_PREFIX: 'mui-mode-',

    /** Marmoset renders all dates in campus time. */
    TIME_ZONE: 'America/Toronto',

    SUBMIT_ACTION: '/action/SubmitProjectViaWeb',
    RELEASE_TEST_ACTION: '/action/RequestReleaseTest',
    LOGOUT_PATH: '/authenticate/Logout',

    /** Network policy for background page fetches. */
    FETCH_TIMEOUT_MS: 10_000,
    FETCH_RETRIES: 3,
    FETCH_BACKOFF_MS: 1_000,
    MAX_CONCURRENT_FETCHES: 4,

    /** Re-check cadence for submissions still marked "not tested yet". */
    PENDING_POLL_INTERVAL_MS: 10_000,
    PENDING_POLL_MAX_ATTEMPTS: 18,

    /** Delay before reloading the page after a successful submission. */
    RELOAD_AFTER_SUBMIT_MS: 1_200,
  });
})();
