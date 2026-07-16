/**
 * MarmoUI — table sorting and row highlighting.
 *
 * Both features are strictly scoped to the table they are attached to (the
 * old implementation bound to every <th>/<tr> on the page, so clicking a
 * header in one table sorted a different one).
 */
(() => {
  'use strict';

  const MUI = globalThis.MarmoUI;

  /** Rows that carry data (skips header rows, which have only <th> cells). */
  const dataRows = (table) => [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td'));

  const headerCells = (table) => {
    const firstRow = table.querySelector('tr');
    return firstRow ? [...firstRow.cells] : [];
  };

  const cellText = (row, index) => row.cells[index]?.textContent.trim() ?? '';

  /**
   * Sniff a column's type from its populated cells: 'number' | 'date' | 'string'.
   * A single non-conforming value demotes the column (so "10 / 20" columns
   * sort as strings, not garbage numbers).
   */
  function columnType(rows, index) {
    let sawValue = false;
    let numeric = true;
    let datelike = true;
    for (const row of rows) {
      const text = cellText(row, index);
      if (!text) continue;
      sawValue = true;
      if (numeric && Number.isNaN(Number(text))) numeric = false;
      if (datelike && !MUI.dates.parseMarmosetDate(text)) datelike = false;
      if (!numeric && !datelike) return 'string';
    }
    if (!sawValue) return 'string';
    if (numeric) return 'number';
    if (datelike) return 'date';
    return 'string';
  }

  function sortByColumn(table, index, direction) {
    const rows = dataRows(table);
    if (!rows.length) return;
    const type = columnType(rows, index);

    const keyed = rows.map((row, position) => {
      const text = cellText(row, index);
      let key = null;
      if (text) {
        if (type === 'number') key = Number(text);
        else if (type === 'date') key = MUI.dates.parseMarmosetDate(text)?.getTime() ?? null;
        else key = text.toLowerCase();
      }
      return { row, position, key };
    });

    const dir = direction === 'ascending' ? 1 : -1;
    keyed.sort((a, b) => {
      // Missing values always sort last; ties keep document order (stable).
      if (a.key === null && b.key === null) return a.position - b.position;
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      const cmp = typeof a.key === 'string' ? a.key.localeCompare(b.key) : a.key - b.key;
      return cmp === 0 ? a.position - b.position : cmp * dir;
    });

    const parent = rows[0].parentNode;
    for (const { row } of keyed) parent.appendChild(row);
  }

  /**
   * Make a table's headers sortable (click / Enter / Space), with aria-sort
   * state and a layout-stable indicator (see styles.css).
   */
  function makeSortable(table) {
    if (!table || table.dataset.muiSortable === 'true') return;
    table.dataset.muiSortable = 'true';
    table.classList.add('mui-sortable');

    headerCells(table).forEach((th, index) => {
      th.tabIndex = 0;

      const activate = () => {
        const direction = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        for (const other of headerCells(table)) other.removeAttribute('aria-sort');
        th.setAttribute('aria-sort', direction);
        MUI.safe(`sort column ${index}`, () => sortByColumn(table, index, direction));
      };

      th.addEventListener('click', activate);
      th.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  /**
   * Click a data row to highlight it (click again to clear). Uses one
   * delegated listener; clicks on links/buttons/inputs pass through untouched.
   */
  function makeHighlightable(table) {
    if (!table || table.dataset.muiHighlight === 'true') return;
    table.dataset.muiHighlight = 'true';

    table.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select, label')) return;
      const row = event.target.closest('tr');
      if (!row || !table.contains(row) || !row.querySelector('td')) return;
      const wasSelected = row.classList.contains('mui-selected');
      for (const selected of table.querySelectorAll('tr.mui-selected')) {
        selected.classList.remove('mui-selected');
      }
      if (!wasSelected) row.classList.add('mui-selected');
    });
  }

  MUI.tables = { makeSortable, makeHighlightable, dataRows, headerCells };
})();
