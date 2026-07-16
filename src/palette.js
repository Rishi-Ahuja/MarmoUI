/**
 * MarmoUI — ⌘K command palette.
 *
 * Item providers are registered by other modules via addItems(fn); each fn
 * returns [{ label, hint, run }]. The palette is built lazily on first open,
 * filters as you type, and supports ↑/↓/Enter/Escape.
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;
  const { el } = MUI;

  const providers = [];
  let overlay = null;
  let input = null;
  let listEl = null;
  let footEl = null;
  let items = [];
  let activeIdx = 0;

  const isOpen = () => overlay !== null;

  function addItems(provider) {
    providers.push(provider);
  }

  function collectItems(query) {
    const all = providers.flatMap((provider) => MUI.safe('palette provider', provider) ?? []);
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((item) => item.label.toLowerCase().includes(q)) : all;
    return filtered.slice(0, 8);
  }

  function renderList() {
    items = collectItems(input.value);
    activeIdx = Math.max(0, Math.min(items.length - 1, activeIdx));
    listEl.replaceChildren(
      ...items.map((item, index) =>
        el('div', {
          className: `mui-palette-item${index === activeIdx ? ' mui-active' : ''}`,
          on: { click: () => run(item) },
          children: [
            el('span', { className: 'mui-palette-label', text: item.label }),
            el('span', { className: 'mui-palette-hint', text: item.hint ?? '' }),
          ],
        }),
      ),
    );
    if (!items.length) {
      listEl.replaceChildren(el('div', {
        className: 'mui-palette-item',
        children: [el('span', { className: 'mui-palette-label', text: 'No matches' })],
      }));
    }
  }

  function run(item) {
    close();
    MUI.safe(`palette action "${item.label}"`, item.run);
  }

  function onOverlayKeydown(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); activeIdx += 1; renderList(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); activeIdx -= 1; renderList(); }
    else if (event.key === 'Enter') { event.preventDefault(); if (items[activeIdx]) run(items[activeIdx]); }
  }

  function open() {
    if (isOpen()) return;
    input = el('input', {
      attrs: { type: 'text', placeholder: 'Jump to a screen, problem, or action…', 'aria-label': 'Command palette' },
      on: { input: () => { activeIdx = 0; renderList(); } },
    });
    listEl = el('div', { className: 'mui-palette-list' });
    footEl = el('div', { className: 'mui-palette-foot', text: '↑↓ navigate · ↵ select · esc close' });

    const panel = el('div', {
      className: 'mui-palette',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Command palette' },
      on: { click: (e) => e.stopPropagation() },
      children: [
        el('div', {
          className: 'mui-palette-head',
          children: [
            el('span', { className: 'mui-palette-glyph', text: '⌘', attrs: { 'aria-hidden': 'true' } }),
            input,
            el('span', { className: 'mui-kbd', text: 'esc' }),
          ],
        }),
        listEl,
        footEl,
      ],
    });

    overlay = el('div', { className: 'mui-palette-overlay', on: { click: close } });
    overlay.append(panel);
    document.body.append(overlay);
    document.addEventListener('keydown', onOverlayKeydown, true);
    activeIdx = 0;
    renderList();
    input.focus();
  }

  function close() {
    if (!isOpen()) return;
    document.removeEventListener('keydown', onOverlayKeydown, true);
    overlay.remove();
    overlay = null;
  }

  function toggle() {
    if (isOpen()) close();
    else open();
  }

  // Global ⌘K / Ctrl+K — new UI only.
  document.addEventListener('keydown', (event) => {
    if (MUI.mode?.get() !== 'new') return;
    if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault();
      toggle();
    }
  });

  MUI.palette = { open, close, toggle, isOpen, addItems };
})();
