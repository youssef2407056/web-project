const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const PromoCode = require("../models/PromoCode");

function renderPage(res, view, options = {}) {
  const data = { ...res.locals, ...options };
  return new Promise((resolve, reject) => {
    res.render(view, data, (err, html) => {
      if (err) return reject(err);
      if (res.headersSent) {
        return reject(new Error("Response already sent while rendering " + view));
      }
      res.send(html);
      resolve();
    });
  });
}

function handleAdminError(req, res, next, errorRedirect, err) {
  if (!err) {
    return res.redirect(errorRedirect);
  }

  const mongoDisconnected =
    err.name === "MongoNotConnectedError" ||
    err.name === "MongooseServerSelectionError" ||
    /not connected|ECONNREFUSED|ETIMEOUT/i.test(String(err.message || ""));

  if (mongoDisconnected) {
    req.session.error = "Database is not connected. Wait a moment and try again.";
    return res.redirect(errorRedirect);
  }

  if (err.name === "ValidationError") {
    const messages = err.errors
      ? Object.values(err.errors)
          .map((e) => e.message)
          .join(" ")
      : err.message;
    req.session.error = messages || "Validation failed.";
    return res.redirect(errorRedirect);
  }

  if (err.code === 11000) {
    req.session.error = "That value already exists (duplicate key).";
    return res.redirect(errorRedirect);
  }

  if (err.message && !err.message.includes("Response already sent")) {
    req.session.error = err.message;
    return res.redirect(errorRedirect);
  }

  return next(err);
}

function parseSizes(body) {
  const sizes = [];
  if (!body.sizes) return sizes;

  const raw = Array.isArray(body.sizes)
    ? body.sizes
    : Object.keys(body.sizes)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => body.sizes[key]);

  raw.forEach((row) => {
    if (!row || row.ml === "" || row.ml == null) return;
    sizes.push({
      ml: Number(row.ml),
      price: Number(row.price),
      stock: row.stock != null && row.stock !== "" ? Number(row.stock) : 0,
      inStock: Number(row.stock) > 0
    });
  });

  return sizes;
}

function normalizeProductBody(body, file, oldImage) {
const image = file ? file.path : (oldImage || body.image || body.imageUrl || "").trim();
  const brand = String(body.brand || "").toLowerCase().trim();
  const category = String(body.category || "").toLowerCase().trim();
  
  

  if (!body.name || !brand || !category) {
    throw new Error("Name, brand, category, and image are required.");
  }
 
  

  const sizes = parseSizes(body);
  const totalStock = sizes.reduce(
  (sum, s) => sum + (Number(s.stock) || 0),
  0
);

  const scentNotes = {
  top: String(body.topNotes || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean),

  heart: String(body.heartNotes || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean),

  base: String(body.baseNotes || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
};

  const payload = {
   name: String(body.name).trim(),
   brand,
   category,
   stock: totalStock,
    description: String(body.description || "").trim(),
    image,
    isFeatured: body.isFeatured === "on" || body.isFeatured === "true" || body.isFeatured === true,
    isBestSeller: body.isBestSeller === "on" ||body.isBestSeller === "true" ||body.isBestSeller === true,
    isHidden: body.isHidden === "on" || body.isHidden === "true" || body.isHidden === true,
    scentNotes
  };
  

  if (body.sizeMl != null && body.sizeMl !== "") {
    const sizeMl = Number(body.sizeMl);
    if (!Number.isNaN(sizeMl) && sizeMl > 0) {
      payload.sizeMl = sizeMl;
    }
  }

  if (sizes.length) {
    payload.sizes = sizes;
  } else {
    payload.sizes = [];
  }

  return payload;
}

function normalizeUserBody(body, options) {
  const requestedRole = String(body.role || "user").toLowerCase().trim();
  let role = "user";
  if (options && options.allowRoleManagement) {
    if (requestedRole === "superadmin") role = "superadmin";
    else if (requestedRole === "admin") role = "admin";
    else role = "user";
  }

  const payload = {
    name: String(body.name || "").trim(),
    email: String(body.email || "").toLowerCase().trim(),
    role
  };

  const password = String(body.password || "").trim();
  if (password) {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    payload.password = password;
  } else if (options && options.requirePassword) {
    throw new Error("Password is required.");
  }

  return payload;
}

function sessionUserId(req) {
  const u = req.session && req.session.user;
  if (!u) return "";
  return String(u.id || u._id || "");
}

function plainUsers(list) {
  return list.map((doc) => {
    const u = doc.toObject ? doc.toObject() : doc;
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    };
  });
}

