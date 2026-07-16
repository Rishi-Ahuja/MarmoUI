/**
 * MarmoUI — DOM, logging, and network utilities.
 */
(() => {
  'use strict';

  const MUI = (globalThis.MarmoUI ??= {});

  const log = {
    info: (...args) => console.info('[MarmoUI]', ...args),
    warn: (...args) => console.warn('[MarmoUI]', ...args),
    error: (...args) => console.error('[MarmoUI]', ...args),
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /**
   * Create an element declaratively.
   *
   * @param {string} tag
   * @param {object} [options]
   * @param {string} [options.className]
   * @param {string} [options.text] - assigned via textContent (never parsed as HTML)
   * @param {Object<string,string>} [options.attrs] - set via setAttribute
   * @param {Object<string,Function>} [options.on] - event listeners
   * @param {Array<Node|null|undefined>} [options.children]
   * @returns {HTMLElement}
   */
  function el(tag, { className, text, attrs, on, children } = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (attrs) {
      for (const [name, value] of Object.entries(attrs)) {
        if (value !== undefined && value !== null) node.setAttribute(name, value);
      }
    }
    if (on) {
      for (const [type, listener] of Object.entries(on)) node.addEventListener(type, listener);
    }
    if (children) node.append(...children.filter(Boolean));
    return node;
  }

  /** Escape text for the rare cases where string templating is unavoidable. */
  const escapeHtml = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  /**
   * Run an enhancement step, logging failures instead of letting one broken
   * step take down every other enhancement on the page.
   */
  function safe(label, fn) {
    try {
      return fn();
    } catch (err) {
      log.error(`${label} failed:`, err);
      return undefined;
    }
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Server base path. The current server serves from "/", but archive servers
   * live under a prefix ("/marmoset-w24-f24/view/…"), and absolute action
   * URLs must carry it.
   */
  const basePath = () =>
    globalThis.location?.pathname.match(/^(.*?)\/(?:view|action|authenticate)\//)?.[1] ?? '';

  /**
   * Minimal promise-concurrency limiter: `limit(task)` queues `task` and runs
   * at most `max` tasks at once.
   */
  function pLimit(max) {
    let active = 0;
    const queue = [];

    const runNext = () => {
      if (active >= max || queue.length === 0) return;
      active += 1;
      const { task, resolve, reject } = queue.shift();
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          runNext();
        });
    };

    return (task) =>
      new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        runNext();
      });
  }

  /**
   * Fetch a same-origin page and parse it into a Document.
   *
   * Retries transient failures only (network errors, timeouts, HTTP 5xx) with
   * exponential backoff; HTTP 4xx and parse/callback errors fail fast — a
   * deterministic failure should never trigger a retry storm.
   *
   * @param {string} url
   * @returns {Promise<Document>}
   */
  async function fetchDoc(url, options = {}) {
    const C = MUI.constants;
    const {
      retries = C.FETCH_RETRIES,
      timeoutMs = C.FETCH_TIMEOUT_MS,
      backoffMs = C.FETCH_BACKOFF_MS,
    } = options;

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (attempt > 0) await sleep(backoffMs * 2 ** (attempt - 1));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (response.status >= 500) {
          lastError = new Error(`HTTP ${response.status} for ${url}`);
          continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        const html = await response.text();
        return new DOMParser().parseFromString(html, 'text/html');
      } catch (err) {
        // fetch network failures are TypeErrors; our timeout aborts are AbortErrors.
        if (err.name === 'TypeError' || err.name === 'AbortError') {
          lastError = err;
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error(`Failed to fetch ${url}`);
  }

  Object.assign(MUI, { log, $, $$, el, escapeHtml, safe, sleep, basePath, pLimit, fetchDoc });
})();
