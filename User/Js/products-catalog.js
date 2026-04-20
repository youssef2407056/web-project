/**
 * Noir Perfume — product catalog (home + shop grid).
 * Paths are relative to the active HTML document.
 */
(function () {
  if (typeof window !== 'undefined' && typeof window.noirUserHtmlPrefix !== 'string') {
    var __path = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    window.noirUserHtmlPrefix = /(^|\/)home\.html$/.test(__path) ? 'User/Html/' : '';
  }

  function htmlPage(name) {
    return (typeof window !== 'undefined' && window.noirUserHtmlPrefix ? window.noirUserHtmlPrefix : '') + name;
  }

  function shopImg(path) {
    if (path.startsWith('../')) return path;
    if (typeof window !== 'undefined' && window.noirUserHtmlPrefix) {
      return 'User/Images/' + path;
    }
    return '../Images/' + path;
  }

  /** 30 / 50 / 100 ml with 100 ml anchor clamped to LE 500–2000. */
  function sizeTrio(price100) {
    var p100 = Math.min(2000, Math.max(500, Math.round(Number(price100))));
    var p30 = Math.round(p100 * 0.42);
    var p50 = Math.round(p100 * 0.68);
    if (p50 <= p30) p50 = p30 + 200;
    if (p100 <= p50) p100 = Math.min(2000, p50 + 400);
    return [
      { ml: 30, price: p30 },
      { ml: 50, price: p50 },
      { ml: 100, price: p100 },
    ];
  }

  function pseudoRandomFromKey(key) {
    var s = String(key || '');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  }

  function applyRandomSizeStock(product) {
    if (!product || !Array.isArray(product.sizes)) return product;
    var out = product.inStock === false;
    product.sizes = product.sizes.map(function (s) {
      if (out) return { ml: s.ml, price: s.price, inStock: false };
      var r = pseudoRandomFromKey(product.id + '|' + s.ml);
      return { ml: s.ml, price: s.price, inStock: r >= 0.35 };
    });
    if (!out && !product.sizes.some(function (s) { return s.inStock !== false; })) {
      var idx = product.sizes.findIndex(function (s) { return s.ml === product.baseMl; });
      if (idx < 0) idx = 0;
      if (product.sizes[idx]) product.sizes[idx].inStock = true;
    }
    return product;
  }

  var HOME_PRODUCTS = {};

  if (typeof window !== 'undefined' && window.noirUserHtmlPrefix) {
    Object.keys(HOME_PRODUCTS).forEach(function (k) {
      var im = HOME_PRODUCTS[k].image;
      if (typeof im === 'string' && im.indexOf('../Images/') === 0) {
        HOME_PRODUCTS[k].image = im.replace(/^\.\.\/Images\//, 'User/Images/');
      }
    });
  }

  /** Shop grid order 0–29 — LE 500–2000 (100 ml anchor); varied per line. */
  var SHOP_ROWS = [
    { name: 'The Scent Hugo', img: 'Boss.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 1240, inStock: true },
    { name: 'Nicarage', img: 'Boss3.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 680 },
    { name: 'Vanilla', img: 'Boss2.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 1580 },
    { name: 'Intense Eau De Parfume', img: 'Boss44.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 920 },
    { name: 'Lucky Christian Dior', img: 'luky.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 1890, inStock: false },
    { name: 'New Look Christian Dior', img: 'Doir.jpg', line: 'Unisex Eau de Parfum', p100: 540 },
    { name: 'Dioriviera Christian Dior', img: 'diorevaa.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 1420 },
    { name: 'GIRE PERSUM Chanel', img: 'channel1.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 1730 },
    { name: 'N°5 Chanel', img: 'channel2.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 610, inStock: false },
    { name: 'COCO Mademoiselle Chanel', img: 'channal3.unisex.jpeg', line: 'Unisex Eau de Parfum', p100: 1950 },
    { name: 'El Mejor Perfume Boss', img: 'boss1.forwomen.jpg', line: 'Women Eau de Parfum', p100: 880 },
    { name: 'Boss The Scent Elixir for Her', img: 'boss2.forwomen.jpg', line: 'Women Eau de Parfum', p100: 1320, inStock: false },
    { name: 'MA VIE pour Femme Boss', img: 'boss3.forwomen.jpg', line: 'Women Eau de Parfum', p100: 1150 },
    { name: 'Miss Dior Blooming Bouquet', img: 'dior1forwomen.jpg', line: 'Women Eau de Parfum', p100: 1640 },
    { name: 'Eau de Parfum Jasmin & Peach', img: 'dior222forwemen.jpg', line: 'Women Eau de Parfum', p100: 720 },
    { name: 'Hypnotic Poison Dior', img: 'dior3forwomen.jpg', line: 'Women Eau de Parfum', p100: 1490, inStock: false },
    { name: 'EAU Splendide Chanel', img: 'chanel1forwomen.jpg', line: 'Women Eau de Parfum', p100: 1080 },
    { name: 'GABRIELLE Chanel', img: 'chanel2forwomen.jpg', line: 'Women Eau de Parfum', p100: 1810 },
    { name: 'COCO Noir Chanel', img: 'chanel3forwomen.jpg', line: 'Women Eau de Parfum', p100: 950 },
    { name: 'N°19 Chanel', img: 'chanel4forwomen.jpg', line: 'Women Eau de Parfum', p100: 2000, inStock: false },
    { name: 'SELECTION', img: 'boss1.men.jpg', line: 'Men Eau de Parfum', p100: 1190 },
    { name: 'BOSS Bottled Elixir', img: 'Boss2.men.jpg', line: 'Men Eau de Parfum', p100: 1360 },
    { name: 'Bottled Absolu', img: 'Boss3.men.jpg', line: 'Men Eau de Parfum', p100: 1740, inStock: false },
    { name: 'Platinum Égoïste', img: 'channel.men.jpg', line: 'Men Eau de Parfum', p100: 890 },
    { name: 'Allure Homme Sport', img: 'channel1.men.jpg', line: 'Men Eau de Parfum', p100: 1270 },
    { name: 'Bleu de Chanel', img: 'channel2.men.jpg', line: 'Men Eau de Parfum', p100: 1540, inStock: false },
    { name: "Blos D'ARGANT", img: 'Dior1.men.jpg', line: 'Men Eau de Parfum', p100: 1050 },
    { name: 'Fahrenhein', img: 'Dior2.men.jpg', line: 'Men Eau de Parfum', p100: 1920 },
    { name: 'Dior HOMME', img: 'Dior3.men.jpg', line: 'Men Eau de Parfum', p100: 660 },
    { name: 'Dior Sauvage', img: 'Dior4.men.jpg', line: 'Men Eau de Parfum', p100: 1410, inStock: false },
  ];

  var SHOP_PRODUCTS = {};
  SHOP_ROWS.forEach(function (row, index) {
    var id = 'shop-' + index;
    var sizes = sizeTrio(row.p100);
    SHOP_PRODUCTS[id] = {
      id: id,
      shopIndex: index,
      name: row.name,
      image: shopImg(row.img),
      line: row.line,
      category: 'shop',
      currency: 'LE',
      description: row.line + '. Designer and niche quality from the Noir collection.',
      sizes: sizes,
      baseMl: 100,
      cartName: row.name,
      inStock: row.inStock !== false,
    };
  });

  Object.keys(HOME_PRODUCTS).forEach(function (k) {
    applyRandomSizeStock(HOME_PRODUCTS[k]);
  });
  Object.keys(SHOP_PRODUCTS).forEach(function (k) {
    applyRandomSizeStock(SHOP_PRODUCTS[k]);
  });

  var ALL = Object.assign({}, HOME_PRODUCTS, SHOP_PRODUCTS);

  var ADMIN_CATALOG_KEY = 'noir_admin_catalog';

  function loadAdminCatalogState() {
    try {
      var raw = localStorage.getItem(ADMIN_CATALOG_KEY);
      if (!raw) return { removed: [], overrides: {}, custom: {} };
      var o = JSON.parse(raw);
      return {
        removed: Array.isArray(o.removed) ? o.removed : [],
        overrides: o.overrides && typeof o.overrides === 'object' ? o.overrides : {},
        custom: o.custom && typeof o.custom === 'object' ? o.custom : {},
      };
    } catch (e) {
      return { removed: [], overrides: {}, custom: {} };
    }
  }

  function saveAdminCatalogState(state) {
    try {
      localStorage.setItem(ADMIN_CATALOG_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function normalizeShopGenderFields(p) {
    if (!p) return p;
    var g = (p.shopPageGender != null ? p.shopPageGender : p.category);
    if (typeof g === 'string') {
      g = g.toLowerCase().trim();
      if (g === 'men' || g === 'women' || g === 'unisex') {
        p.shopPageGender = g;
        p.category = g;
      }
    }
    return p;
  }

  function deepMergeProduct(base, over) {
    var out = Object.assign({}, base);
    Object.keys(over).forEach(function (k) {
      if (k === 'sizes' && Array.isArray(over.sizes)) {
        out.sizes = over.sizes.map(function (s) {
          return Object.assign({}, s);
        });
      } else if (over[k] !== undefined) {
        out[k] = over[k];
      }
    });
    out.adminManaged = true;
    if (over.shopPageGender || (over.category && over.category !== 'shop')) {
      normalizeShopGenderFields(out);
    }
    return out;
  }

  function applyAdminCatalog(ALL_REF) {
    var st = loadAdminCatalogState();
    Object.keys(st.overrides).forEach(function (id) {
      if (!ALL_REF[id]) return;
      ALL_REF[id] = deepMergeProduct(ALL_REF[id], st.overrides[id]);
    });
    Object.keys(st.custom).forEach(function (id) {
      var p = st.custom[id];
      if (!p || !p.id) return;
      ALL_REF[p.id] = normalizeShopGenderFields(Object.assign({}, p, { adminManaged: true }));
    });
    st.removed.forEach(function (id) {
      delete ALL_REF[id];
    });
  }

  applyAdminCatalog(ALL);

  function inferGenderFromLine(line) {
    var t = (line || '').toLowerCase();
    if (/\bwomen\b|pour femme|for her/.test(t)) return 'women';
    if (/\bmen\b|homme|for him/.test(t)) return 'men';
    if (/\bunisex\b/.test(t)) return 'unisex';
    return 'unisex';
  }

  function inferGenderFromProduct(p) {
    if (!p) return 'unisex';
    var sg = p.shopPageGender;
    if (typeof sg === 'string') {
      sg = sg.toLowerCase().trim();
      if (sg === 'men' || sg === 'women' || sg === 'unisex') return sg;
    }
    if (p.category === 'men' || p.category === 'women' || p.category === 'unisex') return p.category;
    if (p.category === 'shop' && p.shopIndex != null && SHOP_ROWS[p.shopIndex]) {
      return inferGenderFromLine(SHOP_ROWS[p.shopIndex].line);
    }
    if (p.line) return inferGenderFromLine(p.line);
    return 'unisex';
  }

  /** Home hero / flash products stay off shop grids; shop rows + admin custom appear on Shop pages. */
  function shouldListOnShop(p) {
    if (!p) return false;
    if (String(p.id).indexOf('custom-') === 0) return true;
    if (p.shopIndex != null) return true;
    if (p.category === 'shop') return true;
    if (p.shopListing === true) return true;
    return false;
  }

  function noirGetProductsForShopPage(kind) {
    var k = (kind || 'shopall').toLowerCase();
    if (k === 'all') k = 'shopall';
    var out = [];
    Object.keys(ALL).forEach(function (id) {
      var p = ALL[id];
      if (!p) return;
      if (!shouldListOnShop(p)) return;
      var g = inferGenderFromProduct(p);
      if (k === 'shopall') {
        out.push(p);
      } else if (g === k) {
        out.push(p);
      }
    });
    out.sort(function (a, b) {
      var ai = a.shopIndex != null ? a.shopIndex : 9999;
      var bi = b.shopIndex != null ? b.shopIndex : 9999;
      if (ai !== bi) return ai - bi;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return out;
  }

  function noirGetProductById(id) {
    if (id == null) return null;
    return ALL[String(id)] || null;
  }

  function noirGetSizeOptions(product) {
    if (!product || !product.sizes) return [];
    return product.sizes.map(function (s) {
      return { ml: s.ml, price: s.price, inStock: s.inStock !== false };
    });
  }

  function noirIsSizeInStock(product, ml) {
    if (!product || !Array.isArray(product.sizes)) return false;
    var numMl = parseInt(ml, 10);
    var size = product.sizes.find(function (s) { return parseInt(s.ml, 10) === numMl; });
    if (!size) return false;
    return size.inStock !== false;
  }

  /** Prefer baseMl when in stock, else any in-stock size — for grid / favorites add-to-cart. */
  function noirPickInStockSizeOption(product) {
    if (!product || product.inStock === false) return null;
    if (!Array.isArray(product.sizes) || product.sizes.length === 0) return null;
    var opts = noirGetSizeOptions(product);
    var o =
      opts.find(function (x) { return x.ml === product.baseMl && x.inStock; }) ||
      opts.find(function (x) { return x.inStock; }) ||
      null;
    return o;
  }

  function noirProductHasInStockSize(product) {
    if (!product || product.inStock === false) return false;
    if (!Array.isArray(product.sizes) || product.sizes.length === 0) return true;
    return product.sizes.some(function (s) { return s.inStock !== false; });
  }

  function noirFormatMoney(amount, currency) {
    var sym = currency || 'LE';
    var n = Number(amount);
    if (sym === '$') return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (sym === 'LE') return 'LE ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return sym + ' ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function noirGetShopProductByIndex(index) {
    var i = parseInt(index, 10);
    if (i < 0 || i >= SHOP_ROWS.length) return null;
    return ALL['shop-' + i] || null;
  }

  var imageToShopIndex = {};
  SHOP_ROWS.forEach(function (row, index) {
    var key = String(row.img).toLowerCase();
    if (imageToShopIndex[key] === undefined) imageToShopIndex[key] = index;
  });

  function noirGetShopIndexForImage(filename) {
    if (!filename) return null;
    var key = String(filename).toLowerCase().split('/').pop();
    var i = imageToShopIndex[key];
    return i === undefined ? null : i;
  }

  function noirProductUrl(p) {
    if (!p) return htmlPage('Shopall.html');
    if (p.shopIndex != null) return htmlPage('product.html?shop=' + p.shopIndex);
    return htmlPage('product.html?id=' + encodeURIComponent(p.id));
  }

  function normalizeImagePath(pathLike) {
    var v = String(pathLike || '').trim();
    if (!v) return '';
    var filename = v.replace(/\\/g, '/').split('/').pop();
    if (!filename) return '';
    if (typeof window !== 'undefined' && window.noirUserHtmlPrefix) {
      return 'User/Images/' + filename;
    }
    return '../Images/' + filename;
  }

  function noirResolveProductImage(productOrId, rawImage) {
    var p = null;
    if (productOrId && typeof productOrId === 'object') p = productOrId;
    else if (productOrId != null) p = noirGetProductById(productOrId);
    if (p && typeof p.image === 'string' && p.image.trim()) return normalizeImagePath(p.image);
    if (typeof rawImage === 'string' && rawImage.trim()) return normalizeImagePath(rawImage);
    return normalizeImagePath(shopImg('image.webp'));
  }

  function noirSearchProducts(query, limit) {
    var t = (query || '').trim().toLowerCase();
    if (!t) return [];
    var out = [];
    Object.keys(ALL).forEach(function (k) {
      if (out.length >= (limit || 20)) return;
      var p = ALL[k];
      if (p && p.name && p.name.toLowerCase().indexOf(t) !== -1) out.push(p);
    });
    return out;
  }


  /* ── Scent notes per product ───────────────────────────────────── */
  var SCENT_NOTES = {
    'shop-0':  { top: ['Ginger','Cardamom'], heart: ['Freesia','Iris'], base: ['Sandalwood','Patchouli'] },
    'shop-1':  { top: ['Pepper','Lemon'], heart: ['Florals','Geranium'], base: ['Vetiver','Oakmoss'] },
    'shop-2':  { top: ['Vanilla','Coconut'], heart: ['Tonka Bean','Iris'], base: ['Musk','Benzoin'] },
    'shop-3':  { top: ['Bergamot','Lavender'], heart: ['Rose','Cedar'], base: ['Amber','Oakmoss'] },
    'shop-4':  { top: ['Peach','Bergamot'], heart: ['Rose','Jasmine'], base: ['Musk','Sandalwood'] },
    'shop-5':  { top: ['Aldehydes','Bergamot'], heart: ['Ylang-Ylang','Iris'], base: ['Vetiver','Civet'] },
    'shop-6':  { top: ['Sea Notes','Bergamot'], heart: ['Jasmine','Rose'], base: ['Musk','Cedarwood'] },
    'shop-7':  { top: ['Aldehydes','Neroli'], heart: ['Rose','Jasmine'], base: ['Sandalwood','Vetiver'] },
    'shop-8':  { top: ['Aldehydes','Bergamot'], heart: ['Jasmine','Ylang-Ylang'], base: ['Sandalwood','Oakmoss'] },
    'shop-9':  { top: ['Orange','Bergamot'], heart: ['Rose','Jasmine'], base: ['Vanilla','Amber'] },
    'shop-10': { top: ['Raspberry','Grapefruit'], heart: ['Peony','Magnolia'], base: ['Musk','Cedar'] },
    'shop-11': { top: ['Ginger','Bergamot'], heart: ['Caramel','Jasmine'], base: ['Amber','Sandalwood'] },
    'shop-12': { top: ['Pear','Peach'], heart: ['Rose','Lily of the Valley'], base: ['Cedarwood','Musk'] },
    'shop-13': { top: ['Melon','Peony'], heart: ['Rose','Lily'], base: ['White Musk','Amber'] },
    'shop-14': { top: ['Jasmine','Peach'], heart: ['Rose','Magnolia'], base: ['Musk','Sandalwood'] },
    'shop-15': { top: ['Almond','Plum'], heart: ['Jasmine','Vanilla'], base: ['Musk','Vetiver'] },
    'shop-16': { top: ['Grapefruit','Mandarin'], heart: ['Jasmine','Iris'], base: ['Sandalwood','Musk'] },
    'shop-17': { top: ['Bergamot','Violet Leaf'], heart: ['Rose','Iris'], base: ['Vetiver','Oak'] },
    'shop-18': { top: ['Orange','Aldehydes'], heart: ['Rose','Patchouli'], base: ['Musk','Vetiver'] },
    'shop-19': { top: ['Aldehydes','Bergamot'], heart: ['Iris','Rose'], base: ['Sandalwood','Musk'] },
    'shop-20': { top: ['Lavender','Bergamot'], heart: ['Geranium','Clary Sage'], base: ['Vetiver','Cedarwood'] },
    'shop-21': { top: ['Lavender','Cardamom'], heart: ['Geranium','Birch'], base: ['Vetiver','Sandalwood'] },
    'shop-22': { top: ['Lavender','Apple'], heart: ['Geranium','Jasmine'], base: ['Sandalwood','Musk'] },
    'shop-23': { top: ['Bergamot','Basil'], heart: ['Geranium','Jasmine'], base: ['Sandalwood','Oakmoss'] },
    'shop-24': { top: ['Bergamot','Lemon'], heart: ['Jasmine','Iris'], base: ['Vetiver','Patchouli'] },
    'shop-25': { top: ['Grapefruit','Lemon'], heart: ['Jasmine','Dry Cedar'], base: ['Incense','Labdanum'] },
    'shop-26': { top: ['Bergamot','Violet'], heart: ['Iris','Cinnamon'], base: ['Amber','Tonka Bean'] },
    'shop-27': { top: ['Pepper','Lavender'], heart: ['Rose','Tobacco'], base: ['Vetiver','Leather'] },
    'shop-28': { top: ['Iris','Lavender'], heart: ['Cocoa','Vetiver'], base: ['Suede','Amber'] },
    'shop-29': { top: ['Bergamot','Pepper'], heart: ['Lavender','Iris'], base: ['Vetiver','Cedar'] },
  };

  (function mergeCustomScentNotes() {
    var st = loadAdminCatalogState();
    Object.keys(st.custom).forEach(function (id) {
      var p = st.custom[id];
      if (p && p.scentNotes && typeof p.scentNotes === 'object') {
        SCENT_NOTES[p.id] = p.scentNotes;
      }
    });
  })();

  window.noirScentNotes = SCENT_NOTES;

  window.noirGetProductById = noirGetProductById;
  window.noirGetSizeOptions = noirGetSizeOptions;
  window.noirFormatMoney = noirFormatMoney;
  window.noirGetShopProductByIndex = noirGetShopProductByIndex;
  window.noirSearchProducts = noirSearchProducts;
  window.noirProductUrl = noirProductUrl;
  window.noirResolveProductImage = noirResolveProductImage;
  window.noirHtmlPage = htmlPage;
  window.noirGetShopIndexForImage = noirGetShopIndexForImage;
  window.noirIsSizeInStock = noirIsSizeInStock;
  window.noirPickInStockSizeOption = noirPickInStockSizeOption;
  window.noirProductHasInStockSize = noirProductHasInStockSize;
  window.noirCatalogIds = Object.keys(ALL);
  window.noirAdminCatalogKey = ADMIN_CATALOG_KEY;
  window.noirLoadAdminCatalogState = loadAdminCatalogState;
  window.noirSaveAdminCatalogState = saveAdminCatalogState;
  window.noirGetProductsForShopPage = noirGetProductsForShopPage;
  window.noirInferGenderFromProduct = inferGenderFromProduct;
  window.noirSHOP_ROWS = SHOP_ROWS;
})();
