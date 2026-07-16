/**
 * MarmoUI — problems screen (the design's "Assignments" view).
 *
 * Parses Marmoset's legacy problems table into data, replaces it with the
 * design's grid UI (stat cards, filter, sortable columns, token dots, live
 * countdowns, secret-score reveal, keyboard navigation), and feeds each row
 * from src/loaders.js. If the legacy table can't be parsed, the page is left
 * untouched apart from the global chrome.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { $, el, log } = MUI;

  const TOKEN_MAX = 3; // Marmoset's standard release-token pool

  const state = {
    problems: [],
    selIdx: 0,
    revealAll: true, // secret/private scores visible by default; toggle hides them
    sortKey: 'due',
    sortDir: 1,
    els: {},
  };

  /* ========================================================================
     Extraction
     ======================================================================== */

  /** Split "A5: Graphs & Trees" into { code: "A5", name: "Graphs & Trees" }. */
  function splitProblemName(text) {
    const match = text.match(/^([A-Za-z]{1,6}\s?\d+[a-z]?)\s*[:.·—-]\s*(.+)$/);
    if (match) return { code: match[1].replace(/\s+/g, ''), name: match[2].trim() };
    return { code: '', name: text.trim() };
  }

  function extractProblems(table) {
    const headers = [...(table.querySelector('tr')?.cells ?? [])];
    const dueIdx = headers.findIndex((th) => /due/i.test(th.textContent));
    const rows = [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td'));
    const now = new Date();

    return rows
      .map((row) => {
        const label = row.cells[0]?.textContent.trim() ?? '';
        if (!label) return null;
        const { code, name } = splitProblemName(label);
        const openUrl = row.querySelector('a[href*="project.jsp?"]')?.href ?? '';
        const submitAnchor = row.querySelector('a[href*="submitProject.jsp"]');
        const submitUrl = submitAnchor?.href ?? '';
        const projectPK = submitUrl ? new URL(submitUrl).searchParams.get('projectPK') : null;
        const dueText = dueIdx >= 0 ? (row.cells[dueIdx]?.textContent.trim() ?? '') : '';
        const due = dueText ? MUI.dates.parseMarmosetDate(dueText, { now }) : null;
        return {
          code, name, openUrl, submitUrl, projectPK, dueText, due,
          status: { kind: 'loading' },
          secret: { kind: 'loading' },
          tokens: { kind: 'loading' },
          revealed: false,
          els: {},
        };
      })
      .filter(Boolean);
  }

  /* ========================================================================
     Cell renderers
     ======================================================================== */

  const spinner = () => el('span', { className: 'mui-spinner', attrs: { 'aria-label': 'Loading' } });

  const chip = (text, pass, href) => {
    const className = `mui-chip ${pass ? 'mui-chip--pass' : 'mui-chip--fail'}`;
    return href
      ? el('a', { className, text, attrs: { href } })
      : el('span', { className, text });
  };

  function renderStatusCell(p) {
    const cell = p.els.pub;
    const s = p.status;
    if (s.kind === 'loading') cell.replaceChildren(spinner());
    else if (s.kind === 'none') cell.replaceChildren(el('span', { className: 'mui-text-none', text: 'No submission' }));
    else if (s.kind === 'pending') {
      cell.replaceChildren(el('a', {
        className: 'mui-text-untested', text: 'Not tested',
        attrs: { href: s.url, title: 'Still in the testing queue — rechecking periodically' },
      }));
    } else if (s.kind === 'compileError') cell.replaceChildren(chip('Compile error', false, s.url));
    else if (s.kind === 'score') cell.replaceChildren(chip(`${s.earned} / ${s.possible}`, s.earned >= s.possible, s.url));
    else if (s.kind === 'text') cell.replaceChildren(el('a', { className: 'mui-text-untested', text: s.text, attrs: { href: s.url } }));
    else cell.replaceChildren(el('span', { className: 'mui-text-none', text: 'Failed to load', attrs: { title: 'Could not fetch this project’s view page' } }));
  }

  function renderSecretCell(p) {
    const cell = p.els.secret;
    const s = p.secret;
    if (s.kind === 'loading') { cell.replaceChildren(spinner()); return; }
    if (s.kind === 'none' || s.kind === 'error') {
      cell.replaceChildren(el('span', {
        className: 'mui-text-none', text: '—',
        attrs: s.kind === 'error' ? { title: 'Could not load the submission page' } : { title: 'No secret/private tests' },
      }));
      return;
    }
    if (state.revealAll || p.revealed) {
      cell.replaceChildren(chip(`${s.earned} / ${s.possible}`, s.earned >= s.possible, s.url));
    } else {
      cell.replaceChildren(el('button', {
        className: 'mui-reveal-btn', text: '••• reveal',
        attrs: { type: 'button', 'aria-label': `Reveal secret score for ${p.code || p.name}` },
        on: { click: () => { p.revealed = true; renderSecretCell(p); } },
      }));
    }
  }

  function renderTokensCell(p) {
    const cell = p.els.tokens;
    const t = p.tokens;
    if (t.kind === 'loading') { cell.replaceChildren(spinner()); return; }
    if (t.kind !== 'count') {
      cell.replaceChildren(el('span', { className: 'mui-text-none', text: '—', attrs: { title: 'Token count not shown yet — submit once to see it' } }));
      return;
    }
    const full = Math.min(t.count, TOKEN_MAX);
    const parts = [
      el('span', { className: 'mui-tokens-full', text: '●'.repeat(full) }),
      el('span', { className: 'mui-tokens-empty', text: '○'.repeat(Math.max(0, TOKEN_MAX - full)) }),
    ];
    if (t.next) {
      const inMs = t.next.getTime() - Date.now();
      if (inMs > 0) parts.push(el('div', { className: 'mui-token-note', text: `+1 in ${MUI.dates.formatDuration(inMs)}` }));
    }
    cell.replaceChildren(...parts);
    cell.title = `${t.count} release token${t.count === 1 ? '' : 's'}`;
  }

  function renderDueCell(p, now = new Date()) {
    const cell = p.els.due;
    if (!p.due) {
      if (cell.childElementCount === 0) cell.replaceChildren(el('span', { className: 'mui-text-none', text: p.dueText || '—' }));
      return;
    }
    const cd = MUI.dates.formatCountdown(p.due, now);
    const renderKey = `${cd.text}|${cd.closed}`;
    if (p.lastDueRender === renderKey) return; // ticker no-op until the label actually changes
    p.lastDueRender = renderKey;
    if (cd.closed) {
      cell.replaceChildren(el('span', { className: 'mui-closed-text', text: `Closed · ${p.dueText}` }));
    } else {
      cell.replaceChildren(
        el('div', { className: `mui-countdown${cd.urgent ? ' mui-urgent' : ''}`, text: cd.text }),
        el('div', { className: 'mui-due-date', text: p.dueText }),
      );
    }
  }

  function renderSubmitCell(p) {
    // Submit stays available even past the deadline — whether a late
    // submission is accepted is Marmoset's call, not ours.
    const cell = p.els.submit;
    if (p.projectPK && p.submitUrl) {
      cell.replaceChildren(el('a', {
        className: 'mui-btn', text: 'Submit', attrs: { href: p.submitUrl },
        on: {
          click: (event) => {
            event.preventDefault();
            openPopupFor(p);
          },
        },
      }));
    } else if (p.submitUrl) {
      cell.replaceChildren(el('a', { className: 'mui-btn', text: 'Submit', attrs: { href: p.submitUrl } }));
    } else {
      cell.replaceChildren(el('span', { className: 'mui-text-none', text: '—' }));
    }
  }

  function openPopupFor(p) {
    MUI.submit.openSubmissionPopup({
      projectPK: p.projectPK,
      projectName: [p.code, p.name].filter(Boolean).join(' · '),
      eyebrow: [state.courseLabel, p.code].filter(Boolean).join(' · '),
      dueDateText: p.dueText,
      due: p.due,
      viewUrl: p.openUrl,
    });
  }

  /* ========================================================================
     Sorting, filtering, selection
     ======================================================================== */

  const SORT_VALUE = {
    name: (p) => p.code || p.name,
    pub: (p) => (p.status.kind === 'score' ? (p.status.earned / Math.max(1, p.status.possible)) * 100 : -1),
    tokens: (p) => (p.tokens.kind === 'count' ? p.tokens.count : -1),
    due: (p, now) => {
      if (!p.due) return 8e15;
      const ms = p.due.getTime() - now;
      return ms <= 0 ? 9e15 - ms : ms; // closed problems sort after open ones
    },
  };

  function visibleProblems() {
    const now = Date.now();
    const value = SORT_VALUE[state.sortKey] ?? SORT_VALUE.due;
    return [...state.problems].sort((a, b) => {
      const x = value(a, now);
      const y = value(b, now);
      return x < y ? -1 * state.sortDir : x > y ? state.sortDir : 0;
    });
  }

  /** Re-apply sort order and the keyboard selection ring. */
  function applyView() {
    const visible = visibleProblems();
    visible.forEach((p) => state.els.list.appendChild(p.els.row));
    state.selIdx = Math.max(0, Math.min(visible.length - 1, state.selIdx));
    state.problems.forEach((p) => p.els.row.classList.remove('mui-selected'));
    visible[state.selIdx]?.els.row.classList.add('mui-selected');
    state.visible = visible;
    updateStatusLine();
    updateSortArrows();
  }

  function updateSortArrows() {
    for (const [key, span] of Object.entries(state.els.arrows)) {
      span.textContent = state.sortKey === key ? (state.sortDir > 0 ? ' ↑' : ' ↓') : '';
    }
  }

  function sortBy(key) {
    state.sortDir = state.sortKey === key ? -state.sortDir : 1;
    state.sortKey = key;
    applyView();
  }

  function moveSel(delta) {
    if (!state.visible?.length) return;
    state.selIdx = Math.max(0, Math.min(state.visible.length - 1, state.selIdx + delta));
    state.problems.forEach((p) => p.els.row.classList.remove('mui-selected'));
    const selected = state.visible[state.selIdx];
    selected.els.row.classList.add('mui-selected');
    selected.els.row.scrollIntoView({ block: 'nearest' });
  }

  /* ========================================================================
     Stats + status line + ticker
     ======================================================================== */

  function computeStats() {
    const now = new Date();
    let open = 0;
    let soon = 0;
    for (const p of state.problems) {
      if (!p.due) continue;
      const cd = MUI.dates.formatCountdown(p.due, now);
      if (!cd.closed) {
        open += 1;
        if (cd.urgent) soon += 1;
      }
    }
    return { open, soon };
  }

  function updateStatusLine() {
    const s = computeStats();
    state.els.statusLine.textContent =
      `${state.problems.length} problems · ${s.open} open · ${s.soon} due within 24h`;
  }

  function tick() {
    const now = new Date();
    for (const p of state.problems) {
      if (p.due) renderDueCell(p, now);
    }
    updateStatusLine();
  }

  /* ========================================================================
     Keyboard
     ======================================================================== */

  function onKeydown(event) {
    if (MUI.palette?.isOpen()) return;
    const tag = (event.target?.tagName ?? '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (event.key === 'Escape') event.target.blur?.();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector('.mui-popup')) return;

    if (event.key === 'j' || event.key === 'ArrowDown') { event.preventDefault(); moveSel(1); }
    else if (event.key === 'k' || event.key === 'ArrowUp') { event.preventDefault(); moveSel(-1); }
    else if (event.key === 'Enter') {
      const p = state.visible?.[state.selIdx];
      if (p?.openUrl) location.href = p.openUrl;
    } else if (event.key === 's' || event.key === 'S') {
      const p = state.visible?.[state.selIdx];
      if (p?.projectPK) { event.preventDefault(); openPopupFor(p); }
    } else if (event.key === 'r' || event.key === 'R') {
      const p = state.visible?.[state.selIdx];
      if (p) { event.preventDefault(); p.revealed = true; renderSecretCell(p); }
    }
  }

  /* ========================================================================
     UI assembly
     ======================================================================== */

  function buildHead() {
    state.els.arrows = {};
    const headCell = (label, opts = {}) => {
      const children = [document.createTextNode(label)];
      if (opts.sortKey) {
        const arrow = el('span', { attrs: { 'aria-hidden': 'true' } });
        state.els.arrows[opts.sortKey] = arrow;
        children.push(arrow);
      }
      const cell = el('div', {
        className: [opts.sortKey ? 'mui-sortable' : '', opts.align ? `mui-align-${opts.align}` : ''].join(' ').trim(),
        children,
      });
      if (opts.sortKey) {
        cell.tabIndex = 0;
        cell.setAttribute('role', 'button');
        const activate = () => sortBy(opts.sortKey);
        cell.addEventListener('click', activate);
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        });
      }
      return cell;
    };
    return el('div', {
      className: 'mui-grid-head',
      children: [
        headCell('Problem', { sortKey: 'name' }),
        headCell('Last submission', { sortKey: 'pub', align: 'right' }),
        headCell('Secret / Release', { align: 'right' }),
        headCell('Tokens', { sortKey: 'tokens', align: 'center' }),
        headCell('Due', { sortKey: 'due', align: 'right' }),
        headCell('Submit', { align: 'right' }),
      ],
    });
  }

  function buildRow(p) {
    const nameLink = el('a', { text: p.name || p.code, attrs: { href: p.openUrl || '#' } });
    p.els.pub = el('div', { className: 'mui-cell-pub' });
    p.els.secret = el('div', { className: 'mui-cell-secret' });
    p.els.tokens = el('div', { className: 'mui-cell-tokens' });
    p.els.due = el('div', { className: 'mui-cell-due' });
    p.els.submit = el('div', { className: 'mui-cell-submit' });
    p.els.row = el('div', {
      className: 'mui-grid-row',
      children: [
        el('div', {
          className: 'mui-cell-name',
          children: [
            p.code ? el('span', { className: 'mui-problem-code', text: p.code }) : null,
            nameLink,
          ],
        }),
        p.els.pub, p.els.secret, p.els.tokens, p.els.due, p.els.submit,
      ],
    });
    // The whole row opens the problem; links/buttons inside keep their own jobs.
    p.els.row.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select, label')) return;
      if (p.openUrl) location.href = p.openUrl;
    });
    return p.els.row;
  }

  function buildUI(courseLabel) {
    const revealBtn = el('button', {
      className: 'mui-ghost-btn', text: 'Hide secret scores', attrs: { type: 'button' },
      on: {
        click: () => {
          state.revealAll = !state.revealAll;
          revealBtn.textContent = state.revealAll ? 'Hide secret scores' : 'Reveal all secret';
          state.problems.forEach(renderSecretCell);
        },
      },
    });
    state.els.revealBtn = revealBtn;

    state.els.list = el('div', { className: 'mui-grid' });
    state.els.list.append(buildHead());
    state.problems.forEach((p) => state.els.list.append(buildRow(p)));

    state.els.statusLine = el('span');

    return el('div', {
      children: [
        el('div', {
          className: 'mui-page-head',
          children: [
            el('div', {
              children: [
                el('div', { className: 'mui-eyebrow', text: [courseLabel, 'Marmoset'].filter(Boolean).join(' · ') }),
                el('h1', { className: 'mui-h1', text: 'Assignments' }),
              ],
            }),
            revealBtn,
          ],
        }),
        el('div', { className: 'mui-table-card', children: [state.els.list] }),
        el('div', {
          className: 'mui-status-line',
          children: [
            state.els.statusLine,
            el('span', { className: 'mui-keys', text: 'j/k move · ↵ open · s submit' }),
          ],
        }),
      ],
    });
  }

  /* ========================================================================
     Entry point
     ======================================================================== */

  /**
   * @param {object} context
   * @param {HTMLTableElement} context.table - Marmoset's legacy problems table
   * @param {string} [context.courseLabel] - e.g. "CS 246", for the eyebrow
   */
  function enhance({ table, courseLabel = '' }) {
    state.problems = extractProblems(table);
    state.courseLabel = courseLabel;
    if (!state.problems.length) {
      log.warn('Problems page: could not extract any rows; leaving the page as-is.');
      return;
    }

    table.replaceWith(buildUI(courseLabel));

    const now = new Date();
    for (const p of state.problems) {
      renderDueCell(p, now);
      renderSubmitCell(p);
      if (p.openUrl) {
        MUI.loaders.loadProblem({
          viewUrl: p.openUrl,
          onStatus: (status) => { p.status = status; renderStatusCell(p); },
          onSecret: (secret) => { p.secret = secret; renderSecretCell(p); },
          onTokens: (tokens) => { p.tokens = tokens; renderTokensCell(p); },
        });
      } else {
        p.status = { kind: 'none' };
        p.secret = { kind: 'none' };
        p.tokens = { kind: 'unknown' };
        renderStatusCell(p);
        renderSecretCell(p);
        renderTokensCell(p);
      }
    }

    applyView();

    document.addEventListener('keydown', onKeydown);
    const timer = setInterval(() => MUI.safe('countdown tick', tick), 1000);
    window.addEventListener('pagehide', () => clearInterval(timer), { once: true });

    MUI.palette?.addItems(() => [
      ...state.problems.map((p) => ({
        label: `Open ${p.code || p.name} · ${p.name}`,
        hint: 'Submissions',
        run: () => { if (p.openUrl) location.href = p.openUrl; },
      })),
      ...state.problems
        .filter((p) => p.projectPK && (!p.due || !MUI.dates.formatCountdown(p.due).closed))
        .map((p) => ({ label: `Submit ${p.code || p.name}`, hint: 'Action', run: () => openPopupFor(p) })),
      {
        label: 'Reveal all secret scores',
        hint: 'Action',
        run: () => {
          state.revealAll = true;
          state.els.revealBtn.textContent = 'Hide secret scores';
          state.problems.forEach(renderSecretCell);
        },
      },
    ]);
  }

  MUI.problems = { enhance, splitProblemName };
})();
