/**
 * MarmoUI — page detection, global chrome (top bar), and per-page enhancers.
 * The problems screen lives in src/problems.js.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { $, $$, el, log } = MUI;
  const C = MUI.constants;
  const { dataRows, makeSortable } = MUI.tables;

  /* ========================================================================
     Page detection
     ======================================================================== */

  const PAGE_PATTERNS = [
    ['COURSES', /\/view\/index\.jsp/],
    ['PROBLEMS', /\/view\/course\.jsp/],
    ['SUBMISSIONS', /\/view\/project\.jsp/],
    ['DETAILS', /\/view\/submission\.jsp/],
    ['SUBMIT', /\/view\/submitProject\.jsp/],
    // Marmoset's post-login redirect leaves a literal URL-encoded "${view}"
    // template artifact in the address; treat it as the auth landing page.
    ['LOGIN', /target-%24%7Bview%7D/],
  ];


  function detectPage(url, doc = document) {
    // Fixture harnesses run these scripts in the page world and set an
    // explicit override; in production the content-script world is isolated,
    // so pages cannot influence this.
    if (typeof globalThis.__MUI_PAGE_OVERRIDE__ === 'string') {
      return globalThis.__MUI_PAGE_OVERRIDE__;
    }
    for (const [page, pattern] of PAGE_PATTERNS) {
      if (pattern.test(url)) return page;
    }
    if (doc.querySelector('table input[type="submit"]')) return 'LOGIN';
    return 'UNKNOWN';
  }

  /* ========================================================================
     Global chrome
     ======================================================================== */

  /** Pull username, breadcrumb links, and the logout href out of Marmoset's own breadcrumb. */
  function extractBreadcrumb() {
    const info = { username: 'User', links: [], logoutHref: `${MUI.basePath()}${C.LOGOUT_PATH}` };
    const container = $('.breadcrumb');
    if (!container) return info;

    const logoutAnchor = container.querySelector(`a[href*="${C.LOGOUT_PATH}"]`);
    if (logoutAnchor) info.logoutHref = logoutAnchor.getAttribute('href');

    const paragraph = [...container.querySelectorAll('p')].find(
      (p) => !p.querySelector(`a[href*="${C.LOGOUT_PATH}"]`),
    );
    if (paragraph) {
      const username = paragraph.textContent.trim().match(/^[^:]+/)?.[0].trim();
      if (username) info.username = username;
      info.links = [...paragraph.querySelectorAll('a')].map((anchor) => ({
        href: anchor.getAttribute('href'),
        title: anchor.getAttribute('title') || anchor.textContent.trim(),
        text: anchor.textContent.trim(),
      }));
    }

    container.remove();
    return info;
  }

  const crumbSep = () => el('span', { className: 'mui-crumb-sep', text: '›', attrs: { 'aria-hidden': 'true' } });

  function buildTopBar(info) {
    // Marmoset's own breadcrumb already ends at the current location — no
    // extra page-name crumb.
    const crumbs = el('nav', {
      className: 'mui-crumbs',
      attrs: { 'aria-label': 'Breadcrumb' },
      children: [el('span', { className: 'mui-crumb-user', text: info.username })],
    });
    for (const link of info.links) {
      crumbs.append(crumbSep(), el('a', { text: link.text, attrs: { href: link.href, title: link.title } }));
    }
    crumbs.append(el('a', { className: 'mui-logout-btn', text: 'Logout', attrs: { href: info.logoutHref } }));

    const seg = el('div', { className: 'mui-seg', attrs: { role: 'group', 'aria-label': 'Theme' } });
    const themeButtons = C.THEMES.map((theme) => {
      const button = el('button', {
        text: theme[0].toUpperCase() + theme.slice(1),
        attrs: { type: 'button', 'aria-pressed': String(MUI.theme.getTheme() === theme) },
        on: {
          click: () => {
            MUI.theme.setTheme(theme);
            for (const b of themeButtons) b.setAttribute('aria-pressed', String(b === button));
          },
        },
      });
      seg.append(button);
      return button;
    });

    // Compact switch to the original MarmoUI 2.0 look.
    const legacyToggle = el('label', {
      className: 'mui-legacy-toggle',
      attrs: { title: 'Switch to the original MarmoUI look' },
      children: [
        el('input', {
          attrs: { type: 'checkbox' },
          on: { change: (event) => { if (event.target.checked) MUI.mode.set('legacy'); } },
        }),
        el('span', { text: 'Legacy' }),
      ],
    });

    return el('div', {
      className: 'mui-topbar',
      children: [
        crumbs,
        el('div', { className: 'mui-topbar-tools', children: [seg, legacyToggle] }),
      ],
    });
  }

  /** Move (not re-parse) all body content into a centred wrapper. */
  function wrapBody() {
    const wrapper = el('div', { className: 'wrapper' });
    wrapper.append(...document.body.childNodes);
    document.body.append(wrapper);
    return wrapper;
  }

  /**
   * Apply the shared chrome and return page context for the enhancers.
   * @returns {{wrapper: Element, crumbs: object, courseLabel: string}}
   */
  function applyGlobalChrome(page) {
    // On fully-reskinned pages, Marmoset's legacy /styles.css only bleeds
    // through (r0/r1 yellow zebra rows, black cell borders, red visited
    // links, highlighted result spans). Unknown pages keep it, since there
    // we only add chrome around the original content. Our own CSS is
    // manifest-injected (not a <link>) in production; the [data-mui] guard
    // protects the fixture harness, which loads it as a link.
    if (page !== 'UNKNOWN') {
      $$('link[rel="stylesheet"]:not([data-mui])').forEach((sheet) => sheet.remove());
    }

    $('.header')?.remove();
    const crumbs = extractBreadcrumb();
    const wrapper = wrapBody();
    document.title = `MarmoUI — ${document.title}`;
    wrapper.prepend(
      el('div', { className: 'mui-wordmark', children: [el('p', { text: 'Marmoset' })] }),
      buildTopBar(crumbs),
    );
    $('.footer')?.remove();

    // Base palette items: navigation, themes, logout.
    MUI.palette.addItems(() => [
      ...crumbs.links.map((link) => ({
        label: `Go to ${link.text}`,
        hint: 'Navigate',
        run: () => { location.href = link.href; },
      })),
      ...C.THEMES.map((theme) => ({
        label: `Theme: ${theme[0].toUpperCase()}${theme.slice(1)}`,
        hint: 'Appearance',
        run: () => MUI.theme.setTheme(theme),
      })),
      { label: 'Logout', hint: 'Session', run: () => { location.href = crumbs.logoutHref; } },
    ]);

    // Crumb roles by target page, not position: on deeper pages the *last*
    // link is the current submission's date, not the course.
    const crumbText = (part) => crumbs.links.find((l) => l.href?.includes(part))?.text ?? '';
    const courseLabel = crumbText('course.jsp') || crumbs.links[0]?.text || '';
    const projectLabel = crumbText('project.jsp');
    return { wrapper, crumbs, courseLabel, projectLabel };
  }

  /* ========================================================================
     Shared helpers
     ======================================================================== */

  function hideHeading(element) {
    element?.classList.add('mui-visually-hidden');
  }

  function pageHead({ eyebrow, title, side }) {
    return el('div', {
      className: 'mui-page-head',
      children: [
        el('div', {
          children: [
            eyebrow ? el('div', { className: 'mui-eyebrow', text: eyebrow }) : null,
            el('h1', { className: 'mui-h1', text: title }),
          ],
        }),
        side ?? null,
      ],
    });
  }

  /** Convert "Marmoset courses from …" paragraphs into archive list items. */
  function buildArchiveSection() {
    const paragraphs = $$('p').filter((p) => p.textContent.includes('Marmoset courses from'));
    if (!paragraphs.length) return null;

    const section = el('div', {
      className: 'mui-archives',
      children: [el('div', { className: 'mui-archives-label', text: 'Archived Marmoset servers' })],
    });
    for (const paragraph of paragraphs) {
      const href = paragraph.querySelector('a')?.getAttribute('href');
      const term =
        paragraph.textContent
          .replace('Marmoset courses from', '')
          .split('http')[0]
          .replace(/[\s:]+$/, '')
          .trim() || 'Archive';
      section.append(el('a', {
        className: 'mui-archive-item',
        attrs: { href: href ?? '#', target: '_blank', rel: 'noopener noreferrer' },
        children: [
          el('span', { className: 'mui-archive-term', text: term }),
          el('span', { className: 'mui-archive-host', text: `${href ?? ''} →` }),
        ],
      }));
      paragraph.remove();
    }
    return section;
  }

  /** Wrap a score-ish text ("48 / 50", "passed", "failed") in a design chip. */
  function scoreChip(text) {
    const value = text.trim();
    const score = value.match(/(\d+)\s*\/\s*(\d+)/);
    if (score) {
      const pass = Number(score[1]) >= Number(score[2]) && Number(score[2]) > 0;
      return el('span', { className: `mui-chip ${pass ? 'mui-chip--pass' : 'mui-chip--fail'}`, text: `${score[1]} / ${score[2]}` });
    }
    const lower = value.toLowerCase();
    if (lower === 'passed') return el('span', { className: 'mui-chip mui-chip--pass', text: value });
    // Marmoset outcomes: "failed" (wrong), "error" (crashed), "could not run",
    // "did not compile" — all red.
    if (/fail|error|could not|not compile/.test(lower)) {
      return el('span', { className: 'mui-chip mui-chip--fail', text: value });
    }
    return null;
  }

  /* ========================================================================
     LOGIN
     ======================================================================== */

  function enhanceLoginPage({ wrapper }) {
    hideHeading($('h1'));
    hideHeading($('h2'));

    // Archive servers open with "Hi <user>, please login as one of the users…"
    // plus a "Back to current term's Marmoset" link — fold both into the UI.
    const intro = $$('p').find((p) => /please login/i.test(p.textContent));
    const username = intro?.textContent.match(/hi\s+([\w.-]+)\s*,/i)?.[1];
    if (username) {
      const userChip = $('.mui-crumb-user');
      if (userChip) userChip.textContent = username;
    }

    const backParagraph = $$('p').find((p) => /back to current term/i.test(p.textContent));
    const backHref = backParagraph?.querySelector('a')?.href ?? null;
    backParagraph?.remove();
    intro?.remove();

    const table = $('table');
    const rows = table ? dataRows(table) : [];
    const authRows = rows
      .map((row) => {
        const submitInput = row.querySelector('input[type="submit"]');
        if (!submitInput) return null;
        const labels = [...row.cells]
          .filter((cell) => !cell.contains(submitInput))
          .map((cell) => cell.textContent.trim())
          .filter(Boolean);
        return { labels, control: submitInput.closest('form') ?? submitInput };
      })
      .filter(Boolean);

    if (!authRows.length) {
      wrapper.classList.add('mui-fallback');
      return;
    }

    // One card per course.
    const cards = authRows.map(({ labels, control }) => {
      const left = el('span', {
        children: [
          el('span', { className: 'mui-auth-course', text: labels[0] ?? 'Course' }),
          labels[1] ? el('span', { className: 'mui-auth-term', text: labels[1] }) : null,
        ],
      });
      const input = control.matches('input') ? control : control.querySelector('input[type="submit"]');
      if (input) {
        input.classList.add('mui-btn');
        input.value = 'Authenticate';
      }
      return el('div', { className: 'mui-card mui-auth-card', children: [left, control] });
    });

    const login = el('div', {
      className: 'mui-login',
      children: [
        el('div', {
          className: 'mui-login-head',
          children: [
            el('div', { className: 'mui-eyebrow', text: 'Marmoset · UW CS' }),
            el('h1', { className: 'mui-h1', text: 'Sign in' }),
          ],
        }),
        ...cards,
        el('div', { className: 'mui-card-note', text: 'Authenticate with your WatIAM credentials' }),
      ],
    });

    table.replaceWith(login);
    if (backHref) {
      login.append(el('a', {
        className: 'mui-archive-item',
        attrs: { href: backHref },
        children: [
          el('span', { className: 'mui-archive-term', text: 'Current term' }),
          el('span', { className: 'mui-archive-host', text: `${backHref} →` }),
        ],
      }));
    }
    const archives = buildArchiveSection();
    if (archives) login.append(archives);
  }

  /* ========================================================================
     COURSES
     ======================================================================== */

  function enhanceCoursesPage({ wrapper }) {
    hideHeading($('h1'));
    hideHeading($('h2'));
    $$('p').find((p) => p.textContent.includes('Welcome'))?.remove();

    // Course links are unambiguous by href — never depend on list structure
    // (some Marmoset variants render one <ul> per course, or plain <p>s).
    const seen = new Set();
    const links = $$('a[href*="course.jsp?coursePK="]').filter((a) => {
      if (seen.has(a.href)) return false;
      seen.add(a.href);
      return true;
    });

    if (links.length) {
      const grid = el('div', { className: 'mui-courses' });
      for (const link of links) {
        const text = (link.getAttribute('title') || link.textContent).replace(/overview of/i, '').trim().replace(/:$/, '');
        const label = link.textContent.trim().replace(/:$/, '');
        const [, code, name] = label.match(/^([A-Za-z]{2,10}\s?\d+\w*)\s*[:·-]?\s*(.*)$/) ?? [null, label || text, ''];
        grid.append(el('a', {
          className: 'mui-course-card',
          attrs: { href: link.href },
          children: [
            el('div', {
              className: 'mui-course-top',
              children: [
                el('span', { className: 'mui-course-code', text: code }),
                el('span', { className: 'mui-course-open', text: 'Open →' }),
              ],
            }),
            name ? el('span', { className: 'mui-course-name', text: name }) : null,
          ],
        }));
      }

      const section = el('div', {
        children: [pageHead({ eyebrow: 'Marmoset', title: 'Your courses' }), grid],
      });
      // Replace whatever container held the first course link; drop the rest.
      const hosts = links.map((link) => link.closest('li, p, ul, h3') ?? link);
      hosts[0].before(section);
      hosts.forEach((host) => host.remove());
      // Empty leftover lists disappear too.
      $$('ul').filter((ul) => !ul.textContent.trim()).forEach((ul) => ul.remove());
    } else {
      wrapper.classList.add('mui-fallback');
    }

    const archives = buildArchiveSection();
    if (archives) (wrapper ?? document.body).append(archives);
  }

  /* ========================================================================
     PROBLEMS (delegates to src/problems.js)
     ======================================================================== */

  function enhanceProblemsPage(context) {
    hideHeading($('h1'));
    hideHeading($('h2'));
    // Real course.jsp opens with a bare "Welcome <name>" paragraph.
    $$('p').find((p) => /^\s*welcome\b/i.test(p.textContent))?.remove();
    const table = $('table');
    if (!table) {
      log.warn('Problems page: no table found.');
      return;
    }
    MUI.problems.enhance({ table, courseLabel: context.courseLabel });
  }

  /* ========================================================================
     SUBMISSIONS
     ======================================================================== */

  function enhanceSubmissionsPage(context) {
    // Prefer the breadcrumb's project name ("t10") over the legacy h1
    // ("Project t10: t10").
    const title = context.projectLabel || $('h1')?.textContent.trim() || 'Submissions';
    hideHeading($('h1'));
    $$('h2').forEach(hideHeading);

    const table = $('table');
    if (!table) return;

    // "Submit new" — reuse the page's own submit link if present.
    const submitAnchor = $('a[href*="submitProject.jsp"]');
    let side = null;
    if (submitAnchor) {
      const projectPK = new URL(submitAnchor.href).searchParams.get('projectPK');
      const heading = submitAnchor.closest('h1, h2, h3, h4, p');
      side = el('button', {
        className: 'mui-btn mui-btn--md',
        text: 'Submit new',
        attrs: { type: 'button' },
        on: {
          click: () => MUI.submit.openSubmissionPopup({
            projectPK,
            projectName: title,
            eyebrow: context.courseLabel,
            viewUrl: location.href,
          }),
        },
      });
      submitAnchor.remove();
      if (heading && !heading.textContent.trim()) heading.remove();
    }

    table.before(pageHead({ eyebrow: context.courseLabel || 'Marmoset', title, side }));
    table.classList.add('mui-subs');

    // Chip every score column ("public tests score", "release tests score" …)
    // by header, never by fixed position.
    const headerRow = [...table.querySelectorAll('tr')].find((tr) => tr.querySelector('th'));
    const scoreColumns = headerRow
      ? [...headerRow.cells]
          .map((th, i) => (/score/i.test(th.textContent) ? i : -1))
          .filter((i) => i >= 0)
      : [2];

    const rows = dataRows(table);
    rows.forEach((row, index) => {
      MUI.safe('enhance submission row', () => {
        for (const i of scoreColumns) {
          const cell = row.cells[i];
          const chipEl = cell ? scoreChip(cell.textContent) : null;
          if (chipEl) cell.replaceChildren(chipEl);
        }
        if (index === 0 && row.cells[1]) {
          row.cells[1].append(el('span', { className: 'mui-chip--latest', text: 'latest' }));
        }
        for (const anchor of row.querySelectorAll('a')) {
          if (anchor.textContent.trim().toLowerCase() === 'view') anchor.textContent = 'View →';
        }
      });
    });

    // Whole row opens the submission's detail page.
    table.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select, label')) return;
      const row = event.target.closest('tr');
      const detail = row?.querySelector('a[href*="submission.jsp?"]');
      if (detail) location.href = detail.href;
    });

    makeSortable(table);
  }

  /* ========================================================================
     DETAILS
     ======================================================================== */

  /**
   * Column mapping for Marmoset's results table, driven by its header row:
   * `type | test # | outcome | points | name | short result | long result`.
   * Never trust fixed positions beyond the fallbacks.
   */
  function mapResultColumns(table) {
    const idx = { type: 0, number: 1, outcome: 2, points: 3, name: -1, longResult: -1, shortResult: -1 };
    const headerRow = [...table.querySelectorAll('tr')].find((tr) => tr.querySelector('th'));
    if (headerRow) {
      [...headerRow.cells].forEach((th, i) => {
        const label = th.textContent.trim().toLowerCase();
        if (label === 'type') idx.type = i;
        else if (label.startsWith('test #') || label === '#') idx.number = i;
        else if (label.startsWith('outcome')) idx.outcome = i;
        else if (label.startsWith('point')) idx.points = i;
        else if (label === 'name' || label === 'test name') idx.name = i;
        else if (label.includes('long result')) idx.longResult = i;
        else if (label.includes('short result')) idx.shortResult = i;
      });
    }
    return idx;
  }

  /** Apply the design skin to one results table's rows: chips + column typography. */
  function applyResultRowStyles(table, idx) {
    for (const row of dataRows(table)) {
      MUI.safe('reskin result row', () => {
        const outcomeCell = idx.outcome >= 0 ? row.cells[idx.outcome] : null;
        if (outcomeCell) {
          const chip = scoreChip(outcomeCell.textContent);
          if (chip) outcomeCell.replaceChildren(chip);
        }
        for (const i of [idx.type, idx.number, idx.name]) {
          row.cells[i]?.classList.add('mui-td-mono');
        }
        row.cells[idx.points]?.classList.add('mui-td-points');
        for (const i of [idx.shortResult, idx.longResult]) {
          row.cells[i]?.classList.add('mui-td-result');
        }
      });
    }
  }

  /** "12 / 20 points" summary computed from a group's raw rows. */
  function groupSummary(rows, idx) {
    let earned = 0;
    let possible = 0;
    let sawNumeric = false;
    for (const row of rows) {
      const points = Number.parseInt(row.cells[idx.points]?.textContent.trim() ?? '', 10);
      if (Number.isNaN(points)) continue;
      sawNumeric = true;
      possible += points;
      if ((row.cells[idx.outcome]?.textContent ?? '').toLowerCase().includes('passed')) earned += points;
    }
    return sawNumeric && possible > 0 ? `${earned} / ${possible} points` : `${rows.length} tests`;
  }

  /**
   * Split the legacy results table into one design-skinned table per test
   * type (public / secret & private / release / other). Every table keeps
   * ALL of Marmoset's columns — rows are MOVED, never rebuilt, so no data
   * can be lost in translation.
   */
  function splitResultsTable(table) {
    const idx = mapResultColumns(table);
    const headerRow = [...table.querySelectorAll('tr')].find((tr) => tr.querySelector('th'));
    const rows = dataRows(table);
    if (!headerRow || !rows.length) return null;
    const rowType = (row) => (idx.type >= 0 ? (row.cells[idx.type]?.textContent.trim().toLowerCase() ?? '') : '');
    const groups = [
      ['Public tests', rows.filter((r) => /public/.test(rowType(r)))],
      ['Secret & private tests', rows.filter((r) => /secret|private/.test(rowType(r)) && !/public/.test(rowType(r)))],
      ['Release tests', rows.filter((r) => /release/.test(rowType(r)))],
    ];
    const grouped = new Set(groups.flatMap(([, groupRows]) => groupRows));
    const leftovers = rows.filter((r) => !grouped.has(r));
    if (leftovers.length) groups.push(['Other tests', leftovers]);

    const container = el('div');
    for (const [title, groupRows] of groups) {
      if (!groupRows.length) continue;
      const summary = groupSummary(groupRows, idx);

      const groupTable = el('table', { className: 'mui-results-table' });
      const tbody = el('tbody');
      tbody.append(headerRow.cloneNode(true));
      groupRows.forEach((row) => tbody.append(row));
      groupTable.append(tbody);
      applyResultRowStyles(groupTable, idx);
      makeSortable(groupTable);

      container.append(el('div', {
        className: 'mui-group',
        children: [
          el('div', {
            className: 'mui-group-head',
            children: [
              el('h3', { text: title }),
              el('span', { className: 'mui-group-summary', text: summary }),
            ],
          }),
          el('div', { className: 'mui-table-card', children: [groupTable] }),
        ],
      }));
    }

    table.replaceWith(container);
    return container;
  }

  function enhanceDetailsPage(context) {
    // ---- Extract facts from the legacy markup before hiding it ----
    // Real page: h1 "Project t10: t10", h2 "Rishi Ahuja : r24ahuja",
    // h2 "Submission #1, submitted at Wed, 01 Apr at 07:44 PM", h2 "Test Results",
    // h3 "Note: … failed means wrong …", p "Deadline: …", trailing tech <p>.
    const submissionH2 = $$('h2').find((h) => /submission\s*#\d+/i.test(h.textContent));
    const submissionLabel = submissionH2?.textContent.match(/submission\s*#\d+/i)?.[0] ?? 'Submission';
    const submittedAt = submissionH2?.textContent.match(/submitted at\s+(.+)$/i)?.[1]?.trim() ?? '';

    const deadlineP = $$('p').find((p) => /deadline:/i.test(p.textContent));
    const deadlineText = deadlineP?.textContent.replace(/[\s\S]*deadline:\s*/i, '').trim() ?? '';
    deadlineP?.remove();

    const toSubmitP = $$('p').find((p) => /^\s*to submit:/i.test(p.textContent));
    const toSubmitText = toSubmitP?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    toSubmitP?.remove();

    hideHeading($('h1'));
    $$('h2').forEach(hideHeading);
    // Boilerplate outcome-glossary note; the chips make it redundant.
    $$('h3')
      .filter((h) => /failed[\s\S]*means[\s\S]*error[\s\S]*means/i.test(h.textContent))
      .forEach(hideHeading);

    // "You received X/Y points for …" paragraphs. On release-test courses the
    // table can be completely empty and this prose is the ONLY score data —
    // capture the values; sections render below for whatever the table lacks.
    let releasePointsText = null;
    let publicPointsText = null;
    for (const p of $$('p')) {
      const text = p.textContent.replace(/\s+/g, ' ').trim();
      if (!/points for/i.test(text)) continue;
      const release = text.match(/you received\s*([\d\s]*\/[\d\s]*\d)\s*points for release tests/i);
      const pub = text.match(/you received\s*([\d\s]*\/[\d\s]*\d)\s*points for public test/i);
      if (release) {
        releasePointsText = release[1].replace(/\s+/g, ' ').trim();
        p.remove();
      } else if (pub) {
        publicPointsText = pub[1].replace(/\s+/g, ' ').trim();
        p.remove();
      } else {
        p.classList.add('mui-tech-note');
      }
    }

    // Trailing "submissionPk = …, testRun #…" paragraph → quiet footnote.
    $$('p')
      .filter((p) => /submissionpk\s*=|testrun/i.test(p.textContent))
      .forEach((p) => p.classList.add('mui-tech-note'));

    const resultsTable = $('.testResults') ?? $('table');
    const now = new Date();

    // Header: "CS246 · t10 · Submission #1" + submitted/deadline meta.
    const eyebrow =
      [context.courseLabel, context.projectLabel, submissionLabel].filter(Boolean).join(' · ') || 'Marmoset';
    const metaLines = [];
    if (submittedAt) metaLines.push(`Submitted ${submittedAt}`);
    if (deadlineText) metaLines.push(`Deadline ${deadlineText}`);
    if (toSubmitText) metaLines.push(toSubmitText);
    const side = metaLines.length
      ? el('div', { className: 'mui-head-meta', children: metaLines.map((line) => el('div', { text: line })) })
      : null;

    const anchorNode = resultsTable ?? $('pre') ?? null;
    const headEl = pageHead({ eyebrow, title: 'Test results', side });
    if (anchorNode) anchorNode.before(headEl);
    else context.wrapper.append(headEl);

    // Results: one design-skinned table per test type, all columns intact.
    let groupsContainer = null;
    if (resultsTable) {
      const hadDataRows = dataRows(resultsTable).length > 0;
      groupsContainer = MUI.safe('split results table', () => splitResultsTable(resultsTable)) ?? null;
      if (!groupsContainer) {
        // A headers-only husk (some release courses render zero rows) is pure
        // noise — drop it. A table with rows we failed to parse still carries
        // data — keep it, lightly styled.
        if (hadDataRows) resultsTable.parentElement?.classList.add('mui-fallback');
        else resultsTable.remove();
      }
    }

    // Prose-only scores ("You received X/Y points for …"): render a section
    // for anything the table didn't already cover.
    const hasGroup = (title) =>
      !!groupsContainer &&
      [...groupsContainer.querySelectorAll('.mui-group-head h3')].some((h) => h.textContent === title);
    const proseSections = [];
    if (publicPointsText && !hasGroup('Public tests')) proseSections.push(['Public tests', publicPointsText]);
    if (releasePointsText && !hasGroup('Release tests')) proseSections.push(['Release tests', releasePointsText]);

    let proseAnchor = headEl;
    for (const [title, points] of proseSections) {
      const section = el('div', {
        className: 'mui-group',
        children: [el('div', {
          className: 'mui-group-head',
          children: [
            el('h3', { text: title }),
            el('span', { className: 'mui-group-summary', text: `${points} points` }),
          ],
        })],
      });
      if (groupsContainer) {
        groupsContainer.append(section);
      } else {
        proseAnchor.after(section);
        proseAnchor = section;
      }
    }

    const tokens = MUI.loaders.parseTokens(document, now);
    // The raw "You currently have N release tokens" paragraph is folded into
    // the tokens card below (parse first, then drop the paragraph).
    $$('p')
      .filter((p) => /you currently have \d+ release/i.test(p.textContent))
      .forEach((p) => p.remove());

    // Build output → terminal. The results tables have their own little
    // long_test_results_pre elements in every row — never touch those.
    const pre = $$('pre').find(
      (p) =>
        !p.closest('.testResults, .mui-results-table') &&
        !p.className.includes('long_test_results'),
    );
    if (pre) {
      pre.classList.add('mui-terminal');
      const group = el('div', {
        className: 'mui-group',
        children: [el('div', {
          className: 'mui-group-head',
          children: [el('h3', { text: 'Build output' })],
        })],
      });
      pre.before(group);
      group.append(pre);
    }

    // Release-test + token renewal side cards
    const sideCards = el('div', { className: 'mui-side-cards' });

    const releaseHeading = $('h3:has(a[href*="submissionPK="])');
    const releaseLink = releaseHeading?.querySelector('a');
    const submissionPK = releaseLink ? new URL(releaseLink.href).searchParams.get('submissionPK') : null;
    if (releaseHeading && submissionPK) {
      const form = el('form', {
        attrs: { method: 'POST', action: `${MUI.basePath()}${C.RELEASE_TEST_ACTION}` },
        children: [
          el('input', { attrs: { type: 'hidden', name: 'submissionPK', value: submissionPK } }),
          el('button', { className: 'mui-btn mui-btn--md', text: 'Release test', attrs: { type: 'submit' } }),
        ],
      });
      form.addEventListener('submit', (event) => {
        if (!confirm('Release-test this submission? This will spend a release token.')) {
          event.preventDefault();
        }
      });
      const body = tokens.kind === 'count'
        ? `Spend one release token to reveal your score on hidden tests. You have ${tokens.count} token${tokens.count === 1 ? '' : 's'}.`
        : 'Spend one release token to reveal your score on hidden tests.';
      sideCards.append(el('div', {
        className: 'mui-side-card',
        children: [
          el('div', { className: 'mui-side-title', text: 'Release a secret test' }),
          el('div', { className: 'mui-side-body', text: body }),
          form,
        ],
      }));
      releaseHeading.remove();
    }

    // Tokens card: count (when known) + upcoming renewal times (when listed).
    const list = $('ul');
    const renewals = list
      ? [...list.querySelectorAll('li')]
          .map((li) => ({ text: li.textContent.replace(/\s+/g, ' ').trim(), when: MUI.dates.parseMarmosetDate(li.textContent, { now }) }))
          .filter((r) => r.when)
      : [];
    if (tokens.kind === 'count' || renewals.length) {
      const card = el('div', {
        className: 'mui-side-card',
        children: [el('div', { className: 'mui-side-title', text: 'Release tokens' })],
      });
      if (tokens.kind === 'count') {
        card.append(el('div', {
          className: 'mui-side-body',
          text: `${tokens.count} token${tokens.count === 1 ? '' : 's'} available.`,
        }));
      }
      for (const r of renewals) {
        card.append(el('div', {
          className: 'mui-renewal-row',
          children: [
            el('span', { className: 'mui-renewal-when', text: r.text }),
            el('span', {
              className: 'mui-renewal-in',
              text: r.when > now ? `in ${MUI.dates.formatDuration(r.when - now)}` : 'passed',
            }),
          ],
        }));
      }
      sideCards.append(card);
      if (renewals.length) list.remove();
    }

    if (sideCards.childElementCount) context.wrapper.append(sideCards);
  }

  /* ========================================================================
     SUBMIT (classic full-page form)
     ======================================================================== */

  function enhanceSubmitPage(context) {
    const formTable = $('table.form');
    const originalForm =
      formTable?.closest('form') ?? $(`form[action*="${C.SUBMIT_ACTION}"]`) ?? $('form input[type="file"]')?.closest('form');

    const projectPK =
      new URL(location.href).searchParams.get('projectPK') ??
      originalForm?.querySelector('input[name="projectPK"]')?.value;
    if (!projectPK) {
      log.warn('Submit page: projectPK not found; leaving the original form untouched.');
      return;
    }

    const extraFields = {};
    for (const input of (originalForm ?? document).querySelectorAll('input[type="hidden"]')) {
      if (input.name && !['projectPK', 'submitClientTool'].includes(input.name)) {
        extraFields[input.name] = input.value;
      }
    }

    const title = $('h1')?.textContent.trim() ?? '';
    hideHeading($('h1'));

    const page = el('div', {
      className: 'mui-submit-page',
      children: [
        el('div', {
          className: 'mui-submit-head',
          children: [
            el('div', { className: 'mui-eyebrow', text: [context.courseLabel, title].filter(Boolean).join(' · ') || 'Marmoset' }),
            el('h1', { className: 'mui-h1', text: 'Submit solution' }),
          ],
        }),
        el('div', { className: 'mui-card', children: [MUI.submit.buildSubmitForm({ projectPK, extraFields })] }),
        el('div', {
          className: 'mui-card-note',
          text: 'Uploads are queued and tested automatically · results appear on the submissions page',
        }),
      ],
    });

    const target = originalForm ?? formTable;
    if (target) target.replaceWith(page);
    else context.wrapper.append(page);
  }

  /* ========================================================================
     Dispatch
     ======================================================================== */

  const ENHANCERS = {
    LOGIN: enhanceLoginPage,
    COURSES: enhanceCoursesPage,
    PROBLEMS: enhanceProblemsPage,
    SUBMISSIONS: enhanceSubmissionsPage,
    DETAILS: enhanceDetailsPage,
    SUBMIT: enhanceSubmitPage,
    UNKNOWN: ({ wrapper }) => wrapper.classList.add('mui-fallback'),
  };

  function enhance(page, context) {
    (ENHANCERS[page] ?? ENHANCERS.UNKNOWN)(context);
  }

  MUI.pages = { detectPage, applyGlobalChrome, enhance };
})();
