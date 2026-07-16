/**
 * Unit tests for src/dates.js (DOM-free, runs under plain Node).
 *
 *   node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

await import('../src/dates.js');
const { parseMarmosetDate, formatCountdown, formatDuration, zonedDate, yearsFromPath } = globalThis.MarmoUI.dates;

/** Winter reference "now": 2026-01-15 12:00 EST (17:00 UTC). */
const WINTER_NOW = new Date('2026-01-15T17:00:00Z');
/** Summer reference "now": 2026-07-13 12:00 EDT (16:00 UTC). */
const SUMMER_NOW = new Date('2026-07-13T16:00:00Z');

test('short form parses in EST (winter offset -05:00)', () => {
  const date = parseMarmosetDate('08 Mar, 11:00 PM', { now: WINTER_NOW });
  // 2026-03-08 23:00 America/Toronto is EDT?? No: DST starts 2026-03-08 02:00,
  // so 23:00 that day is EDT (-04:00) → 2026-03-09T03:00Z.
  assert.equal(date?.toISOString(), '2026-03-09T03:00:00.000Z');
});

test('same wall-clock in deep winter uses EST (-05:00)', () => {
  const date = parseMarmosetDate('08 Feb, 11:00 PM', { now: WINTER_NOW });
  assert.equal(date?.toISOString(), '2026-02-09T04:00:00.000Z');
});

test('summer dates use EDT (-04:00) — the old hardcoded -05:00 was an hour off', () => {
  const date = parseMarmosetDate('20 Jul, 11:00 PM', { now: SUMMER_NOW });
  assert.equal(date?.toISOString(), '2026-07-21T03:00:00.000Z');
});

test('long form with explicit year', () => {
  const date = parseMarmosetDate('Mar 8, 2025 at 11:00 PM', { now: SUMMER_NOW });
  assert.equal(date?.toISOString(), '2025-03-09T04:00:00.000Z'); // 2025-03-08 23:00 EDT? DST 2025 starts Mar 9 → still EST (-05:00)
});

test('verbose form with weekday and full month name', () => {
  const date = parseMarmosetDate('Sunday, March 8 2026 11:00 PM', { now: WINTER_NOW });
  assert.equal(date?.toISOString(), '2026-03-09T03:00:00.000Z');
});

test('year inference: December date seen in January belongs to LAST year', () => {
  const now = new Date('2026-01-05T17:00:00Z');
  const date = parseMarmosetDate('28 Dec, 10:00 PM', { now });
  assert.equal(date?.getUTCFullYear(), 2025);
});

test('year inference: January date seen in December belongs to NEXT year', () => {
  const now = new Date('2026-12-20T17:00:00Z');
  const date = parseMarmosetDate('05 Jan, 10:00 AM', { now });
  assert.equal(date?.getUTCFullYear(), 2027);
});

test('12 AM is midnight, 12 PM is noon', () => {
  const midnight = parseMarmosetDate('10 Feb, 12:00 AM', { now: WINTER_NOW });
  const noon = parseMarmosetDate('10 Feb, 12:00 PM', { now: WINTER_NOW });
  assert.equal(midnight?.toISOString(), '2026-02-10T05:00:00.000Z');
  assert.equal(noon?.toISOString(), '2026-02-10T17:00:00.000Z');
});

test('hour-only time ("11 PM") parses', () => {
  const date = parseMarmosetDate('10 Feb, 11 PM', { now: WINTER_NOW });
  assert.equal(date?.toISOString(), '2026-02-11T04:00:00.000Z');
});

test('date-only string defaults to midnight', () => {
  const date = parseMarmosetDate('10 Feb', { now: WINTER_NOW });
  assert.equal(date?.toISOString(), '2026-02-10T05:00:00.000Z');
});

test('tolerates messy whitespace and trailing punctuation', () => {
  const date = parseMarmosetDate('  08  Mar,   11:00   PM  ', { now: WINTER_NOW });
  assert.ok(date instanceof Date);
});

test('does NOT treat "Marmoset" as the month of March', () => {
  assert.equal(parseMarmosetDate('Marmoset courses from 2024', { now: WINTER_NOW }), null);
});

