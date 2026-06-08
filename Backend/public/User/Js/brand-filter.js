/**
 * Run after shop.js wires data-product-id. Removes cards that don't match body[data-brand].
 * Values: chanel | dior
 */
(function () {
  function isChanel(p) {
    if (!p) return false;
    var n = (p.name || '').toLowerCase();
    var img = (p.image || '').toLowerCase();
    return n.indexOf('chanel') !== -1 || img.indexOf('chanel') !== -1 || img.indexOf('channel') !== -1;
  }

  function isDior(p) {
    if (!p) return false;
    var n = (p.name || '').toLowerCase();
    var img = (p.image || '').toLowerCase();
    if (n.indexOf('dior') !== -1) return true;
    if (img.indexOf('dior') !== -1 || img.indexOf('doir') !== -1 || img.indexOf('diorevaa') !== -1) return true;
    if (img.indexOf('luky.unisex') !== -1) return true;
    return false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mode = (document.body.getAttribute('data-brand') || '').toLowerCase();
    if (mode !== 'chanel' && mode !== 'dior') return;

    document.querySelectorAll('.products-area .products-grid .card').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      var p = id && window.noirGetProductById ? window.noirGetProductById(id) : null;
      var keep = mode === 'chanel' ? isChanel(p) : isDior(p);
      if (!keep) card.remove();
    });

    var rc = document.getElementById('resultsCount');
    if (rc) {
      var n = document.querySelectorAll('.products-area .products-grid .card').length;
      rc.textContent = n + ' product' + (n !== 1 ? 's' : '') + ' found';
    }
  });
})();
