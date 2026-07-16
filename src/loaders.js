/**
 * MarmoUI — async data loaders for the problems screen.
 *
 * One shared pipeline per project row:
 *
 *   view page (1 fetch) ─→ latest-submission status
 *        └─ latest submission's detail page (1 fetch) ─→ secret/private + tokens
 *
 * Loaders fetch and PARSE only — results are plain data objects handed to the
 * caller's handlers, so the UI layer (src/problems.js) owns all rendering.
 * Unknown stays unknown: parse failures surface as explicit kinds, never
 * fabricated values. All fetches share a global concurrency limiter.
 *
 * Status results:  {kind:'none'|'pending'|'compileError'|'score'|'text'|'error', ...}
 * Secret results:  {kind:'none'|'score'|'error', ...}
 * Token results:   {kind:'unknown'|'count', count?, next?: Date}
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { log, fetchDoc } = MUI;

  const limit = MUI.pLimit(MUI.constants.MAX_CONCURRENT_FETCHES);

  /** Tolerant "earned / possible" score matcher (any spacing around the slash). */
  const SCORE_RE = /(\d+)\s*\/\s*(\d+)/;

  /** First data row of a fetched view page that links to a submission. */
  function latestSubmissionRow(doc) {
    return (
      [...doc.querySelectorAll('tr')].find(
        (tr) => tr.querySelector('td') && tr.querySelector('a[href*="submission.jsp?"]'),
      ) ?? null
    );
  }

  /** Absolute URL of the latest submission's detail page, or null. */
  function latestSubmissionUrl(doc, baseUrl) {
    const href = latestSubmissionRow(doc)
      ?.querySelector('a[href*="submission.jsp?"]')
      ?.getAttribute('href');
    return href ? new URL(href, baseUrl).href : null;
  }

  /**
   * Column mapping for a project view page's submissions table, driven by its
   * header row. Real headers: `# | submitted | public tests score |
   * [release tests score | release tested] | detailed test results | Download`.
   */
  function mapViewColumns(viewDoc) {
    const idx = { publicScore: 2, releaseScore: -1 };
    const headerRow = [...viewDoc.querySelectorAll('tr')].find((tr) => tr.querySelector('th'));
    if (headerRow) {
      [...headerRow.cells].forEach((th, i) => {
        const label = th.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
        if (/public/.test(label) && /score/.test(label)) idx.publicScore = i;
        else if (/release/.test(label) && /score/.test(label)) idx.releaseScore = i;
      });
    }
    return idx;
  }

  /** Parse the latest-submission status from a project view page. */
  function parseStatus(viewDoc, viewUrl) {
    const row = latestSubmissionRow(viewDoc);
    if (!row) return { kind: 'none' };

    const href = row.querySelector('a[href*="submission.jsp?"]')?.getAttribute('href');
    const url = href ? new URL(href, viewUrl).href : viewUrl;
    const cellTexts = [...row.cells].map((td) => td.textContent.trim());
    const statusText = cellTexts[mapViewColumns(viewDoc).publicScore] ?? cellTexts[2] ?? '';
    const lower = statusText.toLowerCase();

    if (lower.includes('tested yet')) return { kind: 'pending', url };
    if (lower.includes('not compile')) return { kind: 'compileError', url };

    const score = statusText.match(SCORE_RE) ?? cellTexts.map((t) => t.match(SCORE_RE)).find(Boolean);
    if (score) return { kind: 'score', earned: Number(score[1]), possible: Number(score[2]), url };
    return { kind: 'text', text: statusText || 'View', url };
  }

  /**
   * Release-test score from the view page's own "release tests score" column
   * (courses that use release tests instead of secret/private ones).
   */
  function parseRelease(viewDoc, viewUrl) {
    const idx = mapViewColumns(viewDoc);
    if (idx.releaseScore < 0) return { kind: 'none' };
    const row = latestSubmissionRow(viewDoc);
    const score = row?.cells[idx.releaseScore]?.textContent.match(SCORE_RE);
    if (!score) return { kind: 'none' };
    return {
      kind: 'score',
      earned: Number(score[1]),
      possible: Number(score[2]),
      url: latestSubmissionUrl(viewDoc, viewUrl) ?? viewUrl,
      source: 'release',
    };
  }

  /** Sum secret/private points from a detail page's results table. */
  function parseSecret(detailDoc, detailUrl) {
    const table = detailDoc.querySelector('.testResults');
    const rows = table ? [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td')) : [];
    if (!rows.length) return { kind: 'none' };

    let earned = 0;
    let possible = 0;
    for (const row of rows) {
      const type = row.cells[0]?.textContent.trim().toLowerCase() ?? '';
      if (!/secret|private/.test(type) || type.includes('public')) continue;
      const outcome = row.cells[2]?.textContent.trim().toLowerCase() ?? '';
      const points = Number.parseInt(row.cells[3]?.textContent.trim() ?? '', 10);
      if (Number.isNaN(points)) continue;
      possible += points;
      if (outcome === 'passed') earned += points;
    }
    if (possible === 0) return { kind: 'none' };
    return { kind: 'score', earned, possible, url: detailUrl };
  }

  /** Parse the release-token count and next regeneration time from a detail page. */
  function parseTokens(detailDoc, now = new Date()) {
    // Server markup wraps lines mid-sentence ("3 release\n\ttokens") —
    // normalize whitespace before matching.
    const bodyText = (detailDoc.body?.textContent ?? '').replace(/\s+/g, ' ');
    const countMatch =
      bodyText.match(/you currently have (\d+) release tokens?/i) ??
      bodyText.match(/release tokens?\s*:\s*(\d+)/i);
    if (!countMatch) return { kind: 'unknown' };

    const upcoming = [...detailDoc.querySelectorAll('li')]
      .map((li) => MUI.dates.parseMarmosetDate(li.textContent, { now }))
      .filter((date) => date && date > now)
      .sort((a, b) => a - b);

    return { kind: 'count', count: Number(countMatch[1]), next: upcoming[0] ?? null };
  }

  /**
   * Load one problem row's data. Handlers may each be called more than once
   * (e.g. 'pending' now, a final status after a bounded re-check later).
   *
   * @param {object} params
   * @param {string} params.viewUrl - absolute URL of the project view page
   * @param {(status: object) => void} params.onStatus
   * @param {(secret: object) => void} params.onSecret
   * @param {(tokens: object) => void} params.onTokens
   */
  async function loadProblem({ viewUrl, onStatus, onSecret, onTokens }, attempt = 0) {
    let viewDoc;
    try {
      viewDoc = await limit(() => fetchDoc(viewUrl));
    } catch (err) {
      log.warn(`Failed to load ${viewUrl}:`, err);
      onStatus({ kind: 'error', url: viewUrl });
      onSecret({ kind: 'error' });
      onTokens({ kind: 'unknown' });
      return;
    }

    const status = parseStatus(viewDoc, viewUrl);
    onStatus(status);

    if (status.kind === 'pending' && attempt < MUI.constants.PENDING_POLL_MAX_ATTEMPTS) {
      setTimeout(() => {
        loadProblem({ viewUrl, onStatus, onSecret, onTokens }, attempt + 1);
      }, MUI.constants.PENDING_POLL_INTERVAL_MS);
      // Fall through: still surface secret/tokens from the current snapshot.
    }

    // Release-test courses publish the hidden score right on the view page.
    const release = MUI.safe('parse release score', () => parseRelease(viewDoc, viewUrl)) ?? { kind: 'none' };
    if (release.kind === 'score') onSecret(release);

    const detailUrl = latestSubmissionUrl(viewDoc, viewUrl);
    if (!detailUrl) {
      if (release.kind !== 'score') onSecret({ kind: 'none' });
      onTokens({ kind: 'unknown' });
      return;
    }

    try {
      const detailDoc = await limit(() => fetchDoc(detailUrl));
      MUI.safe('parse secret scores', () => {
        const secret = parseSecret(detailDoc, detailUrl);
        // Detail-page secret/private beats the view-page release column;
        // a release score already shown is never downgraded to "none".
        if (secret.kind === 'score' || release.kind !== 'score') onSecret(secret);
      });
      MUI.safe('parse tokens', () => onTokens(parseTokens(detailDoc)));
    } catch (err) {
      log.warn(`Failed to load ${detailUrl}:`, err);
      if (release.kind !== 'score') onSecret({ kind: 'error' });
      onTokens({ kind: 'unknown' });
    }
  }

  MUI.loaders = { loadProblem, parseStatus, parseRelease, parseSecret, parseTokens };
})();
