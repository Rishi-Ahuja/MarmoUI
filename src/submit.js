/**
 * MarmoUI — submission flow (design: drop-zone card + dialog).
 *
 * POSTs via fetch(FormData); nothing is ever submitted without an explicit
 * user action (the old hidden-iframe flow auto-POSTed empty files — issue #3).
 * All handlers are attached with addEventListener; inline onclick attributes
 * run in the page world (or are stripped by CSP) and can never reach
 * content-script functions.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { el, log } = MUI;

  /** Markers that identify a Tomcat/Marmoset error response. */
  const SERVER_ERROR_RE = /javax\.servlet|ServletException|Trying upload file of size 0|HTTP Status\s+[45]\d\d/i;

  function showToast(message, kind = 'success') {
    document.querySelector('.mui-toast')?.remove();
    const toast = el('div', {
      className: `mui-toast mui-toast--${kind}`,
      text: message,
      attrs: { role: 'status' },
    });
    document.body.append(toast);
    setTimeout(() => toast.remove(), 6_000);
  }

  /** Pull a short human-readable error out of a Marmoset error page, if any. */
  function extractServerError(html) {
    if (!SERVER_ERROR_RE.test(html)) return null;
    const text = new DOMParser().parseFromString(html, 'text/html').body?.textContent ?? '';
    const line = text
      .split('\n')
      .map((candidate) => candidate.trim())
      .find((candidate) => SERVER_ERROR_RE.test(candidate));
    return (line ?? 'The server rejected the submission.').slice(0, 200);
  }

  /**
   * POST one submission.
   *
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async function submitProject({ projectPK, file, extraFields = {} }) {
    const body = new FormData();
    for (const [name, value] of Object.entries(extraFields)) body.set(name, value);
    body.set('projectPK', projectPK);
    body.set('submitClientTool', 'web');
    body.set('file', file);

    try {
      // basePath() keeps archive servers ("/marmoset-w24-f24/…") working.
      const response = await fetch(`${MUI.basePath()}${MUI.constants.SUBMIT_ACTION}`, { method: 'POST', body });
      const html = await response.text();
      const serverError = extractServerError(html);
      if (!response.ok || serverError) {
        return { ok: false, message: serverError ?? `Submission failed (HTTP ${response.status}).` };
      }
      return { ok: true };
    } catch (err) {
      log.error('Submission request failed:', err);
      return { ok: false, message: 'Network error — check your connection and try again.' };
    }
  }

  /**
   * Build the design's drop-zone submit form. Click-to-browse and drag & drop
   * both feed the same hidden file input; submission only happens on the
   * user's explicit Submit click.
   *
   * @param {object} params
   * @param {string} params.projectPK
   * @param {Object<string,string>} [params.extraFields]
   * @param {string} [params.dueText] - countdown or date text for the footer note
   * @param {() => void} [params.onSuccess]
   */
  function buildSubmitForm({ projectPK, extraFields = {}, dueText = '', onSuccess } = {}) {
    const fileInput = el('input', { attrs: { type: 'file', name: 'file', 'aria-label': 'Submission file' } });
    const dropLabel = el('div', { className: 'mui-drop-label', text: 'Drop a file here or click to browse' });

    const dropzone = el('label', {
      className: 'mui-dropzone',
      children: [
        el('div', { className: 'mui-drop-glyph', text: '⬍', attrs: { 'aria-hidden': 'true' } }),
        dropLabel,
        el('div', { className: 'mui-drop-hint', text: '.tar.gz, .zip, or individual source files' }),
        fileInput,
      ],
    });

    const syncLabel = () => {
      const file = fileInput.files?.[0];
      dropLabel.textContent = file ? file.name : 'Drop a file here or click to browse';
    };
    fileInput.addEventListener('change', syncLabel);

    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('mui-dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('mui-dragover'));
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('mui-dragover');
      if (event.dataTransfer?.files?.length) {
        fileInput.files = event.dataTransfer.files;
        syncLabel();
      }
    });

    const submitButton = el('button', {
      className: 'mui-btn mui-btn--lg',
      text: 'Submit',
      attrs: { type: 'submit' },
    });
    const dueNote = el('div', { className: 'mui-due-note' });
    if (dueText) {
      dueNote.append(document.createTextNode('Due '), el('b', { text: dueText }), document.createTextNode(' · this won’t spend a token'));
    } else {
      dueNote.textContent = 'This won’t spend a token';
    }
    const errorBox = el('p', { className: 'mui-form-error', attrs: { role: 'alert', hidden: '' } });

    const form = el('form', {
      className: 'mui-submit-form',
      children: [
        dropzone,
        el('div', { className: 'mui-submit-foot', children: [dueNote, submitButton] }),
        errorBox,
      ],
    });

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
      errorBox.hidden = true;

      const result = await submitProject({ projectPK, file, extraFields });

      if (result.ok) {
        showToast('Submitted ✓ — refreshing…', 'success');
        onSuccess?.();
        setTimeout(() => location.reload(), MUI.constants.RELOAD_AFTER_SUBMIT_MS);
      } else {
        errorBox.textContent = result.message;
        errorBox.hidden = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    });

    return form;
  }

  let activePopup = null;

  function closePopup() {
    if (!activePopup) return;
    const { overlay, popup, keyHandler, previousFocus } = activePopup;
    activePopup = null;
    document.removeEventListener('keydown', keyHandler);
    overlay.remove();
    popup.remove();
    previousFocus?.focus?.();
  }

  /**
   * Open the submission dialog. Closable via ×, Escape, or the overlay;
   * single instance; focus is moved in on open and restored on close.
   *
   * @param {object} params
   * @param {string} params.projectPK
   * @param {string} [params.projectName]
   * @param {string} [params.eyebrow] - e.g. "CS 246 · A5"
   * @param {string} [params.dueDateText] - raw Marmoset date text
   * @param {Date} [params.due] - parsed deadline (renders a countdown)
   * @param {string} [params.viewUrl]
   */
  function openSubmissionPopup({ projectPK, projectName, eyebrow, dueDateText, due, viewUrl }) {
    closePopup();
    const previousFocus = document.activeElement;

    const overlay = el('div', { className: 'mui-overlay', on: { click: closePopup } });

    const dueText = due ? MUI.dates.formatCountdown(due).text : dueDateText;
    const children = [
      el('button', {
        className: 'mui-popup-close',
        text: '×',
        attrs: { type: 'button', 'aria-label': 'Close' },
        on: { click: closePopup },
      }),
    ];
    if (eyebrow) children.push(el('div', { className: 'mui-eyebrow', text: eyebrow }));
    children.push(el('h2', { text: projectName || 'Submit solution', attrs: { id: 'mui-popup-title' } }));
    children.push(buildSubmitForm({ projectPK, dueText, onSuccess: closePopup }));
    if (viewUrl) {
      children.push(el('div', {
        className: 'mui-card-note',
        children: [el('a', { text: 'View submissions →', attrs: { href: viewUrl } })],
      }));
    }

    const popup = el('div', {
      className: 'mui-popup',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mui-popup-title' },
      children,
    });

    const keyHandler = (event) => {
      if (event.key === 'Escape') closePopup();
    };
    document.addEventListener('keydown', keyHandler);

    document.body.append(overlay, popup);
    activePopup = { overlay, popup, keyHandler, previousFocus };
    popup.querySelector('input[type="file"]')?.focus();
  }

  MUI.submit = { openSubmissionPopup, closePopup, buildSubmitForm, submitProject, showToast };
})();
