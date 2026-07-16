/**
 * MarmoUI — LEGACY mode: the original MarmoUI 2.0 look (legacy/legacy-css.js,
 * verbatim from GitHub) running on the fixed engine. Every functional bug of
 * the original is fixed here — fetch-based submission (no hidden iframe, no
 * auto-submit), header-mapped parsing, real year/timezone handling, honest
 * unknowns instead of a fabricated "3" — while the DOM/classes match what the
 * OG stylesheet expects: kept tables, .mui-header, .mui-breadcrumb,
 * .mui-button, td.passed/td.failed, .due-date-wrapper, .mui-popup, …
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { $, $$, el, log } = MUI;
  const C = MUI.constants;

  /* ========================================================================
     Theme (OG used body classes; fixed: toggle known classes, never wipe)
     ======================================================================== */

  function getTheme() {
    try {
      const saved = localStorage.getItem(C.THEME_STORAGE_KEY);
      return C.THEMES.includes(saved) ? saved : C.DEFAULT_THEME;
    } catch {
      return C.DEFAULT_THEME;
    }
  }

  function setTheme(theme) {
    if (!C.THEMES.includes(theme)) return;
    for (const candidate of C.THEMES) {
      document.body.classList.toggle(candidate, candidate === theme);
    }
    try {
      localStorage.setItem(C.THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable — theme still applies for this page view.
    }
  }

  /* ========================================================================
     Shared helpers
     ======================================================================== */

  const SCORE_RE = /(\d+)\s*\/\s*(\d+)/;

  /** OG tint classes on table cells: td.passed / td.failed. */
  function tintCell(cell, text) {
    const value = text.trim().toLowerCase();
    const score = value.match(SCORE_RE);
    cell.classList.remove('passed', 'failed');
    if (value === 'passed' || (score && Number(score[2]) > 0 && Number(score[1]) >= Number(score[2]))) {
      cell.classList.add('passed');
    } else if (/fail|error|could not|not compile/.test(value) || (score && Number(score[1]) < Number(score[2]))) {
      cell.classList.add('failed');
    }
  }

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
        text: anchor.textContent.trim(),
        title: anchor.getAttribute('title') || anchor.textContent.trim(),
      }));
    }
    container.remove();
    return info;
  }

  /* ========================================================================
     Global chrome (OG structure)
     ======================================================================== */

  function applyChrome() {
    document.head.append(el('style', { text: MUI.legacyCss }));
    $('.header')?.remove();
    const crumbs = extractBreadcrumb();

    const wrapper = el('div', { className: 'wrapper' });
    wrapper.append(...document.body.childNodes);
    document.body.append(wrapper);
    document.title = `MarmoUI 2.0 - ${document.title}`;

    // Breadcrumb path: "user >>" then links (OG look).
    const path = el('p');
    path.append(el('b', { text: `${crumbs.username} »` }));
    crumbs.links.forEach((link, index) => {
      if (index > 0) path.append(el('span', { className: 'separator', text: '»' }));
      path.append(document.createTextNode(' '));
      path.append(el('a', { text: link.text, attrs: { href: link.href, title: link.title } }));
      path.append(document.createTextNode(' '));
    });

    const themeSelect = el('select', {
      on: { change: (event) => setTheme(event.target.value) },
    });
    for (const theme of C.THEMES) {
      themeSelect.append(el('option', {
        text: `${theme[0].toUpperCase()}${theme.slice(1)} Theme`,
        attrs: { value: theme },
      }));
    }
    themeSelect.value = getTheme();

    const legacyToggle = el('label', {
      className: 'mui-legacy-toggle',
      attrs: { title: 'Switch back to the new MarmoUI look' },
      children: [
        el('input', {
          attrs: { type: 'checkbox', checked: '' },
          on: { change: (event) => { if (!event.target.checked) MUI.mode.set('new'); } },
        }),
        el('span', { text: 'Legacy' }),
      ],
    });

    wrapper.prepend(
      el('div', { className: 'mui-header', children: [el('p', { text: 'Marmoset' })] }),
      el('div', {
        className: 'mui-breadcrumb',
        children: [
          el('div', {
            className: 'left',
            children: [
              path,
              el('div', { className: 'logout', children: [el('a', { text: 'Logout', attrs: { href: crumbs.logoutHref } })] }),
            ],
          }),
          el('div', { className: 'theme-selector', children: [themeSelect, document.createTextNode(' '), legacyToggle] }),
        ],
      }),
    );

    const footer = $('.footer');
    if (footer) footer.textContent = 'MarmoUI 2.0 - Built for UW CS. Derived from MarmoUI 1.0 by Shida Li and Erica Xu.';

    setTheme(getTheme());
    return crumbs;
  }

  /* ========================================================================
     Submission popup (OG look, fixed flow)
     ======================================================================== */

  let activePopup = null;

  function closePopup() {
    if (!activePopup) return;
    const { overlay, popup, keyHandler } = activePopup;
    activePopup = null;
    document.removeEventListener('keydown', keyHandler);
    overlay.remove();
    popup.remove();
  }

  function openPopup({ projectPK, projectName, dueDateText, viewUrl }) {
    closePopup();
    const overlay = el('div', { className: 'mui-overlay', on: { click: closePopup } });

    const fileInput = el('input', { attrs: { type: 'file', name: 'file' } });
    const submitButton = el('button', { className: 'mui-button', text: 'Submit', attrs: { type: 'submit' } });
    const errorBox = el('p', { attrs: { role: 'alert', hidden: '', style: 'color:#d9534f;font-weight:bold' } });
    const form = el('form', { children: [fileInput, document.createTextNode(' '), submitButton, errorBox] });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const file = fileInput.files?.[0];
      if (!file || file.size === 0) {
        errorBox.textContent = file ? 'That file is empty.' : 'Choose a file first.';
        errorBox.hidden = false;
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting…';
      const result = await MUI.submit.submitProject({ projectPK, file });
      if (result.ok) {
        MUI.submit.showToast('Submitted ✓ — refreshing…', 'success');
        closePopup();
        setTimeout(() => location.reload(), C.RELOAD_AFTER_SUBMIT_MS);
      } else {
        errorBox.textContent = result.message;
        errorBox.hidden = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    });

    const children = [
      el('button', {
        className: 'mui-popup-close',
        text: '×',
        attrs: { type: 'button', 'aria-label': 'Close', style: 'position:absolute;top:8px;right:10px;border:none;background:none;font-size:20px;cursor:pointer;color:inherit' },
        on: { click: closePopup },
      }),
      el('h2', { text: projectName }),
    ];
    if (dueDateText) children.push(el('p', { text: `Due: ${dueDateText}` }));
    if (viewUrl) {
      children.push(el('p', { children: [el('a', { className: 'mui-button', text: 'View Submissions', attrs: { href: viewUrl } })] }));
    }
    children.push(form);

    const popup = el('div', {
      className: 'mui-popup',
      attrs: { role: 'dialog', 'aria-modal': 'true' },
      children,
    });

    const keyHandler = (event) => {
      if (event.key === 'Escape') closePopup();
    };
    document.addEventListener('keydown', keyHandler);
    document.body.append(overlay, popup);
    fileInput.focus();
  }

  function bindSubmitLink(row, dueDateText) {
    const anchor = row.querySelector('a[href*="submitProject.jsp"]');
    if (!anchor) return;
    const projectPK = new URL(anchor.href).searchParams.get('projectPK');
    if (!projectPK) return;
    const projectName = row.cells[0]?.textContent.trim() ?? '';
    const viewUrl = row.querySelector('a[href*="project.jsp?"]')?.href ?? '';
    const button = el('a', {
      className: 'mui-button',
      text: 'Submit',
      attrs: { href: anchor.href },
      on: {
        click: (event) => {
          event.preventDefault();
          openPopup({ projectPK, projectName, dueDateText, viewUrl });
        },
      },
    });
    anchor.replaceWith(button);
  }

  /* ========================================================================
     Problems page (OG: keep the table, insert three columns)
     ======================================================================== */

  function enhanceProblems() {
    $('h1')?.remove();
    $('h2')?.remove();
    $$('p').find((p) => /^\s*welcome\b/i.test(p.textContent))?.remove();

    const table = $('table');
    if (!table) return;
    const headerRow = table.querySelector('tr');
    if (!headerRow || headerRow.cells.length < 2) return;

    const webHeader = [...headerRow.cells].find((th) => /web/i.test(th.textContent));
    if (webHeader) webHeader.textContent = 'Submit Solution';

    const anchorHeader = headerRow.cells[1];
    anchorHeader.insertAdjacentElement('afterend', el('th', { text: 'Tokens' }));
    anchorHeader.insertAdjacentElement('afterend', el('th', { text: 'Secret/Release Scores' }));
    anchorHeader.insertAdjacentElement('afterend', el('th', { text: 'Last Submission' }));

    const dueIndex = [...headerRow.cells].findIndex((th) => /due/i.test(th.textContent));
    const now = new Date();

    for (const row of [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td'))) {
      MUI.safe('legacy problems row', () => {
        if (row.cells.length < 2) return;
        const statusCell = el('td', { className: 'status' });
        const secretCell = el('td', { className: 'secret-scores' });
        const tokensCell = el('td', { className: 'tokens' });
        const anchorCell = row.cells[1];
        anchorCell.insertAdjacentElement('afterend', tokensCell);
        anchorCell.insertAdjacentElement('afterend', secretCell);
        anchorCell.insertAdjacentElement('afterend', statusCell);

        const setLink = (cell, url, text, tint) => {
          cell.classList.remove('loading');
          cell.replaceChildren(el('a', { text, attrs: { href: url } }));
          if (tint) tintCell(cell, text);
        };
        const setText = (cell, text) => {
          cell.classList.remove('loading');
          cell.textContent = text;
        };

        const viewUrl = row.querySelector('a[href*="project.jsp?"]')?.href;
        if (viewUrl) {
          [statusCell, secretCell, tokensCell].forEach((cell) => cell.classList.add('loading'));
          MUI.loaders.loadProblem({
            viewUrl,
            onStatus: (s) => {
              if (s.kind === 'none') setText(statusCell, 'No submission');
              else if (s.kind === 'pending') setLink(statusCell, s.url, 'Not tested yet');
              else if (s.kind === 'compileError') { setLink(statusCell, s.url, 'Compilation failed'); statusCell.classList.add('failed'); }
              else if (s.kind === 'score') setLink(statusCell, s.url, `${s.earned} / ${s.possible}`, true);
              else if (s.kind === 'text') setLink(statusCell, s.url, s.text);
              else setText(statusCell, 'Failed to load');
            },
            onSecret: (s) => {
              if (s.kind === 'score') setLink(secretCell, s.url, `${s.earned} / ${s.possible}`, true);
              else setText(secretCell, 'N/A');
            },
            onTokens: (t) => {
              if (t.kind !== 'count') { setText(tokensCell, '—'); return; }
              let label = String(t.count);
              if (t.next && t.next > now) label += ` (renew in ${MUI.dates.formatDuration(t.next - now)})`;
              setText(tokensCell, label);
            },
          });
        } else {
          setText(statusCell, '—');
          setText(secretCell, '—');
          setText(tokensCell, '—');
        }

        const dueCell = dueIndex >= 0 ? row.cells[dueIndex] : null;
        const dueText = dueCell?.textContent.trim() ?? '';
        bindSubmitLink(row, dueText);

        if (dueCell && dueText) {
          const due = MUI.dates.parseMarmosetDate(dueText, { now });
          if (due) {
            const cd = MUI.dates.formatCountdown(due, now);
            if (!cd.closed) {
              dueCell.classList.toggle('due-red', cd.urgent);
              dueCell.replaceChildren(el('div', {
                className: 'due-date-wrapper',
                children: [
                  el('span', { className: 'due-date', text: dueText }),
                  el('span', { className: `due-in${cd.urgent ? ' urgent' : ''}`, text: `Due in ${cd.text}` }),
                ],
              }));
            }
          }
        }
      });
    }

    MUI.tables.makeSortable(table);
    MUI.tables.makeHighlightable(table);
  }

  /* ========================================================================
     Other pages (OG treatments, fixed logic)
     ======================================================================== */

  function enhanceLogin() {
    const table = $('table');
    if (table) {
      table.classList.add('auth-table');
      for (const row of [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td'))) {
        const button = row.querySelector('input[type="submit"]');
        if (button) {
          button.classList.add('mui-button');
          button.value = 'Authenticate';
        }
      }
    }
    buildArchiveTable();
  }

  function buildArchiveTable() {
    const paragraphs = $$('p').filter((p) => p.textContent.includes('Marmoset courses from'));
    if (!paragraphs.length) return;
    const tbody = el('tbody');
    for (const paragraph of paragraphs) {
      const href = paragraph.querySelector('a')?.getAttribute('href');
      const label = paragraph.textContent.replace('Marmoset courses from', '').split('http')[0].replace(/[\s:]+$/, '').trim() || 'Archive';
      const linkCell = el('td');
      if (href) linkCell.append(el('a', { text: href, attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }));
      tbody.append(el('tr', { children: [el('td', { text: label }), linkCell] }));
      paragraph.remove();
    }
    const table = el('table', {
      className: 'archive-table',
      children: [
        el('thead', { children: [el('tr', { children: [el('th', { text: 'Archive' }), el('th', { text: 'Link' })] })] }),
        tbody,
      ],
    });
    ($('.wrapper') ?? document.body).append(table);
  }

  function enhanceCourses() {
    $('h2')?.remove();
    $$('p').find((p) => p.textContent.includes('Welcome'))?.remove();
    const list = $('ul');
    if (list) {
      list.classList.add('mui-list');
      for (const item of list.querySelectorAll('li')) {
        const link = item.querySelector('a');
        if (!link) continue;
        const text = link.textContent.replace(':', '').trim();
        item.replaceChildren(el('a', { className: 'mui-button', text, attrs: { href: link.href } }));
      }
    }
    buildArchiveTable();
  }

  function enhanceSubmissions() {
    $('h1')?.remove();
    $$('h2').forEach((h) => h.remove());
    const table = $('table');
    if (!table) return;

    const headerRow = [...table.querySelectorAll('tr')].find((tr) => tr.querySelector('th'));
    const scoreColumns = headerRow
      ? [...headerRow.cells].map((th, i) => (/score/i.test(th.textContent) ? i : -1)).filter((i) => i >= 0)
      : [2];

    for (const row of [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td'))) {
      MUI.safe('legacy submissions row', () => {
        for (const i of scoreColumns) {
          const cell = row.cells[i];
          if (cell) tintCell(cell, cell.textContent);
        }
        bindSubmitLink(row, '');
      });
    }

    MUI.tables.makeSortable(table);
    MUI.tables.makeHighlightable(table);
  }

  function enhanceDetails() {
    $('h1')?.remove();
    $$('h2').forEach((h) => h.remove());

    const resultsTable = $('.testResults') ?? $('table');
    if (resultsTable) {
      for (const row of [...resultsTable.querySelectorAll('tr')].filter((tr) => tr.querySelector('td'))) {
        const outcomeCell = row.cells[2];
        if (outcomeCell) tintCell(outcomeCell, outcomeCell.textContent);
      }
      MUI.tables.makeSortable(resultsTable);
      MUI.tables.makeHighlightable(resultsTable);
    }

    const pre = $$('pre').find(
      (p) => !p.closest('.testResults') && !p.className.includes('long_test_results'),
    );
    if (pre) {
      const shell = el('div', { className: 'build-output' });
      pre.replaceWith(shell);
      shell.append(pre);
    }

    for (const paragraph of $$('p').filter((p) => p.textContent.includes('points for'))) {
      const heading = el('h3', { attrs: { style: 'color: var(--accent); font-weight: bold;' } });
      heading.append(...paragraph.childNodes);
      paragraph.replaceWith(heading);
    }

    const releaseHeading = $('h3:has(a[href*="submissionPK="])');
    const releaseLink = releaseHeading?.querySelector('a');
    const submissionPK = releaseLink ? new URL(releaseLink.href).searchParams.get('submissionPK') : null;
    if (releaseHeading && submissionPK) {
      const form = el('form', {
        attrs: { method: 'POST', action: `${MUI.basePath()}${C.RELEASE_TEST_ACTION}` },
        children: [
          el('input', { attrs: { type: 'hidden', name: 'submissionPK', value: submissionPK } }),
          el('button', { className: 'mui-button', text: 'Release Test', attrs: { type: 'submit' } }),
        ],
      });
      form.addEventListener('submit', (event) => {
        if (!confirm('Release-test this submission? This will spend a release token.')) event.preventDefault();
      });
      releaseHeading.replaceWith(form);
    }

    const list = $('ul');
    if (list) {
      list.classList.add('mui-list');
      const now = new Date();
      for (const item of list.querySelectorAll('li')) {
        const when = MUI.dates.parseMarmosetDate(item.textContent, { now });
        if (when && when > now) {
          item.append(document.createTextNode(` (in ${MUI.dates.formatDuration(when - now)})`));
        }
      }
    }
  }

  function enhanceSubmitPage() {
    const formTable = $('table.form');
    const originalForm =
      formTable?.closest('form') ?? $(`form[action*="${C.SUBMIT_ACTION}"]`) ?? $('form input[type="file"]')?.closest('form');
    const projectPK =
      new URL(location.href).searchParams.get('projectPK') ??
      originalForm?.querySelector('input[name="projectPK"]')?.value;
    if (!projectPK) return;

    const extraFields = {};
    for (const input of (originalForm ?? document).querySelectorAll('input[type="hidden"]')) {
      if (input.name && !['projectPK', 'submitClientTool'].includes(input.name)) {
        extraFields[input.name] = input.value;
      }
    }

    const fileInput = el('input', { attrs: { type: 'file', name: 'file', size: '40' } });
    const submitButton = el('button', { className: 'mui-button', text: 'Submit', attrs: { type: 'submit' } });
    const errorBox = el('p', { attrs: { role: 'alert', hidden: '', style: 'color:#d9534f;font-weight:bold' } });
    const form = el('form', { children: [fileInput, submitButton, errorBox] });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const file = fileInput.files?.[0];
      if (!file || file.size === 0) {
        errorBox.textContent = file ? 'That file is empty.' : 'Choose a file first.';
        errorBox.hidden = false;
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting…';
      const result = await MUI.submit.submitProject({ projectPK, file, extraFields });
      if (result.ok) {
        MUI.submit.showToast('Submitted ✓ — refreshing…', 'success');
        setTimeout(() => location.reload(), C.RELOAD_AFTER_SUBMIT_MS);
      } else {
        errorBox.textContent = result.message;
        errorBox.hidden = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    });

    const container = el('div', { className: 'mui-form', children: [form] });
    const target = originalForm ?? formTable;
    if (target) target.replaceWith(container);
    else ($('.wrapper') ?? document.body).append(container);
  }

  /* ========================================================================
     Dispatch
     ======================================================================== */

  const ENHANCERS = {
    LOGIN: enhanceLogin,
    COURSES: enhanceCourses,
    PROBLEMS: enhanceProblems,
    SUBMISSIONS: enhanceSubmissions,
    DETAILS: enhanceDetails,
    SUBMIT: enhanceSubmitPage,
    UNKNOWN: () => {},
  };

  function enhance(page) {
    MUI.safe('legacy chrome', applyChrome);
    MUI.safe(`classic ${page} enhancer`, () => (ENHANCERS[page] ?? ENHANCERS.UNKNOWN)());
  }

  MUI.legacy = { enhance };
})();
