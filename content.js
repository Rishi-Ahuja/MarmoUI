//  __  __                            _    _ _____      ___  
// |  \/  |                          | |  | |_   _|    |__ \ 
// | \  / | __ _ _ __ _ __ ___   ___ | |  | | | |         ) |
// | |\/| |/ _` | '__| '_ ` _ \ / _ \| |  | | | |        / / 
// | |  | | (_| | |  | | | | | | (_) | |__| |_| |_      / /_ 
// | |  | |\__,_|_|  |_| |_| |_|\___/ \____/|_____|    |____|
//
// Created by Rishi Ahuja
//
// Installation procedures:
// Chrome:
//      Go to Chrome Menu -> More Tools -> Extensions
//      Enable "Developer mode" in the top right corner
//      Click "Load unpacked" and select the folder containing "marmo-ui.user.js"
//      The extension will load and apply to Marmoset pages
//
// ==UserScript==
// @name                MarmoUI
// @description         MarmoUI Improved! Enhanced Marmoset UI with Theme Switching
// @author              Rishi Ahuja (https://rishiahuja.me/)
// @version             2.0
// @include             https://marmoset.student.cs.uwaterloo.ca*
// ==/UserScript==
//
// Inspired by MarmoUI 1.5 by Shida Li and Erica Xu
// https://github.com/lishid/MarmoUI
//