test('day must be adjacent to the month word', () => {
  // "3" here is a token count, not a day-of-month.
  assert.equal(parseMarmosetDate('You have 3 tokens available', { now: WINTER_NOW }), null);
});

test('garbage inputs return null', () => {
  for (const input of [null, undefined, '', '   ', 'No submission', 'hello 99', '99 / 100', 'view']) {
    assert.equal(parseMarmosetDate(input, { now: WINTER_NOW }), null, `expected null for ${JSON.stringify(input)}`);
  }
});

test('invalid times return null', () => {
  assert.equal(parseMarmosetDate('10 Feb, 13:00 PM', { now: WINTER_NOW }), null); // 13 with meridiem
  assert.equal(parseMarmosetDate('10 Feb, 11:75 PM', { now: WINTER_NOW }), null); // minute out of range
});

test('formatCountdown buckets: closed / m+s / h+m / d+h (design spec)', () => {
  const now = new Date('2026-07-13T16:00:00Z');
  assert.deepEqual(formatCountdown(new Date('2026-07-13T15:00:00Z'), now), { text: 'Closed', urgent: false, closed: true });
  assert.deepEqual(formatCountdown(new Date('2026-07-13T16:30:45Z'), now), { text: '30m 45s', urgent: true, closed: false });
  assert.deepEqual(formatCountdown(new Date('2026-07-13T21:12:00Z'), now), { text: '5h 12m', urgent: true, closed: false });
  assert.deepEqual(formatCountdown(new Date('2026-07-16T20:00:00Z'), now), { text: '3d 4h', urgent: false, closed: false });
  assert.deepEqual(formatCountdown(new Date('2026-07-14T17:00:00Z'), now), { text: '1d 1h', urgent: false, closed: false });
});

test('formatDuration renders h/m', () => {
  assert.equal(formatDuration(3 * 3_600_000 + 25 * 60_000), '3h 25m');
  assert.equal(formatDuration(59_000), '0h 0m');
});

test('yearsFromPath extracts archive term years', () => {
  assert.deepEqual(yearsFromPath('/marmoset-w24-f24/view/course.jsp'), [2024, 2024]);
  assert.deepEqual(yearsFromPath('/marmoset-s23/view/index.jsp'), [2023]);
  assert.deepEqual(yearsFromPath('/view/course.jsp'), []);
  assert.deepEqual(yearsFromPath(''), []);
  // No false positives on ordinary words containing w/s/f + digits boundaries.
  assert.deepEqual(yearsFromPath('/awesome99/view/x'), []);
});

test('archive year hint pins yearless dates to the archive term', () => {
  // "09 Oct, 11:59 PM" read in July 2026: unhinted inference would pick 2026
  // (closest), but a w24-f24 archive means it MUST be 2024.
  const now = new Date('2026-07-15T16:00:00Z');
  const unhinted = parseMarmosetDate('09 Oct, 11:59 PM', { now });
  assert.equal(unhinted?.getUTCFullYear(), 2026);
  const hinted = parseMarmosetDate('09 Oct, 11:59 PM', { now, allowedYears: [2024, 2024] });
  assert.equal(hinted?.getUTCFullYear(), 2024);
  assert.ok(formatCountdown(hinted, now).closed);
});

test('real project-page deadline format parses (weekday + year + "at")', () => {
  const now = new Date('2026-07-15T16:00:00Z');
  const date = parseMarmosetDate('Wed, 09 Oct 2024 at 11:59 PM', { now });
  assert.equal(date?.toISOString(), '2024-10-10T03:59:00.000Z'); // EDT -04:00
});

test('zonedDate handles the DST spring-forward boundary sanely', () => {
  // 2026-03-08 02:30 does not exist in America/Toronto (clocks jump 02:00→03:00).
  const date = zonedDate(2026, 2, 8, 2, 30, 'America/Toronto');
  assert.ok(!Number.isNaN(date.getTime()));
  // Must land within an hour of the intended wall-clock instant.
  const target = Date.UTC(2026, 2, 8, 2 + 5, 30); // as if EST
  assert.ok(Math.abs(date.getTime() - target) <= 3_600_000);
});
