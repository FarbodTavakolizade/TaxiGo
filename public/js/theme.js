/**
 * Light / Dark theme toggle (frontend only, no backend involved).
 *
 * Flow:
 *   page load  -> read the saved theme from localStorage
 *              -> apply it (the inline script in the page head already did
 *                 this before the first paint to avoid a light "flash")
 *   click      -> switch theme, update the button label, save the choice
 *
 * The theme is applied by setting data-theme="dark" on <html>; the CSS
 * variables in style.css do the rest. The map (Leaflet) is restyled by
 * pure CSS as well, so no map code needs to change.
 */
(function () {
  const STORAGE_KEY = 'taxigo-theme';

  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-toggle-icon');
  const label = document.getElementById('theme-toggle-label');

  /** Reads the saved theme; anything unknown means light. */
  function readSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch (err) {
      // localStorage can be unavailable (private mode, blocked cookies).
      return 'light';
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // Not being able to save is not fatal: the theme still applies now.
    }
  }

  /** Applies a theme to the document and updates the toggle button. */
  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    // The button shows the theme you switch TO.
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute(
        'title',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  // 1 + 2. Read the saved theme and apply it on page load.
  applyTheme(readSavedTheme());

  // 3 + 4. Change the theme on click and save the new choice.
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next =
        root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }
})();