// MarmoUI 2.0 Console Edition - Enhanced Marmoset UI with Theme Switching (March 08, 2025)
(() => {
    const css = `
      :root {
        /* Light Theme (Default) */
        --primary-light: #2a4d69;
        --secondary-light: #4a8e9a;
        --accent-light: rgb(14, 14, 15);
        --background-light: #f9f7f0;
        --text-light: #2e2e2e;
        --success-light: #a8d5ba;
        --error-light: #f4b3b2;
        --shadow-light: 0 4px 12px rgba(0, 0, 0, 0.1);
        --button-bg-light: #6ab0bc;
        --button-hover-light: #3a8290;
        --row-bg-light: var(--background-light);
        --row-hover-light: color-mix(in srgb, var(--background-light) 90%, #ffffff);
  
        /* Dark Theme (Inspired by VS Code) */
        --primary-dark: #569cd6;
        --secondary-dark: #4ec9b0;
        --accent-dark: rgb(218, 26, 176);
        --background-dark: #1e1e1e;
        --text-dark: rgb(13, 156, 156);
        --success-dark: rgba(61, 135, 82, 0.47);
        --error-dark: rgba(160, 56, 56, 0.58);
        --shadow-dark: 0 4px 12px rgba(0, 0, 0, 0.5);
        --button-bg-dark: rgb(47, 11, 106);
        --button-hover-dark: rgb(51, 43, 91);
        --row-bg-dark: #2e2e2e;
        --row-hover-dark: color-mix(in srgb, var(--background-dark) 80%, #4e4e4e);
  
        /* Vintage Theme (Old MarmoUI Colors) */
        --primary-vintage: #2c6b94;
        --secondary-vintage: #ffcc33;
        --accent-vintage: rgb(37, 7, 135);
        --background-vintage: #022d49;
        --text-vintage: rgb(21, 25, 26);
        --success-vintage: rgba(201, 248, 176, 0.8);
        --error-vintage: rgba(234, 179, 186, 0.8);
        --shadow-vintage: 0 4px 12px rgba(0, 0, 0, 0.1);
        --button-bg-vintage: #ffcc33;
        --button-hover-vintage: #eeeeee;
        --row-bg-vintage: color-mix(in srgb, var(--secondary-vintage) 90%, #ffffff);
        --row-hover-vintage: var(--button-hover-vintage);
  
        /* Default to Light Theme */
        --primary: var(--primary-light);
        --secondary: var(--secondary-light);
        --accent: var(--accent-light);
        --background: var(--background-light);
        --text: var(--text-light);
        --success: var(--success-light);
        --error: var(--error-light);
        --shadow: var(--shadow-light);
        --button-bg: var(--button-bg-light);
        --button-hover: var(--button-hover-light);
        --row-bg: var(--row-bg-light);
        --row-hover: var(--row-hover-light);
      }
  
      /* Light Theme */
      body.light {
        --primary: var(--primary-light);
        --secondary: var(--secondary-light);
        --accent: var(--accent-light);
        --background: var(--background-light);
        --text: var(--text-light);
        --success: var(--success-light);
        --error: var(--error-light);
        --shadow: var(--shadow-light);
        --button-bg: var(--button-bg-light);
        --button-hover: var(--button-hover-light);
        --row-bg: var(--row-bg-light);
        --row-hover: var(--row-hover-light);
      }
  
      /* Dark Theme */
      body.dark {
        --primary: var(--primary-dark);
        --secondary: var(--secondary-dark);
        --accent: var(--accent-dark);
        --background: var(--background-dark);
        --text: var(--text-dark);
        --success: var(--success-dark);
        --error: var(--error-dark);
        --shadow: var(--shadow-dark);
        --button-bg: var(--button-bg-dark);
        --button-hover: var(--button-hover-dark);
        --row-bg: var(--row-bg-dark);
        --row-hover: var(--row-hover-dark);
      }
  
      /* Vintage Theme */
      body.vintage {
        --primary: var(--primary-vintage);
        --secondary: var(--secondary-vintage);
        --accent: var(--accent-vintage);
        --background: var(--background-vintage);
        --text: var(--text-vintage);
        --success: var(--success-vintage);
        --error: var(--error-vintage);
        --shadow: var(--shadow-vintage);
        --button-bg: var(--button-bg-vintage);
        --button-hover: var(--button-hover-vintage);
        --row-bg: var(--row-bg-vintage);
        --row-hover: var(--row-hover-vintage);
      }
  
      body {
        margin: 0;
        padding: 20px;
        background: var(--background);
        color: var(--text);
        font-family: 'Roboto', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        transition: background 0.3s ease, color 0.3s ease;
      }
  
      .wrapper {
        max-width: 1200px;
        margin: 0 auto;
        position: relative;
      }
  
      .mui-header {
        text-align: center;
        padding: 1rem 0;
        margin: 0;
        font-family: 'Lobster', cursive;
        font-size: 4.5rem;
        color: var(--primary);
        font-weight: normal;
      }
  
      .mui-header p {
        margin: 0;
        font-family: 'Lobster', cursive;
        font-size: 4.5rem;
        color: var(--primary);
        font-weight: normal;
      }
  
      body.vintage .mui-header p {
        color: #ffffff;
      }
  
      .mui-breadcrumb {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        margin-bottom: 20px;
      }
  
      .mui-breadcrumb .left {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-left: 20px;
      }
  
      .mui-breadcrumb .left p {
        margin: 0;
        font-size: 1.1rem;
      }
  
      .mui-breadcrumb .left a {
        color: var(--primary);
        text-decoration: none;
        font-weight: bold;
        transition: color 0.3s ease;
      }
  
      .mui-breadcrumb .left a:hover {
        color: var(--accent);
        text-decoration: underline;
      }
  
      body.vintage .mui-breadcrumb .left p,
      body.vintage .mui-breadcrumb .left a {
        color: #ffcc33;
      }
  
      .mui-breadcrumb .logout {
        margin-left: 1rem;
        background: transparent; /* Make division background transparent */
      }
  
      .mui-breadcrumb .logout a {
        color: var(--primary);
        text-decoration: none;
        font-weight: bold;
        transition: color 0.3s ease;
        padding: 0.5rem 1rem;
        background: var(--button-bg);
        border-radius: 5px;
      }
  
      body.vintage .mui-breadcrumb .logout a {
        background: #ffcc33;
        border-radius: 20px;
        color: #000000;
      }
  
      body.vintage .mui-breadcrumb .logout a:hover {
        background: #eeeeee;
        color: var(--accent);
      }
  
      .mui-breadcrumb .logout a:hover {
        color: var(--accent);
        text-decoration: underline;
      }
  
      .mui-breadcrumb .separator {
        color: var(--primary); /* Match breadcrumb link color */
        margin: 0 0.5rem;
      }
  
      body.vintage .mui-breadcrumb .separator {
        color: #ffcc33; /* Match vintage theme breadcrumb color */
      }
  
      .mui-breadcrumb .theme-selector {
        padding: 0.5rem;
        background: var(--secondary);
        color: var(--text);
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s ease;
        margin-right: 20px;
      }
  
      .mui-breadcrumb .theme-selector:hover {
        background: var(--button-hover);
      }
  
      /* Rest of the CSS remains unchanged */
  
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: var(--row-bg); /* Theme-specific row background */
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--shadow);
      }
  
      th, td {
        padding: 1rem;
        text-align: center;
        border-bottom: 1px solid color-mix(in srgb, var(--background) 90%, #e0e0e0); /* Dynamic border color */
        color: var(--text); /* Theme-specific text color */
      }
  
      th {
        background: var(--primary);
        color: #ffffff;
        font-weight: 500;
        position: relative;
        transition: background 0.3s ease;
      }
  
      th:hover {
        background: color-mix(in srgb, var(--primary) 80%, #000000); /* Dynamic darkening */
      }
  
      th:hover::after {
        content: ' ⇅';
        margin-left: 5px;
      }
  
      tr {
        background: var(--row-bg); /* Ensure row background matches theme */
        transition: background 0.3s ease;
      }
  
      tr:hover {
        background: var(--row-hover); /* Theme-specific hover effect */
      }
  
      tr.selected {
        background: var(--accent);
        color: var(--text);
      }
  
      td.passed {
        background: var(--success);
        color: #2e2e2e;
        border-radius: 5px;
      }
  
      td.failed {
        background: var(--error);
        color: #2e2e2e;
        border-radius: 5px;
      }
  
      td a, th a {
        color: var(--accent); /* Theme-specific link color */
        text-decoration: none;
        transition: color 0.3s ease;
      }
  
      td a:hover, th a:hover {
        color: color-mix(in srgb, var(--accent) 80%, #ffffff); /* Brighter hover effect */
      }
  
      .mui-button {
        background: var(--button-bg);
        color: var(--text);
        padding: 1rem 2rem;
        border-radius: 5px;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
        transition: transform 0.2s ease, background 0.3s ease, border-radius 0.3s ease, box-shadow 0.3s ease;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        width: auto;
        text-align: center;
      }
  
      .mui-button:hover {
        background: var(--button-hover);
        transform: scale(1.05);
        border-radius: 6px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
  
      .mui-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--background);
        color: var(--text);
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: var(--shadow);
        z-index: 1000;
        width: 90%;
        max-width: 500px;
        animation: fadeIn 0.3s ease;
        border: 1px solid var(--secondary);
      }
  
      .mui-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        animation: fadeIn 0.3s ease;
      }
  
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
  
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
  
      .mui-list { 
        list-style: none; 
        padding: 0; 
        background: var(--row-bg); /* Theme-specific background */
        border-radius: 12px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding-left: 1rem;
      }
      .mui-list li { 
        margin: 0;
        padding: 0.5rem 0;
        color: var(--text); /* Theme-specific text */
      }
  
      .archive-table {
        width: 100%;
        background: var(--row-bg); /* Theme-specific background */
        border-radius: 12px;
        box-shadow: var(--shadow);
        margin-top: 20px;
      }
      .archive-table th, .archive-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid color-mix(in srgb, var(--background) 90%, #e0e0e0); /* Dynamic border color */
        color: var(--text); /* Theme-specific text */
      }
      .archive-table th {
        background: var(--primary);
        color: #ffffff;
        font-weight: 500;
      }
      .archive-table th:nth-child(1), .archive-table td:nth-child(1) {
        width: 30%;
      }
      .archive-table th:nth-child(2), .archive-table td:nth-child(2) {
        width: 70%;
      }
      .archive-table td:nth-child(1) {
        font-weight: bold;
        color: var(--text); /* Theme-specific text */
      }
      .archive-table tr {
        background: var(--row-bg); /* Ensure row background matches theme */
      }
      .archive-table tr:hover {
        background: var(--row-hover); /* Theme-specific hover effect */
      }
      .archive-table a {
        color: var(--accent); /* Theme-specific link color */
        text-decoration: underline;
        font-weight: bold;
      }
      .archive-table a:hover {
        color: color-mix(in srgb, var(--accent) 80%, #ffffff); /* Brighter hover effect */
      }
  
      .auth-table td:last-child {
        text-align: left;
        padding-left: 1rem;
        color: var(--text); /* Theme-specific text */
      }
  
      .auth-table td:nth-child(1), .auth-table td:nth-child(2) {
        font-weight: bold;
        text-align: center;
        color: var(--text); /* Theme-specific text */
      }
  
      .build-output {
        background: color-mix(in srgb, var(--background) 90%, #f9e8d6); /* Theme-adjusted background */
        color: var(--text);
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        font-family: 'Courier New', Courier, monospace;
      }
  
      .loading {
        background: url('data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0RGFDRcEtEUpFExwcggHfhPDjKkwoIkFxsYgAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==') no-repeat center;
        height: 20px;
      }
  
      .due-date-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }
  
      .due-date {
        font-size: 1rem;
        color: var(--text); /* Theme-specific text */
      }
  
      .due-in {
        font-size: 1rem;
        color: var(--text);
        font-weight: bold;
      }
  
      .due-in.urgent {
        color: #d9534f;
        font-weight: bold;
      }
  
      th:nth-child(7), td:nth-child(7) {
        min-width: 120px;
      }
  
      td:nth-child(7).due-red {
        background-color: #d9534f;
        color: #fff;
      }
  
      td:nth-child(1) a {
        font-weight: bold;
        color: var(--accent); /* Theme-specific link color */
      }
  
      td:nth-child(8) {
        text-align: center;
        color: var(--text); /* Theme-specific text */
      }
  
      td:nth-child(3) a, td:nth-child(3) {
        font-weight: bold;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--accent); /* Theme-specific link color */
      }
  
      td:nth-child(4) a, td:nth-child(4) {
        font-weight: bold;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--accent); /* Theme-specific link color */
      }
  
      .mui-form {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        background: var(--secondary);
        padding: 2rem;
        border-radius: 12px;
        box-shadow: var(--shadow);
        max-width: 500px;
        margin: 0 auto;
      }
  
      .mui-form input[type="file"] {
        font-size: 1rem;
        padding: 0.5rem;
        color: var(--text); /* Theme-specific text */
      }
  
      /* Load Lobster font for cursive "Marmoset" */
      @font-face {
        font-family: 'Lobster';
        font-style: normal;
        font-weight: 400;
        src: url('https://fonts.gstatic.com/s/lobster/v28/neILzCirqoswsqX9zoKmM4MwWJU.woff2') format('woff2');
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);
    const create = (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs);
  
    const PAGES = {
      LOGIN: /target-%24%7Bview%7D%3Fproject\.jsp%3FprojectPK=/,
      COURSES: /view\/index\.jsp/,
      PROBLEMS: /view\/course\.jsp\?coursePK=/,
      SUBMISSIONS: /view\/project\.jsp\?projectPK=/,
      DETAILS: /view\/submission\.jsp\?submissionPK=/,
      SUBMISSION_PAGE: /view\/submitProject\.jsp\?projectPK=/
    };
    const currentPage = Object.keys(PAGES).find(page => PAGES[page].test(location.href)) || 'LOGIN';
  
    // Theme Management
    const themes = ['light', 'dark', 'vintage'];
    let currentTheme = localStorage.getItem('marmoUITheme') || 'light';
  
    function setTheme(theme) {
      document.body.className = theme;
      localStorage.setItem('marmoUITheme', theme);
      currentTheme = theme;
    }
  
    window.setTheme = setTheme;
  
    function applyGlobalEnhancements() {
      // Remove default Marmoset headers
      const defaultHeader = document.querySelector('.header');
      if (defaultHeader) defaultHeader.remove();
  
      // Extract the existing breadcrumb
      const defaultBreadcrumb = document.querySelector('.breadcrumb');
      let username = 'User'; 
      let breadcrumbLinks = [];
      let logoutLink = '/authenticate/Logout'; 
  
      if (defaultBreadcrumb) {
        // Extract logout link
        const logoutAnchor = defaultBreadcrumb.querySelector('a[href*="/authenticate/Logout"]');
        if (logoutAnchor) {
          logoutLink = logoutAnchor.getAttribute('href');
        }
  
        // Extract breadcrumb content
        const breadcrumbParagraphs = Array.from(defaultBreadcrumb.querySelectorAll('p'));
        const breadcrumbParagraph = breadcrumbParagraphs.find(p => !p.querySelector('a[href*="/authenticate/Logout"]'));
        
        if (breadcrumbParagraph) {
          // Extract username (text before the first ':')
          const textContent = breadcrumbParagraph.textContent.trim();
          const usernameMatch = textContent.match(/^[^:]+/);
          if (usernameMatch) {
            username = usernameMatch[0].trim();
          }
  
          // Extract all links and their titles
          const anchors = Array.from(breadcrumbParagraph.querySelectorAll('a'));
          breadcrumbLinks = anchors.map(anchor => ({
            href: anchor.getAttribute('href'),
            title: anchor.getAttribute('title') || anchor.textContent.trim(),
            text: anchor.textContent.trim()
          }));
        }
  
        // Remove the default breadcrumb after extracting info
        defaultBreadcrumb.remove();
      }
  
      // Wrap the entire body content in a wrapper div
      document.body.innerHTML = `<div class="wrapper">${document.body.innerHTML}</div>`;
  
      // Update the document title
      document.title = `MarmoUI 2.0 - ${document.title}`;
  
      // Build the dynamic breadcrumb HTML
      let breadcrumbContent = `<b>${username} >></b>`;
      breadcrumbLinks.forEach((link, index) => {
        breadcrumbContent += ` <a href="${link.href}" title="${link.title}">${link.text}</a>`;
        if (index < breadcrumbLinks.length - 1) {
          breadcrumbContent += `<span class="separator">>></span>`;
        }
      });
  
      // Add header and dynamic breadcrumbs with theme selector
      document.querySelector('.wrapper').insertAdjacentHTML('afterbegin', `
        <div class="mui-header">
          <p>Marmoset</p>
        </div>
        <div class="mui-breadcrumb">
          <div class="left">
            <p>${breadcrumbContent}</p>
            <div class="logout">
              <a href="${logoutLink}">Logout</a>
            </div>
          </div>
          <div class="theme-selector">
            <select>
              ${themes.map(theme => `<option value="${theme}" ${theme === currentTheme ? 'selected' : ''}>${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</option>`).join('')}
            </select>
          </div>
        </div>
      `);
  
      const themeSelect = document.querySelector('.theme-selector select');
      if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
          setTheme(e.target.value);
        });
      }
  
      // Update the footer if it exists
      const footer = document.querySelector('.footer');
      if (footer) footer.innerHTML = 'MarmoUI 2.0 - Built for UW CS. Derived from MarmoUI 1.0 by Shida Li and Erica Xu.';
  
      // Apply initial theme
      setTheme(currentTheme);
    }
  
    function addTableSorting(table) {
      $$('th').forEach((th, index) => {
        th.addEventListener('click', () => {
          const rows = Array.from(table.querySelectorAll('tr')).slice(1);
          const isNumeric = rows.every(row => !isNaN(row.cells[index].textContent.trim()));
          const asc = th.dataset.sort !== 'asc';
          th.dataset.sort = asc ? 'asc' : 'desc';
          rows.sort((a, b) => {
            let valA = a.cells[index].textContent.trim();
            let valB = b.cells[index].textContent.trim();
            if (isNumeric) { valA = parseFloat(valA); valB = parseFloat(valB); }
            return asc ? valA > valB ? 1 : -1 : valA < valB ? 1 : -1;
          }).forEach(row => table.appendChild(row));
        });
      });
    }
  
    function addTableHighlight(table) {
      $$('tr').forEach(tr => tr.addEventListener('click', () => {
        $$('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
      }));
    }
  
    function createSubmissionPopup(projectPK, projectName, dueDate, viewLink) {
      const overlay = create('div', { className: 'mui-overlay', onclick: () => overlay.remove() });
      const popup = create('div', {
        className: 'mui-popup',
        innerHTML: `
          <h2>${projectName}</h2>
          <p>Due: ${dueDate}</p>
          <p><a href="${viewLink}" class="mui-button">View Submissions</a></p>
          <form action="/action/SubmitProjectViaWeb" method="POST" enctype="multipart/form-data" target="submission-loader">
            <input type="hidden" name="projectPK" value="${projectPK}">
            <input type="hidden" name="submitClientTool" value="web">
            <input type="file" name="file" required>
            <button type="submit" class="mui-button">Submit</button>
          </form>
        `
      });
      document.body.append(overlay, popup);
      document.body.insertAdjacentHTML('beforeend', '<iframe id="submission-loader" name="submission-loader" style="display:none;"></iframe>');
      const iframe = $('#submission-loader');
      iframe.addEventListener('load', () => {
        const href = iframe.contentWindow.location.href;
        if (href.indexOf('marmoset.student.cs.uwaterloo') === -1 || href.indexOf('blank') === -1) {
          const form = popup.querySelector('form');
          const retries = parseInt(form.dataset.retries || '0');
          if (retries < 5) {
            form.dataset.retries = (retries + 1).toString();
            form.submit();
          } else {
            location.reload();
          }
        } else {
          setTimeout(() => location.reload(), 1000);
        }
      });
      popup.querySelector('form').addEventListener('submit', () => {
        popup.querySelector('form').dataset.retries = '0';
      });
      document.addEventListener('keydown', e => e.key === 'Escape' && overlay.remove());
    }
  
    async function asyncLoadPage(cell, url, callback, retry = 15) {
      if (retry <= 0) {
        cell.textContent = 'Failed to load';
        console.log(`Async load failed for URL: ${url} after 15 retries`);
        return;
      }
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        callback(cell, html, url);
      } catch (e) {
        cell.classList.add('loading');
        console.log(`Fetch error for ${url}: ${e.message}. Retries left: ${retry - 1}`);
        setTimeout(() => asyncLoadPage(cell, url, callback, retry - 1), 2000);
      }
    }
  
    function queueAsyncReload(cell, url, callback, countdown = 5) {
      cell.innerHTML = `Not tested (reload in <span class="update">${countdown}</span> s)`;
      if (countdown <= 0) {
        asyncLoadPage(cell, url, callback);
      } else {
        setTimeout(() => queueAsyncReload(cell, url, callback, countdown - 1), 1000);
      }
    }
  
    function applyTint(cell, text) {
      const trimmedText = text.trim().toLowerCase();
      const scoreMatch = trimmedText.match(/(\d+)\s\/\s(\d+)/);
  
      if (trimmedText === 'passed' || (scoreMatch && parseInt(scoreMatch[1]) === parseInt(scoreMatch[2]))) {
        cell.classList.add('passed');
        cell.classList.remove('failed');
      } else if (trimmedText.includes('failed') || (scoreMatch && parseInt(scoreMatch[1]) < parseInt(scoreMatch[2]))) {
        cell.classList.add('failed');
        cell.classList.remove('passed');
      }
    }
  
    function loadSubmission(cell, html, url) {
      const doc = new DOMParser().parseFromString(html.trim(), 'text/html');
      const firstRow = doc.querySelector('tr:nth-child(2)');
      if (!firstRow) {
        cell.textContent = 'No submission';
        return;
      }
      const viewAnchor = firstRow.querySelector('a[href*="view"]');
      const link = viewAnchor ? viewAnchor.getAttribute('href') : url;
      cell.innerHTML = `<a href="${link}"></a>`;
      const statusCell = firstRow.querySelector('td:nth-child(3)');
      if (!statusCell) {
        cell.querySelector('a').textContent = 'N/A';
        return;
      }
      const status = statusCell.textContent.trim();
      if (status.toLowerCase().includes('tested yet')) {
        cell.querySelector('a').innerHTML = 'Not tested (reload in <span class="update"></span> s)';
        queueAsyncReload(cell, url, loadSubmission);
      } else if (status.toLowerCase().includes('not compile')) {
        cell.querySelector('a').textContent = 'Compilation failed';
        cell.classList.add('failed');
      } else {
        let scoreText = '';
        const scoreCells = firstRow.querySelectorAll('td');
        scoreCells.forEach((td) => {
          const match = td.textContent.match(/(\d+)\s\/\s(\d+)/);
          if (match) {
            if (scoreText) scoreText += ' & ';
            scoreText += match[0];
          }
        });
        if (scoreText) {
          cell.querySelector('a').textContent = scoreText;
          applyTint(cell, scoreText);
        } else {
          cell.querySelector('a').textContent = status;
          applyTint(cell, status);
        }
      }
    }
  
    function loadSecretPrivateScores(cell, html, url) {
      const doc = new DOMParser().parseFromString(html.trim(), 'text/html');
      const firstRow = doc.querySelector('tr:nth-child(2)');
      if (!firstRow) {
        cell.textContent = 'No submission';
        return;
      }
      const submissionLink = firstRow.querySelector('a[href*="submissionPK="]');
      if (!submissionLink) {
        cell.textContent = 'N/A';
        return;
      }
      const submissionUrl = submissionLink.getAttribute('href');
      asyncLoadPage(cell, submissionUrl, (innerCell, submissionHtml) => {
        const submissionDoc = new DOMParser().parseFromString(submissionHtml.trim(), 'text/html');
        const testResults = submissionDoc.querySelector('.testResults');
        if (!testResults) {
          innerCell.textContent = 'No test results';
          return;
        }
        let secretScore = 0, secretMax = 0;
        Array.from(testResults.rows).slice(1).forEach(row => {
          const typeCell = row.cells[0];
          const outcomeCell = row.cells[2];
          const pointsCell = row.cells[3];
          if (typeCell && (typeCell.textContent.toLowerCase().includes('secret') || typeCell.textContent.toLowerCase().includes('private')) &&
              !typeCell.textContent.toLowerCase().includes('public')) {
            const points = parseInt(pointsCell.textContent.trim()) || 0;
            const outcome = outcomeCell.textContent.trim().toLowerCase();
            if (outcome === 'passed') {
              secretScore += points;
            }
            secretMax += points;
          }
        });
        if (secretMax === 0) {
          innerCell.textContent = 'N/A';
        } else {
          const scoreText = `${secretScore} / ${secretMax}`;
          innerCell.innerHTML = `<a href="${submissionUrl}">${scoreText}</a>`;
          applyTint(innerCell, scoreText);
        }
      });
    }
  
    function calculateDueIn(dueDateText) {
      try {
        const now = new Date('2025-03-08T12:00:00-05:00'); // Updated to current date
        if (!dueDateText || typeof dueDateText !== 'string' || !dueDateText.trim()) {
          return { text: '', isUrgent: false, daysRemaining: 0 };
        }
        const [datePart, timePart] = dueDateText.trim().split(', ');
        if (!datePart || !timePart) {
          return { text: '', isUrgent: false, daysRemaining: 0 };
        }
        const [day, month] = datePart.split(' ');
        const year = 2025;
        const monthMap = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const [hourMin, period] = timePart.split(' ');
        let [hour, minute] = hourMin.split(':').map(Number);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        const dueDateStr = `${year}-${monthMap[month]}-${day.padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00-05:00`;
        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
          return { text: '', isUrgent: false, daysRemaining: 0 };
        }
        if (dueDate <= now) {
          return { text: dueDateText, isUrgent: false, daysRemaining: -1 };
        }
        const diffMs = dueDate - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffHours < 24) {
          return { text: `Due in ${diffHours} hours`, isUrgent: true, daysRemaining: 0 };
        } else {
          return { text: `Due in ${diffDays} days`, isUrgent: false, daysRemaining: diffDays };
        }
      } catch (e) {
        return { text: '', isUrgent: false, daysRemaining: 0 };
      }
    }
  
    function createArchiveTable() {
      const archiveLinks = Array.from($$('p')).filter(p => p.textContent.includes('Marmoset courses from'));
      if (archiveLinks.length > 0) {
        const archiveTable = `
          <table class="archive-table">
            <thead>
              <tr><th>Archive</th><th>Link</th></tr>
            </thead>
            <tbody>
              ${archiveLinks.map(link => {
                const text = link.textContent.trim().replace('Marmoset courses from ', '');
                const href = link.querySelector('a')?.getAttribute('href') || '#';
                return `<tr><td>${text.split('https://')[0].trim()}</td><td><a href="${href}" target="_blank">${href}</a></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        `;
        archiveLinks.forEach(link => link.remove());
        $('.wrapper').insertAdjacentHTML('beforeend', archiveTable);
      }
    }
  
    function enhancePage() {
      const table = $('table');
      switch (currentPage) {
        case 'LOGIN':
          if (table) {
            table.classList.add('auth-table');
            $$('tr:not(:first-child)').forEach(row => {
              const authCell = row.cells[2];
              if (authCell && authCell.querySelector('input[type="submit"]')) {
                const button = authCell.querySelector('input[type="submit"]');
                button.classList.add('mui-button');
                button.value = 'Authenticate';
              }
              row.cells[0].style.fontWeight = 'bold';
              row.cells[0].style.textAlign = 'center';
              row.cells[1].style.fontWeight = 'bold';
              row.cells[1].style.textAlign = 'center';
            });
          }
          createArchiveTable();
          break;
  
        case 'COURSES':
          $('h2')?.remove();
          const welcomeText = Array.from($$('p')).find(p => p.textContent.includes('Welcome'));
          welcomeText?.remove();
  
          const courseList = $$('ul')[0];
          if (courseList) {
            courseList.classList.add('mui-list');
            $$('ul.mui-list li').forEach(li => {
              const link = li.querySelector('a');
              if (link) {
                const href = link.getAttribute('href');
                const text = link.textContent.replace(':', '');
                li.innerHTML = `<button class="mui-button" onclick="window.location.href='${href}'">${text}</button>`;
              }
            });
          }
  
          createArchiveTable();
          break;
  
        case 'PROBLEMS':
          $('h1')?.remove();
          $('h2')?.remove();
          $('input[type="submit"]') && ($('input[type="submit"]').value = 'Submit');
          const webTh = Array.from($$('th')).find(th => th.textContent.toLowerCase().includes('web'));
          if (webTh) webTh.textContent = 'Submit Solution';
          const headerRow = table.querySelector('tr');
          if (headerRow) {
            const ths = headerRow.querySelectorAll('th');
            if (ths.length >= 2) {
              ths[1].insertAdjacentHTML('afterend', '<th>Last Submission</th><th>Secret/Private Scores</th><th>Tokens</th>');
            }
          }
          $$('tr:not(:first-child)').forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 2) {
              tds[1].insertAdjacentHTML('afterend', '<td class="status"></td><td class="secret-scores"></td><td class="tokens"><span class="loading"></span></td>');
              const viewLink = tds[1].querySelector('a[href*="view"]')?.href;
              if (viewLink) {
                asyncLoadPage(row.querySelector('.status'), viewLink, loadSubmission);
                asyncLoadPage(row.querySelector('.secret-scores'), viewLink, loadSecretPrivateScores);
                asyncLoadPage(row.querySelector('.tokens'), viewLink, loadTokensFromSubmission);
              }
            }
            const submitLink = Array.from(row.querySelectorAll('a')).find(a => a.textContent.toLowerCase().includes('submit'));
            if (submitLink) {
              const projectPKMatch = submitLink.href.match(/projectPK=\d+/);
              if (projectPKMatch) {
                const projectPK = projectPKMatch[0].split('=')[1];
                const viewLink = row.querySelector('a[href*="view"]')?.href || '';
                submitLink.outerHTML = `<a href="${submitLink.href}" class="mui-button" onclick="event.preventDefault(); createSubmissionPopup('${projectPK}', '${row.cells[0].textContent}', '${row.cells[6].textContent}', '${viewLink}')">Submit</a>`;
              }
            }
            const dueDateCell = row.cells[6];
            if (dueDateCell && dueDateCell.textContent.trim()) {
              const dueDateText = dueDateCell.textContent.trim();
              const { text, isUrgent, daysRemaining } = calculateDueIn(dueDateText);
              if (text) {
                let shadeClass = '';
                if (isUrgent && daysRemaining === 0) shadeClass = 'due-red';
                dueDateCell.className = shadeClass;
                dueDateCell.innerHTML = `
                  <div class="due-date-wrapper">
                    <span class="due-date">${dueDateText}</span>
                    ${text.startsWith('Due in') ? `<span class="due-in ${isUrgent ? 'urgent' : ''}">${text}</span>` : ''}
                  </div>
                `;
              }
            }
          });
          addTableSorting(table);
          addTableHighlight(table);
          break;
  
        case 'DETAILS':
          $('h1')?.remove();
          $$('h2').forEach(h2 => h2.remove());
          const testTh = Array.from($$('th')).find(th => th.textContent.toLowerCase().includes('test'));
          if (testTh) testTh.textContent = 'Test';
          const pre = $('pre');
          if (pre) {
            const preText = pre.textContent;
            pre.outerHTML = `<div class="build-output"><pre>${preText}</pre></div>`;
          }
          const pointsForElements = Array.from($$('p')).filter(p => p.textContent.includes('points for'));
          pointsForElements.forEach(p => {
            const inner = p.innerHTML;
            p.outerHTML = `<h3 style="color: var(--accent); font-weight: bold;">${inner}</h3>`;
          });
          $$('tr').forEach(row => {
            const cell = row.querySelector('td:nth-child(3)');
            if (cell) {
              const cellText = cell.textContent.trim();
              applyTint(cell, cellText);
              if (cellText.toLowerCase().includes('not compile') && cell.getAttribute('colspan') > 1) {
                cell.setAttribute('colspan', '2');
                cell.insertAdjacentHTML('afterend', '<td></td>');
              }
            }
          });
          const releaseTestElement = $('h3:has(a)');
          if (releaseTestElement) {
            const link = releaseTestElement.querySelector('a').getAttribute('href');
            const submissionPKMatch = link.match(/submissionPK=(\d+)/);
            if (submissionPKMatch) {
              const submissionPK = submissionPKMatch[1];
              releaseTestElement.outerHTML = `
                <form method="POST" action="/action/RequestReleaseTest">
                  <input type="hidden" name="submissionPK" value="${submissionPK}">
                  <button type="submit" class="mui-button" onclick="return confirm('Are you sure you want to release test this?');">
                    Release Test
                  </button>
                </form>
              `;
            }
          }
          const ul = $('ul');
          if (ul) {
            ul.classList.add('mui-list');
            $$('ul.mui-list li').forEach(li => {
              const dateText = li.textContent.replace('<br>', '').trim();
              const now = new Date('2025-03-08T12:00:00-05:00'); 
              const nextToken = parseMarmosetDate(dateText) - now;
              if (nextToken > 0) {
                const hours = Math.floor(nextToken / 3600000);
                const minutes = Math.floor((nextToken % 3600000) / 60000);
                li.textContent = `${dateText} (in ${hours}h ${minutes}m)`;
              }
            });
          }
          addTableSorting(table);
          addTableHighlight(table);
          break;
  
        case 'SUBMISSIONS':
          $('h1')?.remove();
          $$('h2').forEach(h2 => h2.remove());
          $$('tr:not(:first-child)').forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 3) {
              const scoreCell = tds[2];
              const resultCell = tds[3];
              const scoreText = scoreCell.textContent.trim();
              applyTint(scoreCell, scoreText);
              if (resultCell.textContent.trim().toLowerCase().includes('view')) {
                applyTint(resultCell, scoreText);
              }
            }
            const submitLink = Array.from(row.querySelectorAll('a')).find(a => a.textContent.toLowerCase().includes('submit'));
            if (submitLink) {
              const projectPKMatch = submitLink.href.match(/projectPK=\d+/);
              if (projectPKMatch) {
                const projectPK = projectPKMatch[1];
                const viewLink = row.querySelector('a[href*="view"]')?.href || '';
                submitLink.outerHTML = `<a href="${submitLink.href}" class="mui-button" onclick="event.preventDefault(); createSubmissionPopup('${projectPK}', '${row.cells[0].textContent}', '${row.cells[6].textContent}', '${viewLink}')">Submit</a>`;
              }
            }
          });
          addTableSorting(table);
          addTableHighlight(table);
          break;
  
        case 'SUBMISSION_PAGE':
          const formTable = $('table.form');
          if (formTable) {
            const projectPKMatch = location.href.match(/projectPK=(\d+)/);
            const projectPK = projectPKMatch ? projectPKMatch[1] : '';
            formTable.outerHTML = `
              <div class="mui-form">
                <form action="/action/SubmitProjectViaWeb" method="POST" enctype="multipart/form-data" target="submission-loader">
                  <input type="hidden" name="projectPK" value="${projectPK}">
                  <input type="hidden" name="submitClientTool" value="web">
                  <input type="file" name="file" size="40" required>
                  <button type="submit" class="mui-button">Submit</button>
                </form>
              </div>
            `;
          }
          document.body.insertAdjacentHTML('beforeend', '<iframe id="submission-loader" name="submission-loader" style="display:none;"></iframe>');
          const iframe = $('#submission-loader');
          iframe.addEventListener('load', () => {
            const href = iframe.contentWindow.location.href;
            if (href.indexOf('marmoset.student.cs.uwaterloo') === -1 || href.indexOf('blank') === -1) {
              const form = $('form');
              const retries = parseInt(form.dataset.retries || '0');
              if (retries < 5) {
                form.dataset.retries = (retries + 1).toString();
                form.submit();
              } else {
                location.reload();
              }
            } else {
              setTimeout(() => location.reload(), 1000);
            }
          });
          $('form')?.addEventListener('submit', () => {
            $('form').dataset.retries = '0';
          });
          break;
      }
    }
  
    function parseMarmosetDate(date) {
      date = date.trim();
      function shortForm() {
          return Date.parse(`${new Date().getFullYear()} ${date.replace(",", "").match(/[a-zA-Z0-9 :]+/)[0].trim()}`);
      }
      function longForm() {
          return Date.parse(date.split(",")[1].match(/[a-zA-Z0-9 :]+/)[0].trim().replace(" at ", " "));
      }
      function tokenForm() {
          return Date.parse(`${new Date().getFullYear()} ${date.split(",")[1].match(/[a-zA-Z0-9 :]+/)[0].trim().replace(" at ", " ")}`);
      }
      try {
          if (date.match(/(19|20)\d{2}/)) return longForm();
          return shortForm() || tokenForm();
      } catch (err) {
          console.log(`Error parsing date "${date}": ${err.message}`);
          return false;
      }
  }
  
    function loadTokens(cell, html) {
      try {
        const tokenMatch = html.match(/You currently have (\d+) release token[s]?/) ||
                          html.match(/Release token[s]?: (\d+)/) ||
                          html.match(/tokens: (\d+)/);
        const tokens = tokenMatch ? tokenMatch[1] : null;
        if (tokens) {
          let tokenText = tokens;
          if (parseInt(tokens) < 3) {
            const tokenTimes = html.match(/<li>[a-zA-Z0-9 ,:]+<br>/g) || [];
            const nextTokenTime = tokenTimes[tokenTimes.length - 1]?.replace('<br>', '');
            if (nextTokenTime) {
              const nextToken = parseMarmosetDate(nextTokenTime) - new Date('2025-03-08T12:00:00-05:00'); // Updated to current date
              if (nextToken > 0) {
                tokenText += ` (renew in ${Math.floor(nextToken / 3600000)}h ${Math.floor((nextToken % 3600000) / 60000)}m)`;
              }
            }
          }
          cell.textContent = tokenText;
        } else {
          cell.textContent = '3';
        }
      } catch (error) {
        cell.textContent = '3';
        console.log(`Error parsing tokens: ${error.message}`);
      }
    }
  
    function loadTokensFromSubmission(cell, html) {
      try {
        const doc = new DOMParser().parseFromString(html.trim(), 'text/html');
        const rows = Array.from(doc.querySelectorAll('tr'));
        if (rows.length < 2) {
          console.log('No sufficient rows found in submission page HTML');
          cell.textContent = '3';
          return;
        }
        const validRow = rows.find(row => row.textContent && !row.textContent.toLowerCase().includes('not compile'));
        const firstRow = validRow || rows[1]; 
        if (!firstRow) {
          console.log('No valid row found after filtering');
          cell.textContent = '3';
          return;
        }
        const link = firstRow.querySelector('a[href*="view"]')?.getAttribute('href');
        if (link) {
          asyncLoadPage(cell, link, loadTokens);
        } else {
          console.log('No view link found in submission page row');
          cell.textContent = '3';
        }
      } catch (error) {
        console.log(`Error in loadTokensFromSubmission: ${error.message}`);
        cell.textContent = '3';
      }
    }
  
    applyGlobalEnhancements();
    enhancePage();
  })();