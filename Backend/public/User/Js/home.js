const navbar = document.querySelector('.navbar');
const navToggle = document.getElementById('nav-toggle');
const navBackdrop = document.getElementById('nav-backdrop');
const navIcon = navToggle?.querySelector('i');

function updateNavbar() {
  if (!navbar) return;
  if (window.scrollY > 50) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
}

window.addEventListener('scroll', updateNavbar);
updateNavbar();

function setNavOpen(open) {
  if (!navbar || !navToggle) return;
  navbar.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (navIcon) {
    navIcon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  }
  document.body.style.overflow = open ? 'hidden' : '';
}

function isMobileNav() {
  return window.matchMedia('(max-width: 480px)').matches;
}

function isTabletNav() {
  return window.matchMedia('(max-width: 960px)').matches && !isMobileNav();
}

if (navToggle && navbar) {
  navToggle.addEventListener('click', () => {
    setNavOpen(!navbar.classList.contains('nav-open'));
  });
}

if (navBackdrop && navbar) {
  navBackdrop.addEventListener('click', () => setNavOpen(false));
}

document.querySelectorAll('.nav-item-shop > a').forEach((link) => {
  link.addEventListener('click', (e) => {
    if (!isMobileNav() && !isTabletNav()) return;
    const item = link.closest('.nav-item-shop');
    if (!item) return;
    if (!item.classList.contains('is-open')) {
      e.preventDefault();
      document.querySelectorAll('.nav-item-shop.is-open').forEach((el) => {
        if (el !== item) el.classList.remove('is-open');
      });
      item.classList.add('is-open');
    }
  });
});

const drawerSearchBtn = document.getElementById('nav-drawer-search');
if (drawerSearchBtn) {
  drawerSearchBtn.addEventListener('click', () => {
    setNavOpen(false);
    const panel = document.getElementById('globalSearchPanel');
    if (panel) {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      const input = document.getElementById('globalSearchInput');
      if (input) setTimeout(() => input.focus(), 50);
    }
  });
}

document.querySelectorAll('.nav-main a').forEach((link) => {
  link.addEventListener('click', () => {
    if (isMobileNav() || isTabletNav()) {
      const isShopParent = link.closest('.nav-item-shop') === link.parentElement && link.parentElement.classList.contains('nav-item-shop');
      if (isShopParent && isMobileNav() && !link.parentElement.classList.contains('is-open')) return;
      setNavOpen(false);
      document.querySelectorAll('.nav-item-shop.is-open').forEach((el) => el.classList.remove('is-open'));
    }
  });
});

const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('click', function (e) {
    // Only intercept scroll-to-top on the home page itself
    const pathLc = window.location.pathname.toLowerCase().replace(/\\/g, '/');
    const isHome = pathLc.endsWith('home.html') || pathLc === '/';
    if (isHome && document.getElementById('main-content')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setNavOpen(false);
    }
  });
}

document.querySelectorAll('.nav-main a[href*="#"]').forEach((anchor) => {
  const href = anchor.getAttribute('href');
  if (!href || href === '#') return;
  const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
  if (!hash || hash === '#') return;
  anchor.addEventListener('click', function (e) {
    const pathLc = window.location.pathname.toLowerCase();
    const onHome = pathLc === '/' || pathLc.endsWith('home.html');
    if (!onHome) return;
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setNavOpen(false);
      requestAnimationFrame(updateSectionNavActive);
    }
  });
});

function updateSectionNavActive() {
  if (!document.body.classList.contains('page-home')) return;

  const navHome = document.querySelector('.nav-main a[href="/"]');
  const navFlash = document.querySelector('.nav-main a[href="/#flash-sale"]');
  const flashSection = document.getElementById('flash-sale');
  const navOffset = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72) + 24;

  document.querySelectorAll('.nav-main a[href="/"], .nav-main a[href="/#flash-sale"]').forEach((link) => {
    link.classList.remove('active');
  });

  if (flashSection && window.scrollY >= flashSection.offsetTop - navOffset) {
    if (navFlash) navFlash.classList.add('active');
  } else if (navHome) {
    navHome.classList.add('active');
  }
}

window.addEventListener('scroll', updateSectionNavActive);
window.addEventListener('load', () => {
  requestAnimationFrame(updateSectionNavActive);
  setTimeout(updateSectionNavActive, 150);
});
window.addEventListener('hashchange', updateSectionNavActive);
window.updateSectionNavActive = updateSectionNavActive;

