/**
 * MarmoUI — legacy skin: the ORIGINAL MarmoUI 2.0 stylesheet, extracted
 * verbatim from the GitHub content.js (commit 5d24ac0). Deliberately
 * untouched — including its quirks — per "keep the OG UI, fix only the
 * non-CSS errors". Injected by legacy/legacy.js only in legacy mode,
 * after the manifest stylesheet, so its rules win any name collisions.
 */
(() => {
  'use strict';
  const MUI = (globalThis.MarmoUI ??= {});
  MUI.legacyCss = `
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
        --button-text-hover-light: #ffffff;
        --row-bg-light: var(--background-light);
        --row-hover-light: color-mix(in srgb, var(--background-light) 90%, #ffffff);
        --row-selected-light: #e0e7ff;
  
        /* Dark Theme (VS Code Dark+) */
        --primary-dark: #569cd6;
        --secondary-dark: #4ec9b0;
        --accent-dark: #ce9178;
        --background-dark: #1e1e1e;
        --text-dark: #d4d4d4;
        --success-dark: rgba(115, 201, 144, 0.2);
        --error-dark: rgba(240, 71, 71, 0.2);
        --shadow-dark: 0 4px 12px rgba(0, 0, 0, 0.5);
        --button-bg-dark: #2d2d2d;
        --button-hover-dark: #3d3d3d;
        --row-bg-dark: #252526;
        --row-hover-dark: #2a2d2e;
        --row-alt-bg-dark: #1f1f1f;
        --link-dark: #4ec9b0;
        --header-text-dark: #569cd6;
        --due-date-dark: #dcdcaa;
        --no-submission-dark: #9cdcfe;
        --table-header-bg-dark: #252526;
        --table-border-dark: #404040;
  
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
        --button-text-hover-vintage: #000000;
        --row-bg-vintage: color-mix(in srgb, var(--secondary-vintage) 90%, #ffffff);
        --row-hover-vintage: var(--button-hover-vintage);
        --row-selected-vintage: #2c5b84;
  
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
  
      body.dark .mui-header p {
        color: var(--header-text-dark);
        text-shadow: 0 0 10px rgba(86, 156, 214, 0.4);
      }
  
      body.dark td a {
        color: var(--link-dark);
      }
  
      body.dark .due-date,
      body.dark .due-in:not(.urgent) {
        color: var(--due-date-dark);
      }
  
      body.dark td:contains('No submission') {
        color: var(--no-submission-dark);
      }
  
      body.dark th {
        background: var(--table-header-bg-dark);
        color: var(--text-dark);
        border-bottom: 1px solid var(--table-border-dark);
        font-weight: 600;
      }
  
      body.dark th:hover {
        background: var(--button-hover-dark);
      }
  
      body.dark table {
        border: 1px solid var(--table-border-dark);
        background: var(--row-bg-dark);
      }
  
      body.dark tr {
        border-bottom: 1px solid var(--table-border-dark);
        background: var(--row-bg-dark);
      }
  
      body.dark tr:nth-child(even) {
        background: var(--row-alt-bg-dark);
      }
  
      body.dark tr:hover {
        background: var(--row-hover-dark);
      }
  
      body.dark td {
        color: var(--text-dark);
      }
  
      body.dark .passed {
        color: #89d185;
        background: var(--success-dark);
      }
  
      body.dark .failed {
        color: #f14c4c;
        background: var(--error-dark);
      }
  
      body.dark td a {
        color: var(--link-dark);
      }
  
      body.dark td[class*="lab"] {
        color: var(--link-dark);
      }
  
      body.dark td[class*="lab"] a {
        color: var(--link-dark);
      }
  
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
        background: var(--row-selected-light);
      }
  
      body.dark tr.selected {
        background: var(--accent);
      }
  
      body.vintage tr.selected {
        background: var(--row-selected-vintage);
        color: #ffffff;
      }
  
      body.vintage tr.selected td,
      body.vintage tr.selected td a,
      body.vintage tr.selected td[class*="lab"],
      body.vintage tr.selected td[class*="lab"] a {
        color: #ffffff;
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
        transition: all 0.2s ease;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        width: auto;
        text-align: center;
      }
  
      .mui-button:hover {
        background: var(--button-hover);
      }
  
      body.light .mui-button:hover {
        color: var(--button-text-hover-light);
      }
  
      body.vintage .mui-button:hover {
        color: var(--button-text-hover-vintage);
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
})();
