exports.validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters.");
  }

  if (!email || !email.includes("@")) {
    errors.push("Please enter a valid email.");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    errors.push("Password must include letters and numbers.");
  }

  if (errors.length > 0) {
    req.session.error = errors.join(" ");
    return res.redirect("/auth/signup");
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.includes("@")) {
    errors.push("Please enter a valid email.");
  }

  if (!password) {
    errors.push("Please enter your password.");
  }

  if (errors.length > 0) {
    req.session.error = errors.join(" ");
    return res.redirect("/auth/login");
  }

  next();
};

exports.validateProduct = (req, res, next) => {
  const { name, price, brand, category, stock } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push("Product name is required.");
  if (!brand) errors.push("Brand is required.");
  if (!category) errors.push("Category is required.");
  if (price === undefined || Number(price) < 0) errors.push("Price must be valid.");
  if (stock === undefined || Number(stock) < 0) errors.push("Stock must be valid.");

  if (errors.length > 0) {
    req.session.error = errors.join(" ");
    return res.redirect("back");
  }

  next();
};
