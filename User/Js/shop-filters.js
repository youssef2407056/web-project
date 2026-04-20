// Filter functionality for shop pages (search, price, availability, sort, shop-by gender)
var allProducts = [];

function getShopPageKind() {
  var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname.replace(/\\/g, '/') : '';
  var file = path.split('/').pop().toLowerCase();
  if (file === 'shopall.html') return 'shopall';
  if (file === 'men.html') return 'men';
  if (file === 'women.html') return 'women';
  if (file === 'unisex.html') return 'unisex';
  return 'other';
}

function genderFromCard(card) {
  var pid = card.getAttribute('data-product-id');

  if (pid && window.noirGetProductById) {
    var p = window.noirGetProductById(pid);

    if (p && p.category) {
      var c = String(p.category).toLowerCase().trim();

      if (c === 'men') return 'men';
      if (c === 'women') return 'women';
      if (c === 'unisex') return 'unisex';
    }
  }

  var lineEl = card.querySelector('p');
  var t = (lineEl && lineEl.innerText ? lineEl.innerText : '').toLowerCase();

  if (/\bwomen\b|\bwoman\b|pour femme|for her/.test(t)) return 'women';
  if (/\bunisex\b/.test(t)) return 'unisex';
  if (/\bmen\b|\bman\b|for him|homme/.test(t)) return 'men';

  return 'unknown';
}

function usesMixedCollectionFilter() {
  if (getShopPageKind() === 'shopall') return true;
  return document.body && document.body.getAttribute('data-shop-collections') === '1';
}

function getSelectedCollection() {
  var checked = document.querySelector('input[name="collectionFilter"]:checked');
  if (!checked) return 'all';
  return checked.value || 'all';
}

function setDefaultCollectionRadio() {
  var kind = getShopPageKind();
  var def = 'all';
  if (kind === 'men') def = 'men';
  else if (kind === 'women') def = 'women';
  else if (kind === 'unisex') def = 'unisex';
  var inputs = document.querySelectorAll('input[name="collectionFilter"]');
  if (!inputs.length) return;
  inputs.forEach(function (inp) {
    inp.checked = inp.value === def;
  });
}

function onCollectionFilterChange() {
  var kind = getShopPageKind();
  var v = getSelectedCollection();
  if (usesMixedCollectionFilter()) {
    applyFilters();
    return;
  }
  if (kind === 'men' && v === 'men') return;
  if (kind === 'women' && v === 'women') return;
  if (kind === 'unisex' && v === 'unisex') return;
  if (kind === 'other') return;
  var map = { all: 'Shopall.html', men: 'Men.html', women: 'Women.html', unisex: 'Unisex.html' };
  if (map[v]) window.location.href = map[v];
}

function collectProducts() {
  allProducts = [];
  var cards = document.querySelectorAll('.card');
  cards.forEach(function (card, index) {
    var titleEl = card.querySelector('h3');
    var priceEl = card.querySelector('.price');
    var title = titleEl ? titleEl.innerText : '';
    var priceText = priceEl ? priceEl.innerText : '';
    var price = parseFloat(String(priceText).replace(/[^0-9.-]/g, '')) || 0;
    var pid = card.getAttribute('data-product-id');
    var p = pid && window.noirGetProductById ? window.noirGetProductById(pid) : null;
    var inStock = p && typeof p.inStock === 'boolean' ? p.inStock : true;
    allProducts.push({
      element: card,
      title: title.toLowerCase(),
      price: price,
      gender: genderFromCard(card),
      inStock: inStock,
      originalIndex: index
    });
  });
  return allProducts;
}

