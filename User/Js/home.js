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

if (navToggle && navbar) {
  navToggle.addEventListener('click', () => {
    setNavOpen(!navbar.classList.contains('nav-open'));
  });
}

if (navBackdrop && navbar) {
  navBackdrop.addEventListener('click', () => setNavOpen(false));
}

document.querySelectorAll('.nav-main a').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      setNavOpen(false);
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

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  const href = anchor.getAttribute('href');
  if (!href || href === '#') return;
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setNavOpen(false);
    }
  });
});

function updateSectionNavActive() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-main ul li a[href^="#"]');

  let current = '';
  sections.forEach((section) => {
    const top = section.offsetTop;
    if (window.scrollY >= top - 120) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateSectionNavActive);
window.addEventListener('load', () => {
  requestAnimationFrame(updateSectionNavActive);
  setTimeout(updateSectionNavActive, 150);
});
window.addEventListener('hashchange', updateSectionNavActive);

const contactForm = document.querySelector('#home-contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    this.reset();
  });
}

const cartIcon = document.getElementById('cart-icon-home');
if (cartIcon && window.toggleCart) {
  const openCart = () => window.toggleCart();
  cartIcon.addEventListener('click', openCart);
  cartIcon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCart();
    }
  });
}

function initHomeProductCart() {
  document.querySelectorAll('.product[data-product-id] .btn-product-add').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
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
  try {
    const raw = localStorage.getItem('noir_favorites');
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function setFavorites(ids) {
  localStorage.setItem('noir_favorites', JSON.stringify(ids));
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(productId) {
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

function renderFlashSaleFromShopCatalog() {
  const grid = document.querySelector('#flash-sale .products-grid');
  if (!grid || !window.noirGetProductById || !window.noirProductUrl) return;

  const picks = [];
  for (let i = 0; i < 30; i++) {
    const p = window.noirGetProductById(`shop-${i}`);
    if (!p || p.inStock === false) continue;
    picks.push(p);
    if (picks.length === 4) break;
  }
  if (picks.length === 0) return;

  grid.innerHTML = picks
    .map((p) => {
      const url = window.noirProductUrl(p);
      const safeName = String(p.name || 'Product').replace(/"/g, '&quot;');
      const resolved = window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : (p.image || '');
      const safeImg = String(resolved).replace(/"/g, '&quot;');
      return `<article class="product" data-product-id="${p.id}">
        <div class="product__media">
          <a class="product__media-link" href="${url}">
            <img src="${safeImg}" alt="${safeName}" onerror="this.onerror=null;this.src='User/Images/image.webp';">
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

function renderBestSellersFromShopCatalog() {
  const grid = document.querySelector('#best-sellers .products-grid');
  if (!grid || !window.noirGetProductById || !window.noirProductUrl) return;

  const flashIds = new Set();
  for (let i = 0; i < 30; i++) {
    const p = window.noirGetProductById(`shop-${i}`);
    if (!p || p.inStock === false) continue;
    flashIds.add(p.id);
    if (flashIds.size === 4) break;
  }

  const picks = [];
  for (let i = 29; i >= 0; i--) {
    const p = window.noirGetProductById(`shop-${i}`);
    if (!p || p.inStock === false || flashIds.has(p.id)) continue;
    picks.push(p);
    if (picks.length === 4) break;
  }
  if (picks.length === 0) return;

  grid.innerHTML = picks
    .map((p) => {
      const url = window.noirProductUrl(p);
      const safeName = String(p.name || 'Product').replace(/"/g, '&quot;');
      const resolved = window.noirResolveProductImage ? window.noirResolveProductImage(p, p.image) : (p.image || '');
      const safeImg = String(resolved).replace(/"/g, '&quot;');
      return `<article class="product" data-product-id="${p.id}">
        <div class="product__media">
          <a class="product__media-link" href="${url}">
            <img src="${safeImg}" alt="${safeName}" onerror="this.onerror=null;this.src='User/Images/image.webp';">
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

document.addEventListener('DOMContentLoaded', function () {
  renderFlashSaleFromShopCatalog();
  renderBestSellersFromShopCatalog();
  hydrateFlashPrices();
  hydrateListingPrices();
  hydrateHomeStockButtons();
  initHomeProductCart();
  initProductHearts();
  initQuickView();
  requestAnimationFrame(updateSectionNavActive);
  setTimeout(updateSectionNavActive, 200);
});
