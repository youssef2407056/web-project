const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const productController = require("./productController");

function cartItemsToJson(items) {
  return (items || []).map(function (item) {
    return {
      productId: String(item.product._id || item.product),
      name: item.name || "",
      price: Number(item.price) || 0,
      qty: item.quantity || 1,
      sizeMl: item.sizeMl || "—",
      image: item.image || "",
      currency: item.currency || "LE"
    };
  });
}

function priceForSize(formatted, sizeMl) {
  const sizes = formatted.sizes || [];
  const key = sizeMl != null ? String(sizeMl) : "";
  const match =
    sizes.find(function (s) {
      return String(s.ml) === key;
    }) ||
    sizes.find(function (s) {
      return s.ml === formatted.baseMl;
    }) ||
    sizes[0];
  if (match && match.price != null) return Number(match.price);
  return null;
}

async function refreshCartItemPrices(items) {
  const refreshed = [];

  for (const item of items || []) {
    const productId = item.product && item.product._id ? item.product._id : item.product;
    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      refreshed.push(item);
      continue;
    }

    const product = await Product.findById(productId);

    // If product was deleted or hidden by admin, silently drop it from the cart
    if (!product || product.isHidden) {
      continue;
    }

    const formatted = productController.formatProductForStorefront(product);
    const livePrice = priceForSize(formatted, item.sizeMl);
    const next = {
      product: product._id,
      name: product.name,
      price: livePrice != null ? livePrice : Number(item.price) || 0,
      quantity: item.quantity || 1,
      sizeMl: item.sizeMl || "—",
      image: product.image || item.image || "",
      currency: item.currency || "LE"
    };

    refreshed.push(next);
  }

  return refreshed;
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

function normalizeIncomingItem(raw) {
  if (!raw || !raw.productId) return null;
  if (!mongoose.Types.ObjectId.isValid(String(raw.productId))) return null;
  return {
    product: raw.productId,
    name: String(raw.name || "").trim(),
    price: Number(raw.price) || 0,
    quantity: Math.max(1, Number(raw.qty || raw.quantity || 1)),
    sizeMl: raw.sizeMl != null ? String(raw.sizeMl) : "—",
    image: String(raw.image || ""),
    currency: String(raw.currency || "LE")
  };
}

exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.session.user.id);
    cart.items = await refreshCartItemPrices(cart.items);
    await cart.save();

    res.json({
      success: true,
      cart: cartItemsToJson(cart.items)
    });
  } catch (err) {
    next(err);
  }
};

exports.syncCart = async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body.items) ? req.body.items : [];
    const items = incoming.map(normalizeIncomingItem).filter(Boolean);
    const pricedItems = await refreshCartItemPrices(items);

    const cart = await Cart.findOneAndUpdate(
      { user: req.session.user.id },
      { user: req.session.user.id, items: pricedItems },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      cart: cartItemsToJson(cart.items)
    });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const incoming = normalizeIncomingItem(req.body);
    if (!incoming) {
      return res.status(400).json({ success: false, message: "Invalid product." });
    }

    const cart = await getOrCreateCart(req.session.user.id);
    const key = incoming.product + "|" + incoming.sizeMl;
    const existing = cart.items.find(function (item) {
      return String(item.product) + "|" + String(item.sizeMl) === key;
    });

    if (existing) {
      existing.quantity += incoming.quantity;
      existing.name = incoming.name || existing.name;
      existing.price = incoming.price || existing.price;
      existing.image = incoming.image || existing.image;
      existing.currency = incoming.currency || existing.currency;
    } else {
      cart.items.push(incoming);
    }

    cart.items = await refreshCartItemPrices(cart.items);
    await cart.save();

    res.json({
      success: true,
      cart: cartItemsToJson(cart.items)
    });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId, sizeMl } = req.body;
    const cart = await getOrCreateCart(req.session.user.id);
    const sizeKey = sizeMl != null ? String(sizeMl) : "—";

    cart.items = cart.items.filter(function (item) {
      const matchProduct = String(item.product) === String(productId);
      const matchSize = String(item.sizeMl || "—") === sizeKey;
      return !(matchProduct && matchSize);
    });

    await cart.save();
    res.json({
      success: true,
      cart: cartItemsToJson(cart.items)
    });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.session.user.id);
    cart.items = [];
    await cart.save();
    res.json({
      success: true,
      cart: []
    });
  } catch (err) {
    next(err);
  }
};