function applyFilters() {
  var searchTerm = (document.getElementById('searchInput') && document.getElementById('searchInput').value
    ? document.getElementById('searchInput').value
    : ''
  ).toLowerCase();
  var minEl = document.getElementById('priceMin');
  var maxEl = document.getElementById('priceMax');
  var priceMin = minEl && minEl.value !== '' ? parseFloat(minEl.value) : 0;
  var priceMax = maxEl && maxEl.value !== '' ? parseFloat(maxEl.value) : Infinity;
  if (isNaN(priceMin)) priceMin = 0;
  if (isNaN(priceMax)) priceMax = Infinity;
  var sortBy = (document.getElementById('sortBy') && document.getElementById('sortBy').value) || 'default';
  var inStockEl = document.getElementById('inStock');
  var inStockOnly = inStockEl ? inStockEl.checked : false;
  var collection = getSelectedCollection();

  var filtered = allProducts.filter(function (product) {
    var matchesSearch = !searchTerm || product.title.indexOf(searchTerm) !== -1;
    var matchesPrice = product.price >= priceMin && product.price <= priceMax;
    var matchesStock = !inStockOnly || product.inStock;
    var matchesCollection = true;
    if (usesMixedCollectionFilter() && collection !== 'all') {
      matchesCollection = product.gender === collection;
    }
    return matchesSearch && matchesPrice && matchesStock && matchesCollection;
  });

  if (sortBy === 'price-low') {
    filtered.sort(function (a, b) { return a.price - b.price; });
  } else if (sortBy === 'price-high') {
    filtered.sort(function (a, b) { return b.price - a.price; });
  } else if (sortBy === 'name-asc') {
    filtered.sort(function (a, b) { return a.title.localeCompare(b.title); });
  } else if (sortBy === 'name-desc') {
    filtered.sort(function (a, b) { return b.title.localeCompare(a.title); });
  }

  updateProductVisibility(filtered);
  updateResultsCount(filtered.length, allProducts.length);
}

function updateProductVisibility(filteredProducts) {
  allProducts.forEach(function (product) {
    product.element.style.display = 'none';
  });
  filteredProducts.forEach(function (product) {
    product.element.style.display = 'block';
  });
}

function updateResultsCount(count, total) {
  var countElement = document.getElementById('resultsCount');
  if (!countElement) return;
  if (typeof total === 'number' && total > 0 && usesMixedCollectionFilter() && getSelectedCollection() !== 'all') {
    countElement.textContent = count + ' product' + (count !== 1 ? 's' : '') + ' · ' + total + ' total in catalog';
  } else {
    countElement.textContent = count + ' product' + (count !== 1 ? 's' : '') + ' shown';
  }
}

function resetFilters() {
  var searchInput = document.getElementById('searchInput');
  var minInput = document.getElementById('priceMin');
  var maxInput = document.getElementById('priceMax');
  var sortSelect = document.getElementById('sortBy');
  var inStock = document.getElementById('inStock');

  if (searchInput) searchInput.value = '';
  if (minInput) minInput.value = '';
  if (maxInput) maxInput.value = '';
  if (sortSelect) sortSelect.value = 'default';
  if (inStock) inStock.checked = false;

  document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(function (cb) {
    if (cb.id !== 'inStock') cb.checked = false;
  });

  setDefaultCollectionRadio();
  applyFilters();
}

function searchProduct() {
  applyFilters();
}

document.addEventListener('DOMContentLoaded', function () {
  collectProducts();
  setDefaultCollectionRadio();
  applyFilters();

  var minInput = document.getElementById('priceMin');
  var maxInput = document.getElementById('priceMax');
  var sortSelect = document.getElementById('sortBy');
  var inStock = document.getElementById('inStock');
  var searchInput = document.getElementById('searchInput');

  if (minInput) minInput.addEventListener('input', applyFilters);
  if (maxInput) maxInput.addEventListener('input', applyFilters);
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);
  if (inStock) inStock.addEventListener('change', applyFilters);
  if (searchInput) searchInput.addEventListener('keyup', applyFilters);

  document.querySelectorAll('input[name="collectionFilter"]').forEach(function (radio) {
    radio.addEventListener('change', onCollectionFilterChange);
  });
});