const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review product is required"]
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review user is required"]
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"]
    },

    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"]
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [1200, "Comment cannot exceed 1200 characters"]
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