function plainProducts(list) {
  return list.map((doc) => (doc.toObject ? doc.toObject() : doc));
}

exports.requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    req.session.error = "Database is not connected yet. Wait a moment and try again.";
    return res.redirect("/admin");
  }
  next();
};

exports.getDashboard = async (req, res, next) => {
  try {
    const isSuperAdmin = req.session.user && req.session.user.role === "superadmin";
    const counts = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      isSuperAdmin ? User.countDocuments() : Promise.resolve(0)
    ]);
    const productsCount = counts[0];
    const ordersCount = counts[1];
    const usersCount = counts[2];

    await renderPage(res, "admin/dashboard", {
      title: "Admin Dashboard · Noir Perfume",
      activePage: "admin",
      productsCount,
      ordersCount,
      usersCount
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin", err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    await renderPage(res, "admin/Product", {
      title: "Admin Products · Noir Perfume",
      activePage: "admin",
      products: plainProducts(products)
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/products", err);
  }
};

exports.getAddProduct = async (req, res, next) => {
  try {
    await renderPage(res, "admin/productForm", {
      title: "Add Product · Noir Perfume",
      activePage: "admin",
      editMode: false,
      product: null,
      _sizesJson: "[]"
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/products", err);
  }
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const payload = normalizeProductBody(req.body, req.file);
    await Product.create(payload);
    req.session.success = "Product added successfully.";
    return res.redirect("/admin/products");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/products/new", err);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      req.session.error = "Product not found.";
      return res.redirect("/admin/products");
    }

    const productObj = product.toObject();
    let sizesJson = "[]";
    if (Array.isArray(productObj.sizes) && productObj.sizes.length) {
      sizesJson = JSON.stringify(
        productObj.sizes.map((s) => ({
          ml: s.ml != null ? Number(s.ml) : "",
          price: s.price != null ? Number(s.price) : "",
          stock: s.stock != null ? Number(s.stock) : 0,
          inStock: s.inStock !== false
        }))
      );
    }

    await renderPage(res, "admin/productForm", {
      title: "Edit Product · Noir Perfume",
      activePage: "admin",
      editMode: true,
      product: productObj,
      _sizesJson: sizesJson
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/products", err);
  }
};

exports.putEditProduct = async (req, res, next) => {
  const editUrl = "/admin/products/" + req.params.id + "/edit";
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid product id.");
    }
    const existing = await Product.findById(req.params.id);
    const oldImage = existing ? existing.image : "";
    const payload = normalizeProductBody(req.body, req.file, oldImage);
   
    const updated = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    

    if (!updated) {
      req.session.error = "Product not found.";
      return res.redirect("/admin/products");
    }

    req.session.success = "Product updated successfully.";
    return res.redirect("/admin/products");
  } catch (err) {
    return handleAdminError(req, res, next, editUrl, err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid product id.");
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      req.session.error = "Product not found.";
    } else {
      req.session.success = "Product deleted successfully.";
    }
    return res.redirect("/admin/products");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/products", err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "name price")
      .sort({ createdAt: -1 });

    await renderPage(res, "admin/orders", {
      title: "Admin Orders · Noir Perfume",
      activePage: "admin",
      orders
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/orders", err);
  }
};

exports.getEditOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product", "name price");

    if (!order) {
      req.session.error = "Order not found.";
      return res.redirect("/admin/orders");
    }

    await renderPage(res, "admin/orderForm", {
      title: "Edit Order · Noir Perfume",
      activePage: "admin",
      order: order.toObject ? order.toObject() : order
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/orders", err);
  }
};

exports.putEditOrder = async (req, res, next) => {
  const editUrl = "/admin/orders/" + req.params.id + "/edit";
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid order id.");
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.session.error = "Order not found.";
      return res.redirect("/admin/orders");
    }

    const totalPrice = Number(req.body.totalPrice);
    if (Number.isNaN(totalPrice) || totalPrice < 0) {
      throw new Error("Total price must be a valid number.");
    }

    const allowedStatuses = ["pending", "shipped", "delivered", "cancelled"];

    order.customerName = String(req.body.customerName || "").trim();
    order.customerEmail = String(req.body.customerEmail || "").toLowerCase().trim();
    order.phone = String(req.body.phone || "").trim();
    order.shippingAddress = String(req.body.shippingAddress || "").trim();
    if (allowedStatuses.includes(req.body.status)) {
      order.status = req.body.status;
    }
    order.totalPrice = totalPrice;

    await order.save();
    req.session.success = "Order updated successfully.";
    return res.redirect("/admin/orders");
  } catch (err) {
    return handleAdminError(req, res, next, editUrl, err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid order id.");
    }
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      req.session.error = "Order not found.";
    } else {
      req.session.success = "Order deleted successfully.";
    }
    return res.redirect("/admin/orders");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/orders", err);
  }
};

