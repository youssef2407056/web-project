(function () {
  var CART_KEY = 'noir_cart';

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      var changed = false;
      var normalized = data
        .map(function (item) {
          if (!item || typeof item !== 'object') return null;
          var out = Object.assign({}, item);
          if (out.productId && window.noirGetProductById) {
            var p = window.noirGetProductById(out.productId);
            if (!p) return null;
            out.name = p.name;
            if (!out.currency) out.currency = p.currency || 'LE';
            if (window.noirResolveProductImage) out.image = window.noirResolveProductImage(p, out.image || p.image || '');
          } else if (window.noirResolveProductImage) {
            out.image = window.noirResolveProductImage(null, out.image || '');
          }
          if (!out.qty || out.qty < 1) out.qty = 1;
          return out;
        })
        .filter(Boolean);
      if (normalized.length !== data.length) changed = true;
      if (!changed) {
        for (var i = 0; i < normalized.length; i++) {
          if (JSON.stringify(normalized[i]) !== JSON.stringify(data[i])) {
            changed = true;
            break;
          }
        }
      }
      if (changed) localStorage.setItem(CART_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart();
    updateCartCount();
  }

  function lineKey(item) {
    return (item.productId || item.name) + '|' + String(item.sizeMl);
  }

  function updateCartCount() {
    var items = getCart();
    var n = items.reduce(function (a, x) {
      return a + (x.qty || 1);
    }, 0);
    document.querySelectorAll('#cart-count').forEach(function (el) {
      el.textContent = String(n);
    });
  }

  function formatLinePrice(item) {
    var sym = item.currency || 'LE';
    if (window.noirFormatMoney) return window.noirFormatMoney(item.price * (item.qty || 1), sym);
    return sym + (item.price * (item.qty || 1)).toFixed(2);
  }

  function resolveImageForLine(item) {
    if (window.noirResolveProductImage) {
      return window.noirResolveProductImage(item.productId || null, item.image || '');
    }
    return item.image || '';
  }

  function renderCart() {
    var container = document.getElementById('cart-items');
    var footer = document.getElementById('cart-footer');
    if (!container) return;

    var items = getCart();
    if (items.length === 0) {
      container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
      if (footer) footer.style.display = 'none';
      return;
    }

    var totals = {};
    items.forEach(function (item) {
      var sym = item.currency || 'LE';
      totals[sym] = (totals[sym] || 0) + item.price * (item.qty || 1);
    });

    container.innerHTML = '';
    items.forEach(function (item, index) {
      var div = document.createElement('div');
      div.className = 'cart-item';
      var imgSrc = resolveImageForLine(item);
      var thumb = imgSrc
        ? '<img class="cart-item__thumb" src="' +
          imgSrc.replace(/"/g, '&quot;') +
          '" alt="" onerror="this.onerror=null;this.src=\'../Images/image.webp\'">'
        : '<div class="cart-item__thumb cart-item__thumb--placeholder" aria-hidden="true"></div>';
      div.innerHTML =
        thumb +
        '<div class="cart-item__body">' +
        '<div class="item-info">' +
        '<div class="item-text">' +
        '<span class="item-name">' +
        escapeHtml(item.name) +
        '</span>' +
        '<span class="item-size">' +
        (item.sizeMl === '—' ? 'One size' : escapeHtml(String(item.sizeMl)) + ' ml') +
        '</span>' +
        '</div>' +
        '<span class="item-price">' +
        formatLinePrice(item) +
        '</span>' +
        '</div>' +
        '<div class="item-controls">' +
        '<button type="button" class="qty-btn" data-cart-dec="' +
        index +
        '" aria-label="Decrease quantity">−</button>' +
        '<span class="qty-num">' +
        (item.qty || 1) +
        '</span>' +
        '<button type="button" class="qty-btn" data-cart-inc="' +
        index +
        '" aria-label="Increase quantity">+</button>' +
        '<button type="button" class="remove-btn" data-cart-remove="' +
        index +
        '" aria-label="Remove">🗑</button>' +
        '</div></div>';
      container.appendChild(div);
    });

    container.querySelectorAll('[data-cart-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-cart-remove'), 10);
        var next = getCart();
        next.splice(i, 1);
        saveCart(next);
      });
    });
    container.querySelectorAll('[data-cart-inc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-cart-inc'), 10);
        var next = getCart();
        if (next[i]) next[i].qty = (next[i].qty || 1) + 1;
        saveCart(next);
      });
    });
    container.querySelectorAll('[data-cart-dec]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-cart-dec'), 10);
        var next = getCart();
        if (!next[i]) return;
        next[i].qty = (next[i].qty || 1) - 1;
        if (next[i].qty < 1) next.splice(i, 1);
        saveCart(next);
      });
    });

    if (footer) {
      footer.style.display = 'block';
      var totalEl = document.getElementById('cart-total');
      if (totalEl) {
        var parts = Object.keys(totals).map(function (sym) {
          if (window.noirFormatMoney) return window.noirFormatMoney(totals[sym], sym);
          return sym + totals[sym].toFixed(2);
        });
        totalEl.textContent = parts.join(' · ');
      }
      var checkoutBtn = footer.querySelector('.checkout-btn');
      if (checkoutBtn && !checkoutBtn.dataset.bound) {
        checkoutBtn.dataset.bound = '1';
        checkoutBtn.addEventListener('click', function () {
          if (getCart().length === 0) return;
          window.location.href = window.noirHtmlPage ? window.noirHtmlPage('checkout.html') : 'checkout.html';
        });
      }
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * addToCart(name, price, image?, sizeMl?, productId?, options?: { currency })
   * Legacy: addToCart(name, price) — image optional.
   */
  function addToCart(name, price, image, sizeMl, productId, options) {
    if (typeof image === 'object' && image !== null && !Array.isArray(image)) {
      options = image;
      image = undefined;
    }
    options = options || {};
    var currency = options.currency || 'LE';
    var addQty = options.qty != null ? Math.max(1, parseInt(String(options.qty), 10) || 1) : 1;
    var img = image || '';
    var ml = sizeMl != null && sizeMl !== '' ? String(sizeMl) : '—';
    var pid = productId || null;
    if (pid && window.noirGetProductById) {
      var product = window.noirGetProductById(pid);
      if (product && product.inStock === false) return false;
      if (product && window.noirIsSizeInStock && ml !== '—' && !window.noirIsSizeInStock(product, ml)) return false;
      if (product) {
        name = product.name;
        currency = product.currency || currency;
        if (window.noirResolveProductImage) img = window.noirResolveProductImage(product, product.image || img);
      }
    }
    if (!pid && window.noirResolveProductImage) img = window.noirResolveProductImage(null, img);

    var items = getCart();
    var incoming = { name: name, price: Number(price), image: img, sizeMl: ml, productId: pid, qty: addQty, currency: currency };
    var key = lineKey(incoming);
    var found = items.findIndex(function (x) {
      return lineKey(x) === key;
    });
    if (found >= 0) items[found].qty = (items[found].qty || 1) + addQty;
    else items.push(incoming);
    saveCart(items);
    return true;
  }

  function wireShopProductLinks() {
    if (!window.noirGetShopIndexForImage) return;
    document.querySelectorAll('.products-area .products-grid .card').forEach(function (card) {
      var imgEl = card.querySelector('.image img');
      if (!imgEl) return;
      var src = imgEl.getAttribute('src') || '';
      var file = src.split('/').pop().split('?')[0];
      var idx = window.noirGetShopIndexForImage(file);
      if (idx == null) return;
      card.setAttribute('data-shop-index', String(idx));
      var pid = 'shop-' + idx;
      card.setAttribute('data-product-id', pid);
      var h3 = card.querySelector('h3');
      if (h3 && !h3.querySelector('a')) {
        h3.innerHTML = '<a href="' + (window.noirHtmlPage ? window.noirHtmlPage('product.html?shop=' + idx) : 'product.html?shop=' + idx) + '">' + h3.textContent.trim() + '</a>';
      }
      // Fix 9: also make the image clickable
      var imgWrap = card.querySelector('.image');
      if (imgWrap && !imgWrap.querySelector('a')) {
        var imgLink = document.createElement('a');
        imgLink.href = window.noirHtmlPage ? window.noirHtmlPage('product.html?shop=' + idx) : 'product.html?shop=' + idx;
        imgEl.parentNode.insertBefore(imgLink, imgEl);
        imgLink.appendChild(imgEl);
      }
    });
  }

  function noirAddFromShopCard(button) {
    var card = button && button.closest ? button.closest('.card') : null;
    if (!card) return;
    var pid = card.getAttribute('data-product-id') || null;
    if (pid && window.noirGetProductById) {
      var p = window.noirGetProductById(pid);
      if (p) {
        if (p.inStock === false) return;
        var pick = window.noirPickInStockSizeOption ? window.noirPickInStockSizeOption(p) : null;
        if (pick) {
          var added = addToCart(p.name, pick.price, p.image, String(pick.ml), pid, { currency: p.currency || 'LE' });
          if (added && window.toggleCart) window.toggleCart();
          return;
        }
        if (p.sizes && p.sizes.length > 0) return;
      }
    }
    var imgEl = card.querySelector('.image img');
    var img = imgEl ? imgEl.getAttribute('src') : '';
    var name =
      (card.querySelector('h3 a') && card.querySelector('h3 a').textContent.trim()) ||
      (card.querySelector('h3') && card.querySelector('h3').textContent.trim()) ||
      'Product';
    var priceText = (card.querySelector('.price') && card.querySelector('.price').textContent) || '0';
    var price = parseFloat(priceText.replace(/[^0-9.-]/g, '')) || 0;
    var sub = (card.querySelector('p') && card.querySelector('p').textContent) || '';
    var m = sub.match(/(\d+)\s*ML/i);
    var ml = m ? m[1] : '—';
    var added = addToCart(name, price, img, ml, pid, { currency: 'LE' });
    if (added && window.toggleCart) window.toggleCart();
  }

  function getFavoriteIds() {
    try {
      var a = JSON.parse(localStorage.getItem('noir_favorites') || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function setFavoriteIds(ids) {
    localStorage.setItem('noir_favorites', JSON.stringify(ids));
  }

  function noirIsFavoriteId(id) {
    if (id == null || id === '') return false;
    return getFavoriteIds().indexOf(String(id)) !== -1;
  }

  function noirToggleFavoriteId(id) {
    if (id == null || id === '') return false;
    id = String(id);
    var ids = getFavoriteIds();
    var was = ids.indexOf(id) !== -1;
    if (was) setFavoriteIds(ids.filter(function (x) { return x !== id; }));
    else setFavoriteIds(ids.concat([id]));
    var fs = document.getElementById('favorites-sidebar');
    if (fs && fs.classList.contains('open')) renderFavoritesDrawer();
    return !was;
  }

  function injectFavoritesDrawer() {
    if (document.getElementById('favorites-sidebar')) return;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div class="cart-overlay" id="favorites-overlay"></div>' +
        '<aside class="cart-sidebar" id="favorites-sidebar" aria-label="Favorites">' +
        '<div class="cart-header"><h2>Favorites</h2><button type="button" class="close-btn" id="fav-drawer-close" aria-label="Close favorites">✕</button></div>' +
        '<div class="cart-items" id="favorites-items"><p class="empty-msg">No favorites yet.</p></div>' +
        '</aside>'
    );
    document.getElementById('favorites-overlay').addEventListener('click', toggleFavorites);
    document.getElementById('fav-drawer-close').addEventListener('click', toggleFavorites);
  }

  function renderFavoritesDrawer() {
    injectFavoritesDrawer();
    var container = document.getElementById('favorites-items');
    if (!container) return;
    var ids = getFavoriteIds();
    if (ids.length === 0) {
      container.innerHTML = '<p class="empty-msg">No favorites yet.</p>';
      return;
    }
    container.innerHTML = '';
    ids.forEach(function (id) {
      var p = window.noirGetProductById ? window.noirGetProductById(id) : null;
      if (!p) return;
      var url = window.noirProductUrl ? window.noirProductUrl(p) : '#';
      var div = document.createElement('div');
      div.className = 'cart-item fav-drawer-item';
      var opts = window.noirGetSizeOptions ? window.noirGetSizeOptions(p) : [];
      var baseOpt = opts.find(function(x){ return x.ml === p.baseMl; }) || opts[0];
      var priceStr = (baseOpt && window.noirFormatMoney) ? window.noirFormatMoney(baseOpt.price, p.currency || 'LE') : '';
      var canBuy = window.noirProductHasInStockSize ? window.noirProductHasInStockSize(p) : p.inStock !== false;
      div.innerHTML =
        '<img class="cart-item__thumb" src="' +
        String(window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : p.image).replace(/"/g, '&quot;') +
        '" alt="" onerror="this.onerror=null;this.src=\'../Images/image.webp\'">' +
        '<div class="cart-item__body" style="flex:1;min-width:0">' +
        '<div class="item-info">' +
        '<div class="item-text">' +
        '<a class="item-name" href="' + url + '" style="text-decoration:none;color:inherit;font-weight:500;display:block">' +
        escapeHtml(p.name) + '</a>' +
        (priceStr ? '<span class="item-price fav-price">' + priceStr + '</span>' : '') +
        '</div>' +
        '<button type="button" class="remove-btn" data-fav-remove="' + escapeHtml(id) + '" aria-label="Remove">✕</button>' +
        '</div>' +
        '<button type="button" class="btn-fav-add-cart' +
        (!canBuy ? ' btn-fav-add-cart--out' : '') +
        '" data-fav-cart="' +
        escapeHtml(id) +
        '">' +
        (!canBuy ? 'Out of Stock' : 'Add to cart') +
        '</button>' +
        '</div>';
      container.appendChild(div);
    });
    container.querySelectorAll('[data-fav-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var rid = btn.getAttribute('data-fav-remove');
        setFavoriteIds(
          getFavoriteIds().filter(function (x) {
            return x !== rid;
          })
        );
        document.querySelectorAll('[data-product-id] .product__fav').forEach(function (heart) {
          var c = heart.closest('[data-product-id]');
          if (c && c.getAttribute('data-product-id') === rid) {
            heart.classList.remove('product__fav--active');
            heart.setAttribute('aria-pressed', 'false');
          }
        });
        renderFavoritesDrawer();
      });
    });

    container.querySelectorAll('[data-fav-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = btn.getAttribute('data-fav-cart');
        var prod = window.noirGetProductById ? window.noirGetProductById(pid) : null;
        if (!prod) return;
        var pick2 = window.noirPickInStockSizeOption ? window.noirPickInStockSizeOption(prod) : null;
        if (!pick2) return;
        var added = addToCart(prod.name, pick2.price, prod.image, String(pick2.ml), prod.id, { currency: prod.currency || 'LE' });
        if (!added) {
          btn.textContent = 'Out of Stock';
          btn.classList.add('btn-fav-add-cart--out');
          return;
        }
        btn.textContent = 'Added ✓';
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = 'Add to cart';
          btn.disabled = false;
          btn.classList.remove('btn-fav-add-cart--out');
        }, 1500);
      });
    });
  }

  function toggleFavorites() {
    injectFavoritesDrawer();
    var sidebar = document.getElementById('favorites-sidebar');
    var overlay = document.getElementById('favorites-overlay');
    if (!sidebar || !overlay) return;
    var opening = !sidebar.classList.contains('open');
    if (opening) {
      var cs = document.getElementById('cart-sidebar');
      var co = document.getElementById('cart-overlay');
      if (cs) cs.classList.remove('open');
      if (co) co.classList.remove('open');
      renderFavoritesDrawer();
    }
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  }

  function toggleCart() {
    var sidebar = document.getElementById('cart-sidebar');
    var overlay = document.getElementById('cart-overlay');
    if (!sidebar || !overlay) return;
    var opening = !sidebar.classList.contains('open');
    if (opening) {
      var fs = document.getElementById('favorites-sidebar');
      var fo = document.getElementById('favorites-overlay');
      if (fs) fs.classList.remove('open');
      if (fo) fo.classList.remove('open');
    }
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  }

  function syncShopCardPricesLE() {
    if (!window.noirGetProductById || !window.noirFormatMoney) return;
    document.querySelectorAll('.card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      var p = window.noirGetProductById(id);
      var prEl = card.querySelector('.price');
      if (!p || !prEl || !p.sizes || p.sizes.length === 0) return;
      var base =
        p.sizes.find(function (s) {
          return s.ml === p.baseMl;
        }) || p.sizes[p.sizes.length - 1];
      prEl.textContent = window.noirFormatMoney(base.price, p.currency || 'LE');
    });
  }

  function syncShopCardSizeLine() {
    if (!window.noirGetProductById) return;
    document.querySelectorAll('.card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      var p = window.noirGetProductById(id);
      var sub = card.querySelector('p');
      if (!p || !sub) return;
      var first = (p.line || p.description || '').split('.')[0].trim();
      sub.textContent = first ? first + ' · 30 / 50 / 100 ml' : 'Eau de Parfum · 30 / 50 / 100 ml';

      var addBtn = card.querySelector('button');
      if (addBtn) {
        var out = window.noirProductHasInStockSize ? !window.noirProductHasInStockSize(p) : p.inStock === false;
        addBtn.disabled = false;
        addBtn.textContent = out ? 'Out of Stock' : 'Add to Cart';
        addBtn.classList.toggle('btn-add-cart--out', out);
      }
    });
  }

  function wrapShopCardMedia() {
    document.querySelectorAll('.products-area .products-grid .card').forEach(function (card) {
      var imgWrap = card.querySelector('.image');
      if (!imgWrap || imgWrap.closest('.card__media')) return;
      var media = document.createElement('div');
      media.className = 'card__media';
      imgWrap.parentNode.insertBefore(media, imgWrap);
      media.appendChild(imgWrap);
      var tools = document.createElement('div');
      tools.className = 'product__card-tools';
      tools.innerHTML =
        '<button type="button" class="product__qv" aria-label="Quick view">+</button>' +
        '<button type="button" class="product__fav" aria-pressed="false" aria-label="Add to favorites"><span class="product__fav-icon" aria-hidden="true">❤</span></button>';
      media.appendChild(tools);
    });
  }

  function initShopCardTools() {
    document.querySelectorAll('.card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      if (!id) return;
      var fv = card.querySelector('.product__fav');
      var qv = card.querySelector('.product__qv');
      if (fv && !fv.dataset.boundTools) {
        fv.dataset.boundTools = '1';
        var onF = getFavoriteIds().indexOf(id) !== -1;
        fv.classList.toggle('product__fav--active', onF);
        fv.setAttribute('aria-pressed', onF ? 'true' : 'false');
        fv.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var ids = getFavoriteIds();
          var was = ids.indexOf(id) !== -1;
          if (was) setFavoriteIds(ids.filter(function (x) {
            return x !== id;
          }));
          else setFavoriteIds(ids.concat([id]));
          fv.classList.toggle('product__fav--active', !was);
          fv.setAttribute('aria-pressed', !was ? 'true' : 'false');
          if (document.getElementById('favorites-sidebar') && document.getElementById('favorites-sidebar').classList.contains('open')) {
            renderFavoritesDrawer();
          }
        });
      }
      if (qv && !qv.dataset.boundTools) {
        qv.dataset.boundTools = '1';
        qv.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (window.noirOpenQuickView) window.noirOpenQuickView(id);
        });
      }
    });
  }

  function wireFavoritesTriggers() {
    injectFavoritesDrawer();
    document.querySelectorAll('#fav-drawer-trigger').forEach(function (el) {
      if (el.dataset.favBound) return;
      el.dataset.favBound = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        toggleFavorites();
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFavorites();
        }
      });
    });
  }

  window.addToCart = addToCart;
  window.noirIsFavoriteId = noirIsFavoriteId;
  window.noirToggleFavoriteId = noirToggleFavoriteId;
  window.noirAddFromShopCard = noirAddFromShopCard;
  window.toggleCart = toggleCart;
  window.toggleFavorites = toggleFavorites;
  window.noirGetCart = getCart;
  window.noirSaveCart = saveCart;
  window.noirRefreshFavoritesDrawer = function () {
    var s = document.getElementById('favorites-sidebar');
    if (s && s.classList.contains('open')) renderFavoritesDrawer();
  };

  function syncShopGridWithCatalog() {
    var kind = (document.body && document.body.getAttribute('data-shop-kind')) || '';
    if (!kind || !window.noirGetProductsForShopPage) return;
    var grid = document.querySelector('.products-area .products-grid');
    if (!grid) return;

    var products = window.noirGetProductsForShopPage(kind);
    var allowedIds = {};
    products.forEach(function (p) {
      allowedIds[p.id] = true;
    });
    grid.querySelectorAll('.card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      if (!id || !allowedIds[id]) {
        card.remove();
      }
    });

    var existingIds = {};
    grid.querySelectorAll('.card[data-product-id]').forEach(function (card) {
      existingIds[card.getAttribute('data-product-id')] = true;
    });

    products.forEach(function (p) {
      if (existingIds[p.id]) return;
      var url = window.noirProductUrl ? window.noirProductUrl(p) : 'product.html?id=' + encodeURIComponent(p.id);
      var line =
        p.line ||
        (String(p.description || '')
          .split('.')[0]
          .trim() || 'Eau de Parfum');
      var opts = window.noirGetSizeOptions ? window.noirGetSizeOptions(p) : [];
      var base =
        opts.find(function (x) {
          return x.ml === p.baseMl;
        }) || opts[0];
      var priceStr =
        base && window.noirFormatMoney ? window.noirFormatMoney(base.price, p.currency || 'LE') : '';
      var out = window.noirProductHasInStockSize && !window.noirProductHasInStockSize(p);
      var btnLabel = out ? 'Out of Stock' : 'Add to Cart';
      var cardHtml =
        '<div class="card" data-product-id="' +
        String(p.id).replace(/"/g, '&quot;') +
        '">' +
        '<div class="image">' +
        '<a href="' +
        url +
        '"><img src="' +
        String(window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : p.image).replace(/"/g, '&quot;') +
        '" alt="' +
        String(p.name).replace(/"/g, '&quot;') +
        '" onerror="this.onerror=null;this.src=\'../Images/image.webp\'"></a></div>' +
        '<h3><a href="' +
        url +
        '">' +
        escapeHtml(p.name) +
        '</a></h3>' +
        '<p>' +
        escapeHtml(line) +
        '</p>' +
        '<span class="price">' +
        priceStr +
        '</span>' +
        '<button type="button"' +
        (out ? ' class="btn-add-cart--out"' : '') +
        '>' +
        btnLabel +
        '</button></div>';
      grid.insertAdjacentHTML('beforeend', cardHtml);
    });

    grid.querySelectorAll('.card[data-product-id]').forEach(function (card) {
      var id = card.getAttribute('data-product-id');
      var p = window.noirGetProductById ? window.noirGetProductById(id) : null;
      if (!p) return;
      var url = window.noirProductUrl ? window.noirProductUrl(p) : 'product.html?id=' + encodeURIComponent(id);
      var h3a = card.querySelector('h3 a');
      if (h3a) {
        h3a.textContent = p.name;
        h3a.setAttribute('href', url);
      }
      var imgA = card.querySelector('.image a');
      if (imgA) imgA.setAttribute('href', url);
      var sub = card.querySelector('p');
      if (sub) {
        var line =
          p.line ||
          (String(p.description || '')
            .split('.')[0]
            .trim() || 'Eau de Parfum');
        sub.textContent = line;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectFavoritesDrawer();
    wireShopProductLinks();
    syncShopGridWithCatalog();
    syncShopCardPricesLE();
    syncShopCardSizeLine();
    wrapShopCardMedia();
    document.querySelectorAll('.products-area .products-grid .card button').forEach(function (btn) {
      var oc = btn.getAttribute('onclick');
      if (oc && oc.indexOf('addToCart') === 0) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function () {
          noirAddFromShopCard(btn);
        });
      }
    });
    initShopCardTools();
    wireFavoritesTriggers();
    renderCart();
    updateCartCount();
  });
})();
