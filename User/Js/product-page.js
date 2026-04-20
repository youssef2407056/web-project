(function () {
  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var shop = params.get('shop');
    var p = null;
    if (id && window.noirGetProductById) p = window.noirGetProductById(id);
    else if (shop != null && window.noirGetShopProductByIndex) p = window.noirGetShopProductByIndex(shop);
    return p;
  }

  function render() {
    var p = getQuery();
    var root = document.getElementById('productRoot');
    var nf = document.getElementById('productNotFound');
    if (!p) {
      if (root) root.style.display = 'none';
      if (nf) nf.style.display = 'block';
      return;
    }
    if (nf) nf.style.display = 'none';

    var img = document.getElementById('pdImg');
    var title = document.getElementById('pdTitle');
    var lead = document.getElementById('pdLead');
    var priceEl = document.getElementById('pdPrice');
    var select = document.getElementById('pdSize');
    if (img) {
      img.src = window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : p.image;
      img.alt = p.name;
      img.onerror = function () {
        this.onerror = null;
        this.src = '../Images/image.webp';
      };
    }
    if (title) title.textContent = p.name;
    if (lead) lead.textContent = p.description || '';

    // pass product id to reviews section
    var reviewsSection = document.getElementById('reviewsSection');
    if (reviewsSection) {
      reviewsSection.setAttribute('data-product-id', p.id);
      if (window.noirInitReviews) window.noirInitReviews(p.id);
    }

    // Fix 10: render scent notes
    var scentWrap = document.getElementById('pdScentNotes');
    var scentRows = document.getElementById('pdScentRows');
    var notes = (window.noirScentNotes && window.noirScentNotes[p.id]) || p.scentNotes;
    if (notes && scentWrap && scentRows) {
      scentWrap.style.display = 'block';
      var layers = [
        { label: 'Top notes', key: 'top', icon: '🌿' },
        { label: 'Heart notes', key: 'heart', icon: '🌸' },
        { label: 'Base notes', key: 'base', icon: '🪵' },
      ];
      scentRows.innerHTML = layers.map(function(layer) {
        var pills = (notes[layer.key] || []).map(function(n) {
          return '<span class="scent-pill">' + n + '</span>';
        }).join('');
        return '<div class="scent-row"><span class="scent-row__label">' + layer.icon + ' ' + layer.label + '</span><div class="scent-pills">' + pills + '</div></div>';
      }).join('');
    }

    var opts = window.noirGetSizeOptions ? window.noirGetSizeOptions(p) : [];
    var preferred = opts.find(function (x) {
      return x.ml === p.baseMl && x.inStock !== false;
    });
    var firstInStock = opts.find(function (x) {
      return x.inStock !== false;
    });
    var selectedMl = (preferred && preferred.ml) || (firstInStock && firstInStock.ml) || (opts[0] && opts[0].ml);

    // Replace <select> with button group
    if (select) {
      var sizeWrap = select.parentNode;
      select.style.display = 'none';
      var btnGroup = document.createElement('div');
      btnGroup.className = 'size-btn-group';
      opts.forEach(function (o) {
        var btn = document.createElement('button');
        var out = o.inStock === false;
        btn.type = 'button';
        btn.className = 'size-btn' + (o.ml === selectedMl ? ' size-btn--active' : '') + (out ? ' size-btn--out' : '');
        btn.setAttribute('data-ml', String(o.ml));
        btn.setAttribute('data-price', String(o.price));
        if (out) {
          btn.setAttribute('aria-label', o.ml + ' ml out of stock');
        }
        btn.textContent = o.ml + ' ml';
        btn.addEventListener('click', function () {
          btnGroup.querySelectorAll('.size-btn').forEach(function (b) { b.classList.remove('size-btn--active'); });
          btn.classList.add('size-btn--active');
          selectedMl = o.ml;
          updatePrice();
          refreshActionState();
        });
        btnGroup.appendChild(btn);
      });
      sizeWrap.appendChild(btnGroup);
    }

    function getActiveOpt() {
      var btnGroup = document.querySelector('.size-btn-group');
      if (!btnGroup) return opts[0];
      var active = btnGroup.querySelector('.size-btn--active');
      if (!active) return opts[0];
      return { ml: parseInt(active.getAttribute('data-ml'), 10), price: parseFloat(active.getAttribute('data-price')) };
    }

    function updatePrice() {
      if (!priceEl) return;
      var o = getActiveOpt();
      if (!o) {
        priceEl.textContent = '';
        return;
      }
      priceEl.textContent = window.noirFormatMoney ? window.noirFormatMoney(o.price, p.currency) : o.price;
    }
    updatePrice();

    // Quantity stepper wiring
    var pdQtyEl = document.getElementById('pdQty');
    var pdQtyVal = 1;
    if (pdQtyEl) pdQtyEl.textContent = '1';

    var decBtn = document.getElementById('pdQtyDec');
    var incBtn = document.getElementById('pdQtyInc');
    if (decBtn) {
      decBtn.addEventListener('click', function () {
        if (pdQtyVal > 1) { pdQtyVal--; if (pdQtyEl) pdQtyEl.textContent = pdQtyVal; }
      });
    }
    if (incBtn) {
      incBtn.addEventListener('click', function () {
        if (pdQtyVal < 99) { pdQtyVal++; if (pdQtyEl) pdQtyEl.textContent = pdQtyVal; }
      });
    }

    function readQty() {
      return pdQtyVal;
    }

    // Fix 11: render related items
    var relatedGrid = document.getElementById('relatedGrid');
    if (relatedGrid && window.noirCatalogIds) {
      var allIds = window.noirCatalogIds.filter(function(rid) { return rid !== p.id; });
      // prefer same category
      var samecat = allIds.filter(function(rid) {
        var rp = window.noirGetProductById(rid);
        return rp && rp.category === p.category;
      });
      var pool = samecat.length >= 4 ? samecat : allIds;
      // pick 4 random
      var picks = pool.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 4);
      relatedGrid.innerHTML = picks.map(function(rid) {
        var rp = window.noirGetProductById(rid);
        if (!rp) return '';
        var url = window.noirProductUrl ? window.noirProductUrl(rp) : 'product.html?id=' + encodeURIComponent(rid);
        var opts = window.noirGetSizeOptions ? window.noirGetSizeOptions(rp) : [];
        var baseOpt = opts.find(function(x){ return x.ml === rp.baseMl; }) || opts[0];
        var price = baseOpt && window.noirFormatMoney ? window.noirFormatMoney(baseOpt.price, rp.currency) : '';
        var imgSrc = window.noirResolveProductImage ? window.noirResolveProductImage(rp, rp.image) : rp.image;
        return '<article class="related-card"><a href="' + url + '" class="related-card__img-link"><img src="' + imgSrc + '" alt="' + rp.name + '" onerror="this.onerror=null;this.src=\'../Images/image.webp\'"></a><div class="related-card__body"><a href="' + url + '" class="related-card__name">' + rp.name + '</a><span class="related-card__price">' + price + '</span></div></article>';
      }).join('');
    }

    var favBtn = document.getElementById('pdFav');
    if (favBtn && p.id) {
      var onF = window.noirIsFavoriteId && window.noirIsFavoriteId(p.id);
      favBtn.classList.toggle('product-detail__fav--active', onF);
      favBtn.setAttribute('aria-pressed', onF ? 'true' : 'false');
      favBtn.addEventListener('click', function () {
        if (!window.noirToggleFavoriteId) return;
        var next = window.noirToggleFavoriteId(p.id);
        favBtn.classList.toggle('product-detail__fav--active', next);
        favBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
      });
    }

    function selectedOption() {
      return getActiveOpt();
    }

    var cur = p.currency || 'LE';
    var hasInStockSize = opts.some(function (x) {
      return x.inStock !== false;
    });
    var isOutOfStock = p.inStock === false || !hasInStockSize;
    function selectedSizeOutOfStock() {
      var o = selectedOption();
      if (!o) return true;
      return window.noirIsSizeInStock ? !window.noirIsSizeInStock(p, o.ml) : false;
    }

    function refreshActionState() {
      var blocked = isOutOfStock || selectedSizeOutOfStock();
      if (addCartBtn) {
        addCartBtn.disabled = false;
        addCartBtn.textContent = blocked ? 'Out of Stock' : 'Add to cart';
        addCartBtn.classList.toggle('btn-add-cart--out', blocked);
      }
      if (decBtn) decBtn.disabled = false;
      if (incBtn) incBtn.disabled = false;
    }

    var addCartBtn = document.getElementById('pdAddCart');
    var buyBtn = document.getElementById('pdBuyNow');
    if (addCartBtn) refreshActionState();
    if (buyBtn) {
      buyBtn.disabled = isOutOfStock;
      buyBtn.style.display = isOutOfStock ? 'none' : '';
    }

    if (addCartBtn) {
      addCartBtn.addEventListener('click', function () {
        if (isOutOfStock || selectedSizeOutOfStock()) return;
        var o = selectedOption();
        if (!o || (window.noirIsSizeInStock && !window.noirIsSizeInStock(p, o.ml))) return;
        var qty = readQty();
        if (window.addToCart) {
          var added = window.addToCart(p.name, o.price, p.image, String(o.ml), p.id, { currency: cur, qty: qty });
          if (added && window.toggleCart) window.toggleCart();
        }
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener('click', function () {
        if (isOutOfStock) return;
        var o = selectedOption();
        if (!o || (window.noirIsSizeInStock && !window.noirIsSizeInStock(p, o.ml))) return;
        var qty = readQty();
        if (window.addToCart) {
          var added = window.addToCart(p.name, o.price, p.image, String(o.ml), p.id, { currency: cur, qty: qty });
          if (added) window.location.href = window.noirHtmlPage ? window.noirHtmlPage('checkout.html') : 'checkout.html';
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();
