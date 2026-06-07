/* ================= CART ================= */

(function () {
  var CART_KEY = 'noir_cart';
  var FAV_KEY = 'noir_favorites';

  function isLoggedIn() {
    return !!(window.noirSession && window.noirSession.loggedIn);
  }

  function clearAccountStorage() {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(FAV_KEY);
    renderCart();
    updateCartCount();
    var fs = document.getElementById('favorites-sidebar');
    if (fs && fs.classList.contains('open')) renderFavoritesDrawer();
  }

  document.addEventListener('click', function (e) {
    var logoutLink = e.target.closest('a[href="/auth/logout"]');
    if (logoutLink) clearAccountStorage();
  });

  function apiFetch(url, options) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
  }

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
          if (!item.name || String(item.name).trim() === '' || String(item.name) === 'undefined') return null;
          if (item.price == null || Number.isNaN(Number(item.price))) return null;
          var out = Object.assign({}, item);
          if (out.productId && window.noirGetProductById) {
            var p = window.noirGetProductById(out.productId);
            if (p) {
              out.name = p.name;
              if (!out.currency) out.currency = p.currency || 'LE';
              if (window.noirResolveProductImage) out.image = window.noirResolveProductImage(p, out.image || p.image || '');
              if (window.noirGetSizeOptions) {
                var opts = window.noirGetSizeOptions(p) || [];
                var mlKey = out.sizeMl != null ? String(out.sizeMl) : '';
                var match =
                  opts.find(function (o) {
                    return String(o.ml) === mlKey;
                  }) ||
                  opts.find(function (o) {
                    return o.ml === p.baseMl;
                  }) ||
                  opts[0];
                if (match && match.price != null && !Number.isNaN(Number(match.price))) {
                  var livePrice = Number(match.price);
                  if (livePrice !== Number(out.price)) {
                    out.price = livePrice;
                    changed = true;
                  }
                }
              }
            }
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
    if (isLoggedIn()) {
      apiFetch('/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      }).catch(function () {});
    }
  }

  function syncCartFromServer() {
    if (!isLoggedIn()) return Promise.resolve();
    return apiFetch('/cart')
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) return;
        var serverCart = Array.isArray(data.cart) ? data.cart : [];
        var local = getCart();
        if (local.length && !serverCart.length) {
          return apiFetch('/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: local })
          })
            .then(function (res) {
              return res.ok ? res.json() : null;
            })
            .then(function (synced) {
              if (synced && synced.success) {
                localStorage.setItem(CART_KEY, JSON.stringify(synced.cart || []));
              }
            });
        }
        localStorage.setItem(CART_KEY, JSON.stringify(serverCart));
      })
      .then(function () {
        renderCart();
        updateCartCount();
      })
      .catch(function () {});
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
          window.location.href = '/checkout';
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
        pid = window.noirResolveMongoProductId ? window.noirResolveMongoProductId(pid) : pid;
      }
    }
    if (!pid && window.noirResolveProductImage) img = window.noirResolveProductImage(null, img);
    if (!name || String(name).trim() === '' || String(name) === 'undefined') return false;
    if (price == null || Number.isNaN(Number(price))) return false;

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
document.addEventListener('click', function (e) {
  var button = e.target.closest('.btn-product-add');
  if (!button || button.dataset.cartBound === '1') return;
  if (!button.dataset.name || button.dataset.price == null || button.dataset.price === '') return;
  var name = button.dataset.name;
  var price = Number(button.dataset.price);
  if (!name || !price) return;
  addToCart(name, price, button.dataset.image, button.dataset.size, button.dataset.productId, {
    currency: button.dataset.currency || 'LE',
  });
});
/* ================= SHOP CARD HELPERS ================= */

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
      var productUrl = window.noirProductUrl && window.noirGetProductById
        ? window.noirProductUrl(window.noirGetProductById('shop-' + idx))
        : '/products/shop-' + idx;
      if (h3 && !h3.querySelector('a')) {
        h3.innerHTML = '<a href="' + productUrl + '">' + h3.textContent.trim() + '</a>';
      }
      var imgWrap = card.querySelector('.image');
      if (imgWrap && !imgWrap.querySelector('a')) {
        var imgLink = document.createElement('a');
        imgLink.href = productUrl;
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

/* ================= FAVORITES ================= */

  function getFavoriteIds() {
    try {
      var a = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function setFavoriteIds(ids) {
    var normalized = (ids || []).map(normalizeFavoriteId).filter(Boolean);
    var unique = normalized.filter(function (id, i) {
      return normalized.indexOf(id) === i;
    });
    localStorage.setItem(FAV_KEY, JSON.stringify(unique));
    if (isLoggedIn()) {
      apiFetch('/favorites/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: unique })
      }).catch(function () {});
    }
  }

  function toggleFavoriteOnServer(id) {
    if (!isLoggedIn()) return Promise.resolve(null);
    var mongoId = normalizeFavoriteId(id);
    return apiFetch('/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: mongoId })
    })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (data && data.success && Array.isArray(data.favorites)) {
          localStorage.setItem(FAV_KEY, JSON.stringify(data.favorites));
        }
        return data;
      })
      .catch(function () {
        return null;
      });
  }

  function syncFavoritesFromServer() {
    if (!isLoggedIn()) return Promise.resolve();
    return apiFetch('/favorites')
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) return;
        var serverFavs = Array.isArray(data.favorites) ? data.favorites : [];
        var local = getFavoriteIds();
        if (local.length && !serverFavs.length) {
          return apiFetch('/favorites/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ favorites: local })
          })
            .then(function (res) {
              return res.ok ? res.json() : null;
            })
            .then(function (synced) {
              if (synced && synced.success) {
                localStorage.setItem(FAV_KEY, JSON.stringify(synced.favorites || []));
              }
            });
        }
        localStorage.setItem(
          FAV_KEY,
          JSON.stringify(serverFavs.map(normalizeFavoriteId).filter(Boolean))
        );
      })
      .catch(function () {});
  }

  function normalizeFavoriteId(id) {
    if (id == null || id === '') return '';
    if (window.noirResolveMongoProductId) return String(window.noirResolveMongoProductId(id));
    return String(id);
  }

  function noirIsFavoriteId(id) {
    if (id == null || id === '') return false;
    var mongoId = normalizeFavoriteId(id);
    var ids = getFavoriteIds().map(normalizeFavoriteId);
    return ids.indexOf(mongoId) !== -1;
  }

  function noirToggleFavoriteId(id) {
    if (id == null || id === '') return false;
    var mongoId = normalizeFavoriteId(id);
    if (!mongoId) return false;

    var ids = getFavoriteIds().map(normalizeFavoriteId);
    var was = ids.indexOf(mongoId) !== -1;
    var next = was ? ids.filter(function (x) { return x !== mongoId; }) : ids.concat([mongoId]);

    localStorage.setItem(FAV_KEY, JSON.stringify(next));

    if (isLoggedIn()) {
      toggleFavoriteOnServer(mongoId).then(function () {
        var fs = document.getElementById('favorites-sidebar');
        if (fs && fs.classList.contains('open')) renderFavoritesDrawer();
        document.querySelectorAll('.card[data-product-id] .product__fav, #pdFav').forEach(function (heart) {
          var card = heart.closest('[data-product-id]');
          var cardId = card ? card.getAttribute('data-product-id') : null;
          var pdRoot = document.getElementById('productRoot');
          var reviewId = document.getElementById('reviewsSection') && document.getElementById('reviewsSection').getAttribute('data-product-id');
          var relatedId = cardId || reviewId;
          if (!relatedId) return;
          var on = noirIsFavoriteId(relatedId);
          heart.classList.toggle('product__fav--active', on);
          heart.classList.toggle('product-detail__fav--active', on);
          heart.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    } else {
      setFavoriteIds(next);
    }

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
      var mongoId = normalizeFavoriteId(id);
      var p = window.noirGetProductById ? window.noirGetProductById(mongoId) : null;
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
        '" alt="" onerror="this.onerror=null;this.src=\'/User/Images/logo1.jpg\'">' +
        '<div class="cart-item__body" style="flex:1;min-width:0">' +
        '<div class="item-info">' +
        '<div class="item-text">' +
        '<a class="item-name" href="' + url + '" style="text-decoration:none;color:inherit;font-weight:500;display:block">' +
        escapeHtml(p.name) + '</a>' +
        (priceStr ? '<span class="item-price fav-price">' + priceStr + '</span>' : '') +
        '</div>' +
        '<button type="button" class="remove-btn" data-fav-remove="' + escapeHtml(mongoId) + '" aria-label="Remove">✕</button>' +
        '</div>' +
        '<button type="button" class="btn-fav-add-cart' +
        (!canBuy ? ' btn-fav-add-cart--out' : '') +
        '" data-fav-cart="' +
        escapeHtml(mongoId) +
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
            return normalizeFavoriteId(x) !== normalizeFavoriteId(rid);
          })
        );
        document.querySelectorAll('[data-product-id] .product__fav').forEach(function (heart) {
          var c = heart.closest('[data-product-id]');
          if (c && noirIsFavoriteId(c.getAttribute('data-product-id'))) {
            heart.classList.add('product__fav--active');
            heart.setAttribute('aria-pressed', 'true');
          } else if (c) {
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
      sub.textContent = first ? first : 'Eau de Parfum';

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
        var onF = noirIsFavoriteId(id);
        fv.classList.toggle('product__fav--active', onF);
        fv.setAttribute('aria-pressed', onF ? 'true' : 'false');
        fv.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var on = noirToggleFavoriteId(id);
          fv.classList.toggle('product__fav--active', on);
          fv.setAttribute('aria-pressed', on ? 'true' : 'false');
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

  /** Build shop grid from static catalog + /User/Images (same as original HTML shop). */
  function renderShopGridFromCatalog() {
    var grid = document.querySelector('.products-area .products-grid, #productsGrid');
    if (!grid || !window.noirGetProductsForShopPage) return;

    var kind = (document.body && document.body.getAttribute('data-shop-kind')) || 'shopall';
    var brand = (document.body && document.body.getAttribute('data-brand')) || '';
    var products = window.noirGetProductsForShopPage(kind, brand);

    grid.innerHTML = '';

    if (!products.length) {
      grid.innerHTML = '<p class="empty-msg">No products found.</p>';
      var rc = document.getElementById('resultsCount');
      if (rc) rc.textContent = '0 products shown';
      return;
    }

    products.forEach(function (p) {
      var pid = String(p.id);
      var url = window.noirProductUrl ? window.noirProductUrl(p) : '/shop';
      var img = window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : p.image;
      var gender = window.noirInferGenderFromProduct ? window.noirInferGenderFromProduct(p) : 'unisex';
      var brandVal = window.noirInferBrandFromProduct ? window.noirInferBrandFromProduct(p) : '';
      var line = p.line || 'Eau de Parfum';
      var opts = window.noirGetSizeOptions ? window.noirGetSizeOptions(p) : [];
      var base = opts.find(function (x) { return x.ml === p.baseMl; }) || opts[0];
      var priceStr = base && window.noirFormatMoney ? window.noirFormatMoney(base.price, p.currency || 'LE') : '';
      var out = window.noirProductHasInStockSize ? !window.noirProductHasInStockSize(p) : p.inStock === false;
      var btnLabel = out ? 'Out of Stock' : 'Add to Cart';
      var btnClass = out ? ' class="btn-add-cart--out"' : '';

      grid.insertAdjacentHTML(
        'beforeend',
        '<div class="card" data-product-id="' +
          escapeHtml(pid) +
          '" data-category="' +
          escapeHtml(gender) +
          '" data-brand="' +
          escapeHtml(brandVal) +
          '" data-shop-index="' +
          (p.shopIndex != null ? String(p.shopIndex) : '') +
          '">' +
          '<div class="image"><a href="' +
          url +
          '"><img src="' +
          escapeHtml(img) +
          '" alt="' +
          escapeHtml(p.name) +
          '" onerror="this.onerror=null;this.src=\'/User/Images/logo1.jpg\'"></a></div>' +
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
          btnClass +
          '>' +
          btnLabel +
          '</button></div>'
      );
    });

    var rc = document.getElementById('resultsCount');
    if (rc) {
      rc.textContent = products.length + ' product' + (products.length !== 1 ? 's' : '') + ' shown';
    }
  }

  function wireNavbarIcons() {
    var wrap = document.querySelector('.cart-icon-wrap');
    if (wrap && !wrap.dataset.cartBound && window.toggleCart) {
      wrap.dataset.cartBound = '1';
      var openCart = function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.toggleCart();
      };
      wrap.addEventListener('click', openCart);
      wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          openCart(e);
        }
      });
    }
  }

  /* ================= INIT / GLOBAL EXPORTS ================= */

  window.addToCart = addToCart;
  window.noirIsFavoriteId = noirIsFavoriteId;
  window.noirToggleFavoriteId = noirToggleFavoriteId;
  window.noirGetFavoriteIds = getFavoriteIds;
  window.noirSetFavoriteIds = setFavoriteIds;
  window.noirAddFromShopCard = noirAddFromShopCard;
  window.toggleCart = toggleCart;
  window.toggleFavorites = toggleFavorites;
  window.noirGetCart = getCart;
  window.noirSaveCart = saveCart;
  window.noirRefreshFavoritesDrawer = function () {
    var s = document.getElementById('favorites-sidebar');
    if (s && s.classList.contains('open')) renderFavoritesDrawer();
  };
  window.wrapShopCardMedia = wrapShopCardMedia;
  window.initShopCardTools = initShopCardTools;
  window.wireFavoritesTriggers = wireFavoritesTriggers;

  function bootShopPage() {
    injectFavoritesDrawer();
    wireNavbarIcons();
    renderShopGridFromCatalog();
    wrapShopCardMedia();
    document.querySelectorAll('.products-area .products-grid .card > button, #productsGrid .card > button').forEach(function (btn) {
      if (btn.dataset.cartBound) return;
      btn.dataset.cartBound = '1';
      btn.addEventListener('click', function () {
        noirAddFromShopCard(btn);
      });
    });
    initShopCardTools();
    wireFavoritesTriggers();
    renderCart();
    updateCartCount();
    if (typeof collectProducts === 'function' && typeof applyFilters === 'function') {
      collectProducts();
      applyFilters();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var catalogReady = window.noirCatalogReady ? window.noirCatalogReady() : Promise.resolve();
    var accountReady = Promise.all([syncCartFromServer(), syncFavoritesFromServer()]);
    Promise.all([catalogReady, accountReady]).then(bootShopPage);
  });

  window.addEventListener('noir-catalog-updated', function () {
    var items = getCart();
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart();
    updateCartCount();
    if (typeof collectProducts === 'function' && typeof applyFilters === 'function') {
      collectProducts();
      applyFilters();
    }
    if (typeof renderShopGridFromCatalog === 'function') renderShopGridFromCatalog();
  });

  window.addEventListener('noir-currency-change', function () {
    renderCart();
    updateCartCount();
    if (typeof renderShopGridFromCatalog === 'function') renderShopGridFromCatalog();
    if (typeof renderFavoritesDrawer === 'function') renderFavoritesDrawer();
    if (typeof collectProducts === 'function' && typeof applyFilters === 'function') {
      collectProducts();
      applyFilters();
    }
  });
})();