exports.toggleProductHidden = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid product id.");
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.session.error = "Product not found.";
      return res.redirect("/admin/products");
    }
    product.isHidden = !Boolean(product.isHidden);
    await product.save();
    req.session.success = product.isHidden
      ? "Product hidden from the storefront."
      : "Product is visible on the storefront again.";
    return res.redirect("/admin/products");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/products", err);
  }
};

function normalizePromoBody(body) {
  const code = String(body.code || "")
    .replace(/[\s\u200b-\u200d\ufeff\u00a0]/g, "")
    .toUpperCase()
    .trim();
  const discountPercent = Number(body.discountPercent);

  if (!code || code.length < 2) {
    throw new Error("Promo code must be at least 2 characters.");
  }
  if (Number.isNaN(discountPercent) || discountPercent < 1 || discountPercent > 100) {
    throw new Error("Discount must be between 1 and 100 percent.");
  }

  return {
    code,
    discountPercent,
    active: body.active === "on" || body.active === "true" || body.active === true
  };
}

exports.getPromos = async (req, res, next) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
    await renderPage(res, "admin/promos", {
      title: "Promo Codes · Noir Perfume",
      activePage: "admin",
      promos
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/promos", err);
  }
};

exports.getAddPromo = async (req, res, next) => {
  try {
    await renderPage(res, "admin/promoForm", {
      title: "Add Promo Code · Noir Perfume",
      activePage: "admin",
      editMode: false,
      promo: null
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/promos", err);
  }
};

exports.postAddPromo = async (req, res, next) => {
  try {
    const data = normalizePromoBody(req.body);
    const existing = await PromoCode.findOne({ code: data.code });
    if (existing) {
      req.session.error = "That promo code already exists.";
      return res.redirect("/admin/promos/new");
    }
    await PromoCode.create(data);
    req.session.success = "Promo code created.";
    return res.redirect("/admin/promos");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/promos/new", err);
  }
};

exports.getEditPromo = async (req, res, next) => {
  try {
    const promo = await PromoCode.findById(req.params.id).lean();
    if (!promo) {
      req.session.error = "Promo code not found.";
      return res.redirect("/admin/promos");
    }
    await renderPage(res, "admin/promoForm", {
      title: "Edit Promo Code · Noir Perfume",
      activePage: "admin",
      editMode: true,
      promo
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/promos", err);
  }
};

exports.putEditPromo = async (req, res, next) => {
  const editUrl = "/admin/promos/" + req.params.id + "/edit";
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid promo id.");
    }
    const data = normalizePromoBody(req.body);
    const updated = await PromoCode.findByIdAndUpdate(
      req.params.id,
      { discountPercent: data.discountPercent, active: data.active },
      { new: true, runValidators: true }
    );
    if (!updated) {
      req.session.error = "Promo code not found.";
      return res.redirect("/admin/promos");
    }
    req.session.success = "Promo code updated.";
    return res.redirect("/admin/promos");
  } catch (err) {
    return handleAdminError(req, res, next, editUrl, err);
  }
};

exports.deletePromo = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid promo id.");
    }
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deleted) {
      req.session.error = "Promo code not found.";
    } else {
      req.session.success = "Promo code deleted.";
    }
    return res.redirect("/admin/promos");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/promos", err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();

    await renderPage(res, "admin/users", {
      title: "Admin Users · Noir Perfume",
      activePage: "admin",
      users,
      currentUserId: sessionUserId(req)
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/users", err);
  }
};

