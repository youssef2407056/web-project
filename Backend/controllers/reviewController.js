const mongoose = require("mongoose");
const Review = require("../models/Review");

exports.getProductReviews = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.json({ success: true, reviews: [] });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.status(400).json({ success: false, message: "Invalid product." });
    }

    const { rating, comment, title } = req.body;
    const ratingNum = Number(rating);

    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const body = String(comment || "").trim();
    if (!body) {
      return res.status(400).json({ success: false, message: "Review text is required." });
    }

    const review = await Review.create({
      product: productId,
      user: req.session.user.id,
      rating: ratingNum,
      title: String(title || "").trim(),
      comment: body
    });

    const populated = await Review.findById(review._id).populate("user", "name");

    res.status(201).json({
      success: true,
      review: populated
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product."
      });
    }
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Review deleted."
    });
  } catch (err) {
    next(err);
  }
};
