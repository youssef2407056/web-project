(function () {
  function getIds() {
    try {
      var raw = localStorage.getItem('noir_favorites');
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function setIds(ids) {
    localStorage.setItem('noir_favorites', JSON.stringify(ids));
  }

  function render() {
    var root = document.getElementById('favList');
    if (!root) return;

    var ids = getIds();
    if (ids.length === 0) {
      root.innerHTML = '<p style="padding:2rem;text-align:center;color:#888">No favorites yet.</p>';
      return;
    }

    root.innerHTML = '';
    ids.forEach(function (id) {
      var p = window.noirGetProductById ? window.noirGetProductById(id) : null;
      if (!p) return;
      var row = document.createElement('div');
      row.className = 'fav-row';
      var url = window.noirProductUrl ? window.noirProductUrl(p) : 'product.html?id=' + encodeURIComponent(id);
      var img = window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : p.image;
      row.innerHTML =
        '<img src="' +
        img.replace(/"/g, '&quot;') +
        '" alt="" onerror="this.onerror=null;this.src=\'../Images/image.webp\'">' +
        '<a href="' +
        url +
        '">' +
        p.name.replace(/</g, '&lt;') +
        '</a>' +
        '<button type="button" aria-label="Remove" data-fav-remove="' +
        id.replace(/"/g, '') +
        '">✕</button>';
      root.appendChild(row);
    });

    root.querySelectorAll('[data-fav-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-fav-remove');
        setIds(getIds().filter(function (x) {
          return x !== id;
        }));
        render();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', render);
})();