exports.getAddUser = async (req, res, next) => {
  try {
    await renderPage(res, "admin/userForm", {
      title: "Add User · Noir Perfume",
      activePage: "admin",
      editMode: false,
      siteUser: null
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/users", err);
  }
};

exports.postAddUser = async (req, res, next) => {
  try {
    const data = normalizeUserBody(req.body, {
      requirePassword: true,
      allowRoleManagement: true
    });
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      req.session.error = "Email already exists.";
      return res.redirect("/admin/users/new");
    }

    data.password = await bcrypt.hash(data.password, 12);
    await User.create(data);
    req.session.success = "User created successfully.";
    return res.redirect("/admin/users");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/users/new", err);
  }
};

exports.getEditUser = async (req, res, next) => {
  try {
    const siteUser = await User.findById(req.params.id).select("-password").lean();
    if (!siteUser) {
      req.session.error = "User not found.";
      return res.redirect("/admin/users");
    }

    await renderPage(res, "admin/userForm", {
      title: "Edit User · Noir Perfume",
      activePage: "admin",
      editMode: true,
      siteUser
    });
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/users", err);
  }
};

exports.putEditUser = async (req, res, next) => {
  const editUrl = "/admin/users/" + req.params.id + "/edit";
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid user id.");
    }
    const existing = await User.findById(req.params.id).select("role");
    if (!existing) {
      req.session.error = "User not found.";
      return res.redirect("/admin/users");
    }

    const data = normalizeUserBody(req.body, { allowRoleManagement: true });

    if (existing.role === "superadmin" && data.role !== "superadmin") {
      const superCount = await User.countDocuments({ role: "superadmin" });
      if (superCount <= 1) {
        req.session.error = "At least one super admin account must remain.";
        return res.redirect(editUrl);
      }
    }

    const update = { name: data.name, email: data.email, role: data.role };

    if (data.password) {
      update.password = await bcrypt.hash(data.password, 12);
    }

    const updated = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      req.session.error = "User not found.";
      return res.redirect("/admin/users");
    }

    if (sessionUserId(req) === String(updated._id)) {
      req.session.user = {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      };
    }

    req.session.success = "User updated successfully.";
    return res.redirect("/admin/users");
  } catch (err) {
    return handleAdminError(req, res, next, editUrl, err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new Error("Invalid user id.");
    }
    if (sessionUserId(req) === String(req.params.id)) {
      req.session.error = "You cannot delete your own account while signed in.";
      return res.redirect("/admin/users");
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      req.session.error = "User not found.";
    } else {
      req.session.success = "User deleted successfully.";
    }
    return res.redirect("/admin/users");
  } catch (err) {
    return handleAdminError(req, res, next, "/admin/users", err);
  }
};


