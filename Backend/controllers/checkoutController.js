const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const productController = require("./productController");
const { lookupActivePromo } = require("./promoController");

function livePriceFromProduct(product, sizeMl) {
  const formatted = productController.formatProductForStorefront(product);
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
  return Number(product.price) || 0;
}

function parseCartFromBody(body) {
  if (body && body.cartItems) {
    try {
      const parsed = JSON.parse(body.cartItems);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      /* ignore invalid JSON */
    }
  }
  return [];
}

exports.getCheckout = (req, res) => {
  res.render("pages/checkout", {
    title: "Checkout · Noir Perfume",
    activePage: "checkout"
  });
};

exports.placeOrder = async (req, res, next) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      req.session.error = "Please sign in first.";
      return res.redirect("/auth/login");
    }

    const { name, email, phone, address, paymentMethod, promoCode } = req.body;
    const cart = parseCartFromBody(req.body);

    if (cart.length === 0) {
      req.session.error = "Cart is empty.";
      return res.redirect("/checkout");
    }

    let totalPrice = 0;
    const orderProducts = [];
    const lineItems = [];

    for (const item of cart) {
      const qty = Math.max(1, Number(item.qty || item.quantity) || 1);
      let price = Number(item.price);
      const pid = item.productId ? String(item.productId) : "";

      if (!item.name) {
        req.session.error = "Invalid item in cart. Please remove it and try again.";
        return res.redirect("/checkout");
      }

      if (pid && mongoose.Types.ObjectId.isValid(pid)) {
        const product = await Product.findById(pid);

        // Product was hard-deleted by admin
        if (!product) {
          req.session.error = `An item in your cart ("${item.name}") no longer exists. Please remove it and try again.`;
          return res.redirect("/checkout");
        }

        // Block checkout if admin removed or hid the product
        if (product.isHidden) {
          req.session.error = `"${product.name}" is no longer available. Please remove it from your cart.`;
          return res.redirect("/checkout");
        }

        price = livePriceFromProduct(product, item.sizeMl);

        if (product.stock < qty) {
          req.session.error = `Not enough stock for ${product.name}.`;
          return res.redirect("/checkout");
        }

        if (Array.isArray(product.sizes) && item.sizeMl) {
          const selectedSize = product.sizes.find(
            s => String(s.ml) === String(item.sizeMl)
          );

          if (!selectedSize || selectedSize.stock < qty) {
            req.session.error =
              `Not enough stock for ${product.name} (${item.sizeMl}ml).`;
            return res.redirect("/checkout");
          }
        }

        orderProducts.push({
          product: product._id,
          quantity: qty
        });
      }

      if (!price || Number.isNaN(price)) {
        req.session.error = "Invalid item in cart. Please remove it and try again.";
        return res.redirect("/checkout");
      }

      lineItems.push({
        productId: pid || undefined,
        name: item.name,
        price,
        quantity: qty,
        sizeMl: item.sizeMl != null ? String(item.sizeMl) : "",
        image: item.image || "",
        currency: item.currency || "LE"
      });

      totalPrice += price * qty;
    }

    let appliedPromo = "";
    let discountPercent = 0;
    const promo = await lookupActivePromo(promoCode);
    if (promo) {
      appliedPromo = promo.code;
      discountPercent = promo.discountPercent;
      totalPrice = totalPrice * (1 - discountPercent / 100);
    }

    await Order.create({
      user: req.session.user.id,
      products: orderProducts,
      lineItems,
      customerName: name,
      customerEmail: email,
      phone,
      shippingAddress: address,
      paymentMethod: paymentMethod || "cash",
      totalPrice: Math.round(totalPrice * 100) / 100,
      promoCode: appliedPromo,
      discountPercent,
      status: "pending"
    });

    for (const item of lineItems) {
  if (!item.productId) continue;

  const product = await Product.findById(item.productId);

  if (!product) continue;

 const qty = Number(item.quantity) || 0;

if (Array.isArray(product.sizes)) {
  const size = product.sizes.find(
    s => String(s.ml) === String(item.sizeMl)
  );

  if (size) {
    size.stock = Math.max(0, (size.stock || 0) - qty);
    size.inStock = size.stock > 0;
  }

  product.stock = product.sizes.reduce(
    (sum, s) => sum + (Number(s.stock) || 0),
    0
  );
}
product.markModified("sizes");
product.markModified("stock");

await product.save();
}

    await Cart.findOneAndUpdate(
      { user: req.session.user.id },
      { items: [] },
      { upsert: true }
    );

    req.session.success = "Order placed successfully.";

    res.redirect("/checkout/thanks");
  } catch (err) {
    next(err);
  }
};

exports.getThanks = (req, res) => {
  res.render("pages/thankyou", {
    title: "Thank you · Noir Perfume"
  });
};