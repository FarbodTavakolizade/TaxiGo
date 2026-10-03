/**
 * Small reusable toast notification component (no library, no dependency).
 *
 * Usage from any page script:
 *   showToast('Ride requested successfully', 'success');
 *   showToast('Unable to calculate route', 'warning');
 *
 * Types: 'success' | 'error' | 'warning' | 'info'
 *
 * Server-rendered flash messages (the .flash-success / .flash-error blocks
 * that EJS prints after a redirect) are automatically converted into a
 * toast on page load, so every existing action gets a notification without
 * touching the backend.
 */
(function () {
  const ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const DEFAULT_DURATION_MS = 3500;

  /** Creates (once) and returns the container the toasts are appended to. */
  function getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      // Screen readers announce new toasts politely.
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Shows a toast message.
   * @param {string} message - text to display
   * @param {string} type    - success | error | warning | info
   * @param {object} options - { duration: ms } (0 keeps it until closed)
   */
  function showToast(message, type = 'info', options = {}) {
    const container = getContainer();
    const toastType = ICONS[type] ? type : 'info';

    const toast = document.createElement('div');
    toast.className = `toast toast-${toastType}`;

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = ICONS[toastType];

    const text = document.createElement('span');
    text.className = 'toast-message';
    // textContent keeps the message safe (no HTML injection).
    text.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Close notification');
    close.textContent = '×';

    toast.append(icon, text, close);
    container.appendChild(toast);

    let hideTimer = null;

    function hideToast() {
      if (hideTimer) clearTimeout(hideTimer);
      toast.classList.add('toast-hide');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
      // Fallback in case the animation does not fire.
      setTimeout(() => toast.remove(), 400);
    }

    close.addEventListener('click', hideToast);

    const duration = options.duration === undefined ? DEFAULT_DURATION_MS : options.duration;
    if (duration > 0) {
      hideTimer = setTimeout(hideToast, duration);
    }

    return toast;
  }

  /** Turns the server-rendered flash message into a toast (once per load). */
  function convertFlashMessages() {
    const successFlash = document.querySelector('.flash-success');
    const errorFlash = document.querySelector('.flash-error');

    if (successFlash) {
      showToast(successFlash.textContent.trim(), 'success');
      successFlash.hidden = true;
    }
    if (errorFlash) {
      showToast(errorFlash.textContent.trim(), 'error', { duration: 5000 });
      errorFlash.hidden = true;
    }
  }

  document.addEventListener('DOMContentLoaded', convertFlashMessages);

  // Exposed globally so the other page scripts can use it.
  window.showToast = showToast;
})();
