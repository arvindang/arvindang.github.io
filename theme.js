(function () {
  'use strict';

  const key = 'arv-in-theme';
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll('.theme-toggle')];
  const browserColors = [...document.querySelectorAll('meta[name="theme-color"]')];
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const validTheme = value => value === 'light' || value === 'dark' ? value : null;
  let storage = null;
  let preference = null;

  // Storage can be unavailable in private browsing or a direct file preview.
  try {
    storage = window.localStorage;
    preference = validTheme(storage.getItem(key));
  } catch (_) {
    storage = null;
  }

  function applyTheme() {
    const theme = preference || (system.matches ? 'dark' : 'light');
    const action = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    root.setAttribute('data-theme', theme);
    for (const button of buttons) {
      button.setAttribute('aria-label', action);
      button.setAttribute('title', action);
    }
    for (const meta of browserColors) {
      meta.setAttribute('content', theme === 'dark' ? '#211d29' : '#e9e4f3');
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      preference = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try {
        if (storage) storage.setItem(key, preference);
      } catch (_) {
        // Keep the choice for this page even when it cannot be saved.
        storage = null;
      }
      applyTheme();
    });
  }

  system.addEventListener('change', () => {
    if (!preference) applyTheme();
  });
  window.addEventListener('storage', event => {
    if (storage && event.storageArea === storage && (event.key === key || event.key === null)) {
      preference = validTheme(event.newValue);
      applyTheme();
    }
  });
  window.addEventListener('pageshow', () => {
    try {
      if (storage) preference = validTheme(storage.getItem(key));
    } catch (_) {
      storage = null;
    }
    applyTheme();
  });

  applyTheme();
  // The native CSS appearance still follows the OS if scripts are blocked.
  for (const button of buttons) button.hidden = false;
})();