const contactForm = document.querySelector('#home-contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    this.reset();
  });
}

function wireHomeCartIcon() {
  const wrap = document.querySelector('.cart-icon-wrap');
  if (!wrap || wrap.dataset.cartBound || !window.toggleCart) return;
  wrap.dataset.cartBound = '1';
  const openCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.toggleCart();
  };
  wrap.addEventListener('click', openCart);
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openCart(e);
    }
  });
}

function initHomeProductCart() {
  document.querySelectorAll('.product[data-product-id] .btn-product-add').forEach((btn) => {
    if (btn.dataset.cartBound) return;
    btn.dataset.cartBound = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const article = btn.closest('.product');
      const pid = article?.getAttribute('data-product-id');
      if (!pid || !window.noirGetProductById || !window.noirGetSizeOptions || !window.addToCart) return;
      const p = window.noirGetProductById(pid);
      if (!p) return;
      if (p.inStock === false) return;
      const o = window.noirPickInStockSizeOption?.(p);
      if (!o || o.inStock === false) return;
      const added = window.addToCart(p.name, o.price, p.image, String(o.ml), p.id, { currency: p.currency || 'LE' });
      if (added) window.toggleCart?.();
    });
  });
}

function hydrateHomeStockButtons() {
  document.querySelectorAll('.product[data-product-id]').forEach((article) => {
    const id = article.getAttribute('data-product-id');
    const p = window.noirGetProductById?.(id);
    const btn = article.querySelector('.btn-product-add');
    if (!p || !btn) return;
    const out = window.noirProductHasInStockSize ? !window.noirProductHasInStockSize(p) : p.inStock === false;
    btn.disabled = false;
    btn.textContent = out ? 'Out of Stock' : 'Add to Cart';
    btn.classList.toggle('btn-product-add--out', out);
  });
}

function getFavorites() {
  if (window.noirGetFavoriteIds) return window.noirGetFavoriteIds();
  try {
    const raw = localStorage.getItem('noir_favorites');
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function setFavorites(ids) {
  if (window.noirSetFavoriteIds) {
    window.noirSetFavoriteIds(ids);
    return;
  }
  localStorage.setItem('noir_favorites', JSON.stringify(ids));
}

function isFavorite(id) {
  if (window.noirIsFavoriteId) return window.noirIsFavoriteId(id);
  return getFavorites().includes(id);
}

function toggleFavorite(productId) {
  if (window.noirToggleFavoriteId) return window.noirToggleFavoriteId(productId);
  let ids = getFavorites();
  if (ids.includes(productId)) ids = ids.filter((x) => x !== productId);
  else ids = [...ids, productId];
  setFavorites(ids);
  return ids.includes(productId);
}

function updateHeartButton(btn, filled) {
  btn.classList.toggle('product__fav--active', filled);
  btn.setAttribute('aria-pressed', filled ? 'true' : 'false');
}

function initProductHearts() {
  document.querySelectorAll('.product[data-product-id] .product__fav').forEach((btn) => {
    const id = btn.closest('.product')?.getAttribute('data-product-id');
    if (!id) return;
    updateHeartButton(btn, isFavorite(id));
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = toggleFavorite(id);
      updateHeartButton(btn, on);
      if (window.noirRefreshFavoritesDrawer) window.noirRefreshFavoritesDrawer();
    });
  });
}

function initQuickView() {
  document.querySelectorAll('.product[data-product-id] .product__qv').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.closest('.product')?.getAttribute('data-product-id');
      if (id && window.noirOpenQuickView) window.noirOpenQuickView(id);
    });
  });
}

function getInStockCatalogProducts() {
  const ids = window.noirCatalogIds || [];
  return ids
    .map((id) => (window.noirGetProductById ? window.noirGetProductById(id) : null))
    .filter((p) => p && p.inStock !== false);
}

function pickHomeProducts(count, options) {
  const opts = options || {};
  const exclude = opts.excludeIds || new Set();
  const all = getInStockCatalogProducts().filter((p) => !exclude.has(p.id));
  const featured = all.filter((p) => p.isFeatured);
  // Use featured products if any exist, otherwise fall back to all products
  const pool = featured.length > 0 ? featured : all;
  if (opts.fromEnd) return pool.slice(-count);
  return pool.slice(0, count);
}

