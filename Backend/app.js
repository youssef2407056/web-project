require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);


const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");
const methodOverride = require("method-override");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

/* =========================
   DATABASE CONNECTION
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

/* =========================
   VIEW ENGINE
========================= */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   MIDDLEWARE (before routes)
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use((req, res, next) => {
  const override =
    (req.body && req.body._method) ||
    (req.query && req.query._method);
  if (override) {
    req.method = String(override).toUpperCase();
  }
  next();
});

if (!process.env.SESSION_SECRET && isProduction) {
  console.warn("Warning: SESSION_SECRET is not set. Set it in production for secure sessions.");
}

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "noir_secret_key",
    name: "noir.sid",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: isProduction,
      sameSite: "lax",
      httpOnly: true
    }
  })
);

app.use((req, res, next) => {
  const sessionUser = req.session.user || null;
  res.locals.user = sessionUser;
  res.locals.isSuperAdmin = !!(sessionUser && sessionUser.role === "superadmin");
  res.locals.currentUserId = sessionUser
    ? String(sessionUser.id || sessionUser._id || "")
    : "";
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

/* =========================
   ROUTES (before static files)
========================= */

const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const productController = require("./controllers/productController");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const externalApiRoutes = require("./routes/externalApiRoutes");
const promoController = require("./controllers/promoController");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

/* Legacy catalog URL → canonical /products/:id */
app.get("/shop/product/:catalogId", (req, res) => {
  res.redirect(301, "/products/" + encodeURIComponent(req.params.catalogId || ""));
});

app.use("/", pageRoutes);
app.use("/auth", authRoutes);
app.get("/api/products", productController.getStorefrontProducts);
app.get("/api/promos/validate/:code", promoController.validatePromoCode);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", orderRoutes);
app.use("/cart", cartRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/reviews", reviewRoutes);
app.use("/api/external", externalApiRoutes);

/* Static assets after dynamic routes */
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   404 PAGE
========================= */

app.use(notFound);

/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

function renderErrorPage(res, payload) {
  res.status(500).render("pages/error", payload, (renderErr, html) => {
    if (renderErr) {
      console.error("Error page render failed:", renderErr);
      return res.status(500).send("Server Error: " + payload.message);
    }
    res.send(html);
  });
}

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 3000;

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
