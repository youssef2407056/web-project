exports.notFound = (req, res) => {
  res.status(404).render("pages/404", {
    title: "Page Not Found"
  });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err);

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    req.session.error = "File is too large. Maximum size is 5MB.";
    return res.redirect("back");
  }

  if (err.message === "Only image files (jpg, png, webp) are allowed") {
    req.session.error = err.message;
    return res.redirect("back");
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message).join(" ");
    req.session.error = messages;
    return res.redirect("back");
  }

  // Generic server error
  res.status(err.statusCode || 500).render("pages/error", {
    title: "Server Error",
    message: err.message || "Something went wrong."
  });
};
