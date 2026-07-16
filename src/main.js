/**
 * MarmoUI — bootstrap.
 *
 * Dispatches on the UI mode ('new' | 'legacy'); every step runs through
 * safe() so one failing enhancement degrades gracefully instead of taking
 * the whole overlay down with it.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { log, safe } = MUI;

  const version = globalThis.chrome?.runtime?.getManifest?.().version ?? 'dev';
  const mode = MUI.mode.get();
  const page = MUI.pages.detectPage(location.href, document);
  log.info(`v${version} enhancing ${page} page (${mode} UI)`);

  if (mode === 'legacy') {
    MUI.legacy.enhance(page);
    return;
  }

  const context = safe('global chrome', () => MUI.pages.applyGlobalChrome(page));
  if (context) {
    safe(`${page} enhancer`, () => MUI.pages.enhance(page, context));
  }
})();
