/**
 * MarmoUI — Marmoset date handling.
 *
 * Marmoset renders dates in campus time (America/Toronto) in a few shapes:
 *
 *   "08 Mar, 11:00 PM"                 (due dates, token-regeneration lists)
 *   "Mar 8, 2026 at 11:00 PM"          (long form with explicit year)
 *   "Sunday, March 8 2026 11:00 PM"    (verbose variants)
 *
 * One tolerant parser handles all of them:
 *   - month: any word that is a real month name (or 3-letter prefix)
 *   - day: the 1-2 digit number adjacent to the month word
 *   - year: explicit 4-digit year if present, otherwise inferred as the
 *     candidate ({last, this, next} year) closest to "now" — correct across
 *     New Year rollovers with no hardcoded year
 *   - time: "H:MM[:SS] [AM/PM]" or "H AM/PM"; defaults to midnight
 *   - timezone: interpreted in America/Toronto (DST-aware via Intl), so
 *     EST/EDT are handled correctly wherever the user's machine is
 *
 * This module is DOM-free so it can be unit-tested under Node.
 */
(() => {
  'use strict';

  const MUI = (globalThis.MarmoUI ??= {});

  const MONTH_NAMES = [
    ['jan', 'january'],
    ['feb', 'february'],
    ['mar', 'march'],
    ['apr', 'april'],
    ['may'],
    ['jun', 'june'],
    ['jul', 'july'],
    ['aug', 'august'],
    ['sep', 'sept', 'september'],
    ['oct', 'october'],
    ['nov', 'november'],
    ['dec', 'december'],
  ];

  /** token (lowercase) -> 0-based month index */
  const MONTH_LOOKUP = new Map();
  MONTH_NAMES.forEach((tokens, index) => {
    for (const token of tokens) MONTH_LOOKUP.set(token, index);
  });

  const DEFAULT_TIME_ZONE = 'America/Toronto';

  const formatterCache = new Map();

  function zoneFormatter(timeZone) {
    let formatter = formatterCache.get(timeZone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      formatterCache.set(timeZone, formatter);
    }
    return formatter;
  }

  /** The zone-local wall-clock reading of `timestamp`, re-encoded as a UTC ms value. */
  function wallClockAsUtc(timestamp, timeZone) {
    const parts = {};
    for (const { type, value } of zoneFormatter(timeZone).formatToParts(timestamp)) {
      parts[type] = value;
    }
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
  }

  /**
   * Build a Date for a wall-clock time in a specific IANA timezone.
   * Standard offset-probe technique; the second adjustment settles
   * DST-boundary cases.
   *
   * @returns {Date}
   */
  function zonedDate(year, monthIndex, day, hour, minute, timeZone = DEFAULT_TIME_ZONE) {
    const target = Date.UTC(year, monthIndex, day, hour, minute, 0);
    let ts = target - (wallClockAsUtc(target, timeZone) - target);
    ts -= wallClockAsUtc(ts, timeZone) - target;
    return new Date(ts);
  }

  /** Locate a month word and return { index: 0-based month, start, end } or null. */
  function findMonth(text) {
    const wordRe = /[a-z]{3,9}/gi;
    let match;
    while ((match = wordRe.exec(text)) !== null) {
      const monthIndex = MONTH_LOOKUP.get(match[0].toLowerCase());
      if (monthIndex !== undefined) {
        return { index: monthIndex, start: match.index, end: match.index + match[0].length };
      }
    }
    return null;
  }

  /** Day-of-month must sit directly beside the month word ("08 Mar" / "Mar 8, ..."). */
  function findAdjacentDay(text, month) {
    const before = text.slice(0, month.start).match(/(\d{1,2})(?:st|nd|rd|th)?[\s,]*$/);
    if (before) return Number(before[1]);
    const after = text.slice(month.end).match(/^[\s,]*(\d{1,2})(?!\d)/);
    if (after) return Number(after[1]);
    return null;
  }

  /** Extract { hour, minute } (24h) or null if the text has no usable time. */
  function findTime(text) {
    const meridiem = text.match(/\b([ap])\.?m\.?\b/i)?.[1].toLowerCase() ?? null;
    const clock = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
    let hour;
    let minute;
    if (clock) {
      hour = Number(clock[1]);
      minute = Number(clock[2]);
    } else {
      const hourOnly = text.match(/\b(\d{1,2})\s*[ap]\.?m\.?\b/i);
      if (!hourOnly) return { hour: 0, minute: 0 }; // date-only string
      hour = Number(hourOnly[1]);
      minute = 0;
    }
    if (minute > 59) return null;
    if (meridiem) {
      if (hour < 1 || hour > 12) return null;
      if (meridiem === 'p' && hour !== 12) hour += 12;
      if (meridiem === 'a' && hour === 12) hour = 0;
    } else if (hour > 23) {
      return null;
    }
    return { hour, minute };
  }

  /**
   * Term years encoded in a Marmoset archive base path, e.g.
   * "/marmoset-w24-f24/view/…" → [2024, 2024]. The current server ("/view/…")
   * has no term tokens and returns [].
   */
  function yearsFromPath(path) {
    if (typeof path !== 'string') return [];
    const years = [];
    for (const match of path.toLowerCase().matchAll(/(?:^|[^a-z])[wsf](\d{2})(?=\D|$)/g)) {
      years.push(2000 + Number(match[1]));
    }
    return years;
  }

  /**
   * Choose the year that puts the date closest to `now`. Yearless dates on an
   * archive server are clamped to the archive's term years — otherwise a 2024
   * deadline read in 2026 would "helpfully" resolve to 2026.
   */
  function inferYear(monthIndex, day, hour, minute, now, timeZone, allowedYears) {
    const base = now.getFullYear();
    const candidates = allowedYears?.length
      ? [...new Set(allowedYears)]
      : [base - 1, base, base + 1];
    let best = candidates[0];
    let bestDistance = Infinity;
    for (const year of candidates) {
      const candidate = zonedDate(year, monthIndex, day, hour, minute, timeZone);
      const distance = Math.abs(candidate.getTime() - now.getTime());
      if (distance < bestDistance) {
        bestDistance = distance;
        best = year;
      }
    }
    return best;
  }

  /**
   * Parse a Marmoset-rendered date string.
   *
   * @param {string} text
   * @param {object} [options]
   * @param {Date} [options.now] - reference time for year inference (tests inject this)
   * @param {string} [options.timeZone]
   * @param {number[]} [options.allowedYears] - clamp inferred years (archive
   *   servers); defaults to the years encoded in the current URL's base path
   * @returns {Date|null} null when the text does not contain a recognizable date
   */
  function parseMarmosetDate(text, { now = new Date(), timeZone = DEFAULT_TIME_ZONE, allowedYears } = {}) {
    if (typeof text !== 'string') return null;
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;

    const month = findMonth(cleaned);
    if (!month) return null;

    const day = findAdjacentDay(cleaned, month);
    if (day === null || day < 1 || day > 31) return null;

    const time = findTime(cleaned);
    if (!time) return null;

    const explicitYear = cleaned.match(/\b((?:19|20)\d{2})\b/);
    const yearHint = allowedYears ?? yearsFromPath(globalThis.location?.pathname ?? '');
    const year = explicitYear
      ? Number(explicitYear[1])
      : inferYear(month.index, day, time.hour, time.minute, now, timeZone, yearHint);

    const date = zonedDate(year, month.index, day, time.hour, time.minute, timeZone);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /**
   * Live countdown label for a deadline (design-spec semantics):
   *   > 1 day  → "2d 4h"   (not urgent)
   *   > 1 hour → "4h 32m"  (urgent)
   *   under 1h → "12m 33s" (urgent)
   *   past     → closed
   *
   * @param {Date} due
   * @param {Date} [now]
   * @returns {{text: string, urgent: boolean, closed: boolean}}
   */
  function formatCountdown(due, now = new Date()) {
    const ms = due.getTime() - now.getTime();
    if (ms <= 0) return { text: 'Closed', urgent: false, closed: true };
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86_400);
    const hours = Math.floor((total % 86_400) / 3_600);
    const minutes = Math.floor((total % 3_600) / 60);
    const seconds = total % 60;
    if (days > 0) return { text: `${days}d ${hours}h`, urgent: false, closed: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, urgent: true, closed: false };
    return { text: `${minutes}m ${seconds}s`, urgent: true, closed: false };
  }

  /** Compact "Xh Ym" duration label (token renewals). */
  function formatDuration(ms) {
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  }

  MUI.dates = { parseMarmosetDate, formatCountdown, formatDuration, zonedDate, yearsFromPath };
})();
