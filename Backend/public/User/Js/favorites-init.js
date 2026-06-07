/* Wire favorites trigger only — drawer opens on heart icon click (via shop.js). */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.wireFavoritesTriggers === 'function') {
    window.wireFavoritesTriggers();
  }
});
