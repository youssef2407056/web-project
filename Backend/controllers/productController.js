const mongoose = require("mongoose");
const Product = require("../models/Product");

function sizeTrio(price100) {
  const p100 = Math.min(2000, Math.max(500, Math.round(Number(price100))));
  let p30 = Math.round(p100 * 0.42);
  let p50 = Math.round(p100 * 0.68);
  if (p50 <= p30) p50 = p30 + 200;
  if (p100 <= p50) p100 = Math.min(2000, p50 + 400);
  return [
    { ml: 30, price: p30, inStock: true },
    { ml: 50, price: p50, inStock: true },
    { ml: 100, price: p100, inStock: true }
  ];
}

function inferLine(product) {
  const category = product.category || "unisex";
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return label + " Eau de Parfum";
}

exports.formatProductForStorefront = function formatProductForStorefront(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  const id = String(p._id);
  const inStock =
  Array.isArray(p.sizes) &&
  p.sizes.some(s => Number(s.stock) > 0);
  let sizes = Array.isArray(p.sizes) && p.sizes.length
    ? p.sizes.map(function (s) {
        return {
  ml: s.ml,
  price: s.price,
  stock: Number(s.stock) || 0,
  inStock: Number(s.stock) > 0
};
      })
    : sizeTrio(p.price).map(function (s) {
        return { ml: s.ml, price: s.price, inStock: inStock };
      });

  return {
    id: id,
    _id: id,
    name: p.name,
    image: p.image,
    line: p.description || inferLine(p),
    category: p.category,
    shopPageGender: p.category,
    brand: p.brand,
    currency: "LE",
    description: p.description || inferLine(p),
    sizes: sizes,
    baseMl: 100,
    cartName: p.name,
    inStock: inStock,
    shopListing: true,
    stock: Number(p.stock) || 0,
    scentNotes: p.scentNotes || [],
    isFeatured: !!p.isFeatured,
    isBestSeller: !!p.isBestSeller
  };
};

exports.getStorefrontProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isHidden: { $ne: true } }).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: products.length,
      products: products.map(exports.formatProductForStorefront)
    });
  } catch (err) {
    next(err);
  }
};

function normalizeProductBody(body) {
  const image = (body.image || body.imageUrl || "").trim();
  return {
    name: String(body.name || "").trim(),
    price: Number(body.price),
    brand: String(body.brand || "").toLowerCase().trim(),
    category: String(body.category || "").toLowerCase().trim(),
    stock: Number(body.stock),
    description: String(body.description || "").trim(),
    image,
    sizeMl: body.sizeMl ? Number(body.sizeMl) : undefined
  };
}

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
};

exports.getCatalogProduct = (req, res, next) => {
  try {
    const catalogId = decodeURIComponent(req.params.catalogId || "");
    res.render("pages/product", {
      title: "Product · Noir Perfume",
      activePage: "shop",
      catalogId,
      productId: catalogId,
      product: null,
      useCatalog: true
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (String(id).indexOf("shop-") === 0) {
      return res.render("pages/product", {
        title: "Product · Noir Perfume",
        activePage: "shop",
        catalogId: id,
        productId: id,
        product: null,
        useCatalog: true
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.redirect("/products/" + encodeURIComponent(String(id)));
    }

    const product = await Product.findById(id);
    const productId = product ? String(product._id) : "";
    const pageProduct = product ? exports.formatProductForStorefront(product) : null;

    res.render("pages/product", {
      title: product ? `${product.name} · Noir Perfume` : "Product not found",
      activePage: "shop",
      catalogId: productId,
      productId,
      product,
      pageProduct,
      useCatalog: false
    });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(normalizeProductBody(req.body));
    if (req.accepts("json")) {
      return res.status(201).json({ success: true, product });
    }
    req.session.success = "Product created successfully.";
    res.redirect("/admin/products");
  } catch (err) {
    if (req.accepts("json")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      normalizeProductBody(req.body),
      { new: true, runValidators: true }
    );
    if (!product) {
      if (req.accepts("json")) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      req.session.error = "Product not found.";
      return res.redirect("/admin/products");
    }
    if (req.accepts("json")) {
      return res.status(200).json({ success: true, product });
    }
    req.session.success = "Product updated successfully.";
    res.redirect("/admin/products");
  } catch (err) {
    if (req.accepts("json")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      if (req.accepts("json")) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      req.session.error = "Product not found.";
      return res.redirect("/admin/products");
    }
    if (req.accepts("json")) {
      return res.status(200).json({ success: true, message: "Product deleted" });
    }
    req.session.success = "Product deleted successfully.";
    res.redirect("/admin/products");
  } catch (err) {
    if (req.accepts("json")) {
      return res.status(500).json({ success: false, message: err.message });
    }
    next(err);
  }
};