function renderProductGrid(grid, picks) {
  if (!grid || !picks.length || !window.noirProductUrl) return;

  grid.innerHTML = picks
    .map((p) => {
      const url = window.noirProductUrl(p);
      const safeName = String(p.name || 'Product').replace(/"/g, '&quot;');
      const resolved = window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : (p.image || '');
      const safeImg = String(resolved).replace(/"/g, '&quot;');
      return `<article class="product" data-product-id="${p.id}">
        <div class="product__media">
          <a class="product__media-link" href="${url}">
            <img src="${safeImg}" alt="${safeName}" onerror="this.onerror=null;this.src='/User/Images/logo1.jpg';">
          </a>
          <div class="product__card-tools">
            <button type="button" class="product__qv" aria-label="Quick view">+</button>
            <button type="button" class="product__fav" aria-pressed="false" aria-label="Add to favorites"><span class="product__fav-icon" aria-hidden="true">❤</span></button>
          </div>
        </div>
        <h4><a href="${url}">${p.name}</a></h4>
        <p class="product-price-row"></p>
        <button type="button" class="btn-product-add">Add to Cart</button>
      </article>`;
    })
    .join('');
}

function renderFlashSaleFromShopCatalog() {
  const grid = document.querySelector('#flash-sale .products-grid');
  const picks = pickHomeProducts(8);
  renderProductGrid(grid, picks);
}

function renderBestSellersFromShopCatalog() {
  const grid = document.querySelector('#best-sellers .products-grid');

  const picks = (window.noirCatalogIds || [])
    .map(id => window.noirGetProductById(id))
    .filter(p => p && p.isBestSeller);

  renderProductGrid(grid, picks);
}

function hydrateFlashPrices() {
  document.querySelectorAll('#flash-sale .product[data-product-id]').forEach((article) => {
    const id = article.getAttribute('data-product-id');
    const p = window.noirGetProductById?.(id);
    const wrap = article.querySelector('.product-price-row');
    if (!p || !wrap) return;
    const opts = window.noirGetSizeOptions?.(p) || [];
    const base = opts.find((x) => x.ml === p.baseMl) || opts[0];
    if (!base) return;
    const nowValue = Number(base.price) || 0;
    if (!nowValue) return;
    const compareAt = p.compareAt != null ? Number(p.compareAt) : Math.round(nowValue * 1.25);
    const wasValue = compareAt > nowValue ? compareAt : Math.round(nowValue * 1.2);
    const now = window.noirFormatMoney?.(nowValue, p.currency) || '';
    const was = window.noirFormatMoney?.(wasValue, p.currency) || '';
    wrap.innerHTML = `<span class="price price--was">${was}</span><span class="price price--now">${now}</span>`;
  });
}

function hydrateListingPrices() {
  document.querySelectorAll('#best-sellers .product[data-product-id]').forEach((article) => {
    const id = article.getAttribute('data-product-id');
    const p = window.noirGetProductById?.(id);
    const wrap = article.querySelector('.product-price-row');
    if (!p || !wrap) return;
    const opts = window.noirGetSizeOptions?.(p) || [];
    const base = opts.find((x) => x.ml === p.baseMl) || opts[0];
    if (base && window.noirFormatMoney) wrap.innerHTML = `<span class="price price--now">${window.noirFormatMoney(base.price, p.currency)}</span>`;
  });
}

function initHomeProductSections() {
  renderFlashSaleFromShopCatalog();
  renderBestSellersFromShopCatalog();
  hydrateFlashPrices();
  hydrateListingPrices();
  hydrateHomeStockButtons();
  initHomeProductCart();
  initProductHearts();
  initQuickView();
}

function bootHomePage() {
  wireHomeCartIcon();
  const ready = window.noirCatalogReady ? window.noirCatalogReady() : Promise.resolve();
  ready
    .then(function () {
      if (!document.body.classList.contains('page-home')) return;
      initHomeProductSections();
    })
    .catch(function () {
      if (document.body.classList.contains('page-home')) initHomeProductSections();
    });
  requestAnimationFrame(updateSectionNavActive);
  setTimeout(updateSectionNavActive, 200);
}

document.addEventListener('DOMContentLoaded', bootHomePage);

window.addEventListener('noir-catalog-updated', function () {
  if (!document.body.classList.contains('page-home')) return;
  initHomeProductSections();
});

window.addEventListener('noir-currency-change', function () {
  if (!document.body.classList.contains('page-home')) return;
  hydrateFlashPrices();
  hydrateListingPrices();
});