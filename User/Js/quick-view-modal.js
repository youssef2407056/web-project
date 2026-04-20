(function () {
  var qvQtyVal = 1;

  function getFavorites() {
    try {
      var raw = localStorage.getItem('noir_favorites');
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function setFavorites(ids) {
    localStorage.setItem('noir_favorites', JSON.stringify(ids));
  }

  function toggleFavoriteId(id) {
    var ids = getFavorites();
    if (ids.includes(id)) ids = ids.filter(function (x) {
      return x !== id;
    });
    else ids = ids.concat([id]);
    setFavorites(ids);
    return ids.includes(id);
  }

  function ensureModal() {
    var stale = document.getElementById('quickViewModal');
    if (stale && !document.getElementById('qvSizeBtns')) {
      stale.remove();
    }
    if (document.getElementById('quickViewModal')) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      '<div class="qv-modal qv-modal--rich" id="quickViewModal" aria-hidden="true">' +
        '<div class="qv__backdrop" aria-hidden="true"></div>' +
        '<div class="qv__panel qv__panel--wide" role="dialog" aria-modal="true" aria-labelledby="qv-title">' +
        '<button type="button" class="qv__close" aria-label="Close">✕</button>' +
        '<div class="qv__grid">' +
        '<div class="qv__col-img"><div class="qv__img-wrap"><img class="qv__img" src="" alt=""></div></div>' +
        '<div class="qv__col-info">' +
        '<h2 id="qv-title" class="qv__title"></h2>' +
        '<p class="qv__desc"></p>' +
        '<p class="qv__price"></p>' +
        '<div class="qv__field qv__size-field">' +
        '<label>Bottle size (ml)</label>' +
        '<div id="qvSizeBtns" class="size-btn-group"></div>' +
        '</div>' +
        '<div class="qv__top-actions">' +
        '<button type="button" class="qv__fav" aria-pressed="false" aria-label="Favorite"><span class="qv__fav-icon" aria-hidden="true">❤</span></button>' +
        '<div class="product-qty">' +
        '<label>Quantity</label>' +
        '<div class="qty-stepper">' +
        '<button type="button" class="qty-step-btn" id="qvQtyDec" aria-label="Decrease">−</button>' +
        '<span class="qty-step-val" id="qvQtyVal">1</span>' +
        '<button type="button" class="qty-step-btn" id="qvQtyInc" aria-label="Increase">+</button>' +
        '</div></div></div>' +
        '<div class="qv__actions">' +
        '<button type="button" class="btn-add-cart qv__add">Add to cart</button>' +
        '<button type="button" class="btn-buy qv__buy">Buy now</button>' +
        '</div>' +
        '<a class="qv__link" href="#">View full product page</a>' +
        '</div></div></div></div>'
    );

    var modal = document.getElementById('quickViewModal');
    modal.querySelector('.qv__close').addEventListener('click', close);
    modal.querySelector('.qv__backdrop').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function close() {
    var modal = document.getElementById('quickViewModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function updateQvFavButton(btn, id) {
    if (!btn || !id) return;
    var on = getFavorites().includes(id);
    btn.classList.toggle('qv__fav--active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function open(productId) {
    ensureModal();
    var p = window.noirGetProductById ? window.noirGetProductById(productId) : null;
    var modal = document.getElementById('quickViewModal');
    if (!p || !modal) return;

    qvQtyVal = 1;

    var img = modal.querySelector('.qv__img');
    var title = modal.querySelector('.qv__title');
    var desc = modal.querySelector('.qv__desc');
    var priceEl = modal.querySelector('.qv__price');
    var sizeBtnsWrap = modal.querySelector('#qvSizeBtns');
    var qtyValEl = modal.querySelector('#qvQtyVal');
    var link = modal.querySelector('.qv__link');
    var favBtn = modal.querySelector('.qv__fav');

    if (img) {
      img.src = p.image;
      img.alt = p.name;
    }
    if (title) title.textContent = p.name;
    if (desc) desc.textContent = p.description || '';
    if (qtyValEl) qtyValEl.textContent = '1';

    var opts = window.noirGetSizeOptions ? window.noirGetSizeOptions(p) : [];
    var preferred = opts.find(function (x) {
      return x.ml === p.baseMl && x.inStock !== false;
    });
    var firstInStock = opts.find(function (x) {
      return x.inStock !== false;
    });
    var selectedMl = (preferred && preferred.ml) || (firstInStock && firstInStock.ml) || (opts[0] && opts[0].ml);

    function getActiveOpt() {
      var active = sizeBtnsWrap && sizeBtnsWrap.querySelector('.size-btn--active');
      if (!active && opts[0]) return opts[0];
      if (!active) return null;
      return {
        ml: parseInt(active.getAttribute('data-ml'), 10),
        price: parseFloat(active.getAttribute('data-price')),
      };
    }

    function updatePrice() {
      var o = getActiveOpt();
      if (priceEl && o && window.noirFormatMoney) priceEl.textContent = window.noirFormatMoney(o.price, p.currency);
    }

    if (sizeBtnsWrap) {
      sizeBtnsWrap.innerHTML = '';
      opts.forEach(function (o) {
        var btn = document.createElement('button');
        var out = o.inStock === false;
        btn.type = 'button';
        btn.className = 'size-btn' + (o.ml === selectedMl ? ' size-btn--active' : '') + (out ? ' size-btn--out' : '');
        btn.setAttribute('data-ml', String(o.ml));
        btn.setAttribute('data-price', String(o.price));
        btn.textContent = o.ml + ' ml';
        btn.addEventListener('click', function () {
          sizeBtnsWrap.querySelectorAll('.size-btn').forEach(function (b) {
            b.classList.remove('size-btn--active');
          });
          btn.classList.add('size-btn--active');
          selectedMl = o.ml;
          updatePrice();
          refreshActionState();
        });
        sizeBtnsWrap.appendChild(btn);
      });
    }
    updatePrice();

    var decBtn = modal.querySelector('#qvQtyDec');
    var incBtn = modal.querySelector('#qvQtyInc');
    if (decBtn) {
      decBtn.onclick = function () {
        if (qvQtyVal > 1) {
          qvQtyVal--;
          if (qtyValEl) qtyValEl.textContent = String(qvQtyVal);
        }
      };
    }
    if (incBtn) {
      incBtn.onclick = function () {
        if (qvQtyVal < 99) {
          qvQtyVal++;
          if (qtyValEl) qtyValEl.textContent = String(qvQtyVal);
        }
      };
    }

    function readQty() {
      return qvQtyVal;
    }

    if (link) link.href = window.noirProductUrl ? window.noirProductUrl(p) : 'product.html?id=' + encodeURIComponent(productId);

    updateQvFavButton(favBtn, productId);
    favBtn.onclick = function (e) {
      e.preventDefault();
      var on = toggleFavoriteId(productId);
      favBtn.classList.toggle('qv__fav--active', on);
      favBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      document.querySelectorAll('[data-product-id] .product__fav').forEach(function (b) {
        var card = b.closest('[data-product-id]');
        if (card && card.getAttribute('data-product-id') === productId) {
          b.classList.toggle('product__fav--active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        }
      });
      if (window.noirRefreshFavoritesDrawer) window.noirRefreshFavoritesDrawer();
    };

    var addBtn = modal.querySelector('.qv__add');
    var buyBtn = modal.querySelector('.qv__buy');
    var hasInStockSize = opts.some(function (x) {
      return x.inStock !== false;
    });
    var isOutOfStock = p.inStock === false || !hasInStockSize;
    function selectedSizeOutOfStock() {
      var o = getActiveOpt();
      if (!o) return true;
      return window.noirIsSizeInStock ? !window.noirIsSizeInStock(p, o.ml) : false;
    }
    function refreshActionState() {
      var blocked = isOutOfStock || selectedSizeOutOfStock();
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.textContent = blocked ? 'Out of Stock' : 'Add to cart';
        addBtn.classList.toggle('btn-add-cart--out', blocked);
      }
      if (decBtn) decBtn.disabled = false;
      if (incBtn) incBtn.disabled = false;
    }
    if (addBtn) {
      refreshActionState();
    }
    if (buyBtn) {
      buyBtn.disabled = isOutOfStock;
      buyBtn.style.display = isOutOfStock ? 'none' : '';
    }
    addBtn.onclick = function () {
      if (isOutOfStock || selectedSizeOutOfStock()) return;
      var o = getActiveOpt();
      if (!o || (window.noirIsSizeInStock && !window.noirIsSizeInStock(p, o.ml))) return;
      if (!o) return;
      var q = Math.max(1, readQty());
      if (window.addToCart) {
        var added = window.addToCart(p.name, o.price, p.image, String(o.ml), p.id, { currency: p.currency || 'LE', qty: q });
        if (added && window.toggleCart) window.toggleCart();
      }
    };
    buyBtn.onclick = function () {
      if (isOutOfStock) return;
      var o = getActiveOpt();
      if (!o || (window.noirIsSizeInStock && !window.noirIsSizeInStock(p, o.ml))) return;
      if (!o) return;
      var q = Math.max(1, readQty());
      if (window.addToCart) {
        var added = window.addToCart(p.name, o.price, p.image, String(o.ml), p.id, { currency: p.currency || 'LE', qty: q });
        if (added) window.location.href = window.noirHtmlPage ? window.noirHtmlPage('checkout.html') : 'checkout.html';
      }
    };

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  window.noirOpenQuickView = open;
  window.noirCloseQuickView = close;
  document.addEventListener('DOMContentLoaded', ensureModal);
})();
