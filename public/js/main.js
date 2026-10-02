// Small Vanilla JavaScript helpers for the GUI.

// Ask for confirmation on buttons/links marked with data-confirm,
// for example when cancelling a ride.
document.addEventListener('click', (event) => {
  const element = event.target.closest('[data-confirm]');
  if (!element) return;
  if (!window.confirm(element.getAttribute('data-confirm'))) {
    event.preventDefault();
  }
